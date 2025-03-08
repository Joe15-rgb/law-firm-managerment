import { PrismaClient, UserRole, type User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { getCache, invalidateCacheByPrefix, setCache } from '@tools/cache';
import { ErrorWithStatus, NotFoundError } from '@tools/errors';
import { cuid, deletePublicFile, serializePassword } from '@tools/helpers';
import { generateAvatar } from '@tools/jdenticon';
import { requestLogger } from '@tools/logger';
import type { ResultData } from '@bases/index';
import { CACHE_TTL } from '@configs/env_config';

type OmitPropritys = 'id' | 'joinedAt' | 'updatedAt';

class UserPrismaServices {
   private CACHE_TTL = CACHE_TTL;
   private CACHE_PREFIX = 'user:';
   private LIST_CACHE_PREFIX = 'users:all:';
   private PATH_USER_THUMBNAIL = 'public/users';
   private prisma: PrismaClient;

   constructor(prisma?: PrismaClient) {
      this.prisma = prisma || new PrismaClient();
   }

   private async handleListCacheInvalidation() {
      await invalidateCacheByPrefix(this.LIST_CACHE_PREFIX);
   }

   private async verifyIfUserExistInDatabase(id: string, email?: string) {
      try {
         if (email) {
            const user = await this.prisma.user.findUnique({
               where: { email },
            });
            return !!user;
         }
         const user = await this.prisma.user.findUnique({
            where: { id },
         });
         return !!user;
      } catch (error) {
         console.error("Error lors de la vérification de l'utilisateur");
         return false;
      }
   }

   async createUser(data: Omit<User, OmitPropritys>): Promise<User | void> {
      try {
         const userData: Partial<User> = {
            ...data,
            thumbnail: generateAvatar(`${data.firstName}_${cuid()}`),
            password: serializePassword(data.password),
         };
         if (await this.verifyIfUserExistInDatabase(data.email))
            throw new ErrorWithStatus(
               'Un utilisateur existe avec cette email',
               400
            );
         const newUser = await this.prisma.user.create({
            data: userData as User,
         });

         requestLogger('User created', {
            userId: newUser.id,
            operation: 'create',
         });
         await this.handleListCacheInvalidation();
         return newUser;
      } catch (error) {
         if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2002'
         ) {
            throw new ErrorWithStatus(
               'Un utilisateur existe déjà avec cet email',
               400
            );
         }
         requestLogger('Error creating user', { error });
         throw error;
      }
   }

   async getOneUser(id: string) {
      const cacheKey = `${this.CACHE_PREFIX}${id}`;
      const cachedData: User = await getCache(cacheKey);

      if (cachedData) {
         const dbTimestamp = await this.prisma.user.findUnique({
            where: { id },
            select: { updatedAt: true },
         });
         if (
            dbTimestamp?.updatedAt?.toISOString() ===
            cachedData.updatedAt?.toISOString()
         ) {
            return cachedData;
         }
      }
      const user = await this.prisma.user.findUnique({
         where: { id },
      });

      if (!user) {
         requestLogger('User not found', { clientId: id });
         throw new NotFoundError('User non trouvé');
      }

      await setCache(cacheKey, user, this.CACHE_TTL);
      return user;
   }

   async getAllUsers(page = 1, limit = 10, role?: UserRole): Promise<ResultData<User>> {
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(Math.max(limit, 1), 100);
      const cacheKey = `${this.LIST_CACHE_PREFIX}${validatedPage}:${validatedLimit}`;
      const cachedData = await getCache(cacheKey);

      const [users, total] = await Promise.all([
         this.prisma.user.findMany({
            where: {
               role
            },
            skip: (validatedPage - 1) * validatedLimit,
            take: validatedLimit,
            orderBy: { joinedAt: 'desc' },
         }),
         this.prisma.user.count(),
      ]);
      const result: ResultData<User> = {
         data: users,
         meta: {
            total,
            page: validatedPage,
            totalPages: Math.ceil(total / validatedLimit),
            limit: validatedLimit,
         },
      };
      if (cachedData && JSON.stringify(result) === JSON.stringify(cachedData))
         return cachedData;

      await setCache(cacheKey, result, this.CACHE_TTL);
      return result;
   }
   async updateUser(id: string, data: Partial<User>): Promise<User> {
      try {
         const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
               firstName: true,
               thumbnail: true,
            },
         });
         if (data.firstName && user?.firstName !== data.firstName) {
            deletePublicFile(user?.firstName!, this.PATH_USER_THUMBNAIL);
            data.thumbnail = generateAvatar(`${data.firstName}_${cuid()}`);
         }
         const userUpdated = await this.prisma.user.update({
            where: { id },
            data,
         });

         requestLogger('User updated', {
            userId: id,
            operation: 'update',
         });

         await Promise.all([
            invalidateCacheByPrefix(`${this.CACHE_PREFIX}${id}`),
            this.handleListCacheInvalidation(),
         ]);

         return userUpdated;
      } catch (error) {
         if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2025'
         ) {
            requestLogger('Update failed - user not found', { userId: id });
            throw new NotFoundError('User non trouvé');
         }
         requestLogger('Error updating user', { error, userId: id });
         throw error;
      }
   }
   async deleteUser(id: string) {
      try {
         const user = await this.prisma.user.findUnique({
            where: { id },
            select: {
               firstName: true,
               thumbnail: true,
            },
         });
         if (!user) {
            throw new NotFoundError('User non trouvé');
         }
         await Promise.all([
            deletePublicFile(user?.firstName!, this.PATH_USER_THUMBNAIL),
            await this.prisma.user.delete({ where: { id } }),

            invalidateCacheByPrefix(`${this.CACHE_PREFIX}${id}`),
            this.handleListCacheInvalidation(),
         ]);

         return true;
      } catch (error) {
         if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2025'
         ) {
            requestLogger('Delete failed - user not found', { userId: id });
            throw new NotFoundError('User non trouvé');
         }
         requestLogger('Error deleting user', { error, clientId: id });
         throw error;
      }
   }
}
export default UserPrismaServices;
