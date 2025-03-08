import type { ResultData } from '@bases/index';
import { CACHE_TTL } from '@configs/env_config';
import {
   GroupUserRole,
   PrismaClient,
   UserRole,
   type Group,
   type GroupUser,
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { getCache, invalidateCacheByPrefix, setCache } from '@tools/cache';
import { ErrorWithStatus } from '@tools/errors';
import { requestLogger } from '@tools/logger';

type OmittedProperties = 'createdAt' | 'updatedAt';

interface GroupUserCreateRequest {
   id: string;
   role: GroupUserRole;
}

interface GroupCreateRequest {
   name: string;
   users: GroupUserCreateRequest[];
}

interface GroupUpdateRequest {
   name?: string;
   usersToAdd?: Array<{ userid: string; role: GroupUserRole; groupId: string }>;
   usersToUpdate?: Array<{ userId: string; role: GroupUserRole }>;
   usersToRemove?: string[];
}

class GroupPrismaService {
   private readonly CACHE_TTL = CACHE_TTL;
   private readonly CACHE_PREFIX = 'group:';
   private readonly LIST_CACHE_PREFIX = 'groups:all:';
   private prisma: PrismaClient;

   constructor(prisma?: PrismaClient) {
      this.prisma = prisma || new PrismaClient();
   }

   private async invalidateListCache(): Promise<void> {
      await invalidateCacheByPrefix(this.LIST_CACHE_PREFIX);
   }

   async createGroup(data: GroupCreateRequest): Promise<Group> {
      try {
         const { name, users } = data;

         const result = await this.prisma.$transaction(async (tx) => {
            const newGroup = await tx.group.create({ data: { name } });

            if (users.length > 0) {
               const userGroup: GroupUser[] = users.map((user) => {
                  return {
                     groupId: newGroup.id,
                     userid: user.id,
                     role: user.role,
                  };
               });

               await tx.groupUser.createMany({
                  data: userGroup,
               });
            }

            return tx.group.findUniqueOrThrow({
               where: { id: newGroup.id },
               include: {
                  GroupUser: {
                     include: { user: true },
                     orderBy: { user: { joinedAt: 'desc' } },
                  },
               },
            });
         });

         requestLogger('Group created successfully', {
            groupId: result.id,
            operation: 'create',
         });

         await this.invalidateListCache();
         return result;
      } catch (error) {
         if (error instanceof PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
               throw new ErrorWithStatus('Group name already exists', 409);
            }
            if (error.code === 'P2025') {
               throw new ErrorWithStatus('Invalid user data provided', 400);
            }
         }
         requestLogger('Error creating group', { error });
         throw new ErrorWithStatus('Failed to create group', 500);
      }
   }

   async getAllGroups(
      page = 1,
      limit = 10,
      role?: UserRole
   ): Promise<ResultData<Group>> {
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(Math.max(limit, 1), 100);
      const cacheKey = `${
         this.LIST_CACHE_PREFIX
      }${validatedPage}:${validatedLimit}:${role || 'all'}`;

      const cachedData = await getCache(cacheKey);

      const [groups, total] = await Promise.all([
         this.prisma.group.findMany({
            include: {
               GroupUser: {
                  include: { user: true },
                  where: role ? { user: { role } } : undefined,
               },
            },
            skip: (validatedPage - 1) * validatedLimit,
            take: validatedLimit,
            orderBy: { createdAt: 'desc' },
         }),
         this.prisma.group.count(),
      ]);

      const transformedData = groups.map((group) => ({
         id: group.id,
         name: group.name,
         createdAt: group.createdAt,
         updatedAt: group.updatedAt,
         members: group.GroupUser.map((groupUser) => ({
            ...groupUser.user,
            role_group: groupUser.role,
            role: groupUser.user.role,
         })),
         membersCount: group.GroupUser.length,
      }));

      const result = {
         data: transformedData,
         meta: {
            total,
            page: validatedPage,
            totalPages: Math.ceil(total / validatedLimit),
            limit: validatedLimit,
         },
      };

      await setCache(cacheKey, result, this.CACHE_TTL);

      if (cachedData && JSON.stringify(result) === JSON.stringify(cachedData))
         return cachedData;

      return result;
   }

   async getOneGroup(id: string): Promise<Group> {
      const cacheKey = `${this.CACHE_PREFIX}${id}`;
      const cachedData = await getCache(cacheKey);

      if (cachedData) return cachedData;

      const group = await this.prisma.group.findUnique({
         where: { id },
         include: {
            GroupUser: {
               include: { user: true },
               orderBy: { user: { joinedAt: 'desc' } },
            },
         },
      });

      if (!group) {
         throw new ErrorWithStatus('Group not found', 404);
      }

      const result = {
         id: group.id,
         name: group.name,
         createdAt: group.createdAt,
         updatedAt: group.updatedAt,
         members: group.GroupUser.map((groupUser) => ({
            ...groupUser.user,
            role_group: groupUser.role,
            role: groupUser.user.role,
         })),
         membersCount: group.GroupUser.length,
      };

      await setCache(cacheKey, result, this.CACHE_TTL);
      return result;
   }

   //  async updateGroup(
   //     id: string,
   //     data: GroupUpdateRequest
   //  ): Promise<Group & { GroupUser: GroupUser[] }> {
   //     try {
   //        const {
   //           name,
   //           usersToAdd = [],
   //           usersToUpdate = [],
   //           usersToRemove = [],
   //        } = data;

   //        const updatedGroup = await this.prisma.$transaction(async (tx) => {
   //           // Vérification de l'existence du groupe
   //           const existingGroup = await tx.group.findUniqueOrThrow({
   //              where: { id },
   //              include: { GroupUser: true },
   //           });

   //           // Mise à jour du nom si fourni
   //           if (name && name !== existingGroup.name) {
   //              await tx.group.update({
   //                 where: { id },
   //                 data: { name },
   //              });
   //           }

   //           // Opérations batch sur les membres
   //           const operations = [];

   //           if (usersToAdd.length > 0) {
   //              operations.push(
   //                 tx.groupUser.createMany({
   //                    data: usersToAdd.map((user) => ({
   //                       groupId: id,
   //                       userId: user.userid,
   //                       role: user.role,
   //                    })),
   //                    skipDuplicates: true,
   //                 })
   //              );
   //           }

   //           if (usersToUpdate.length > 0) {
   //              operations.push(
   //                 ...usersToUpdate.map((user) =>
   //                    tx.groupUser.update({
   //                       where: {
   //                          groupId_userId: {
   //                             groupId: id,
   //                             userId: user.userId,
   //                          },
   //                       },
   //                       data: { role: user.role },
   //                    })
   //                 )
   //              );
   //           }

   //           if (usersToRemove.length > 0) {
   //              operations.push(
   //                 tx.groupUser.deleteMany({
   //                    where: {
   //                       groupId: id,
   //                       userId: { in: usersToRemove },
   //                    },
   //                 })
   //              );
   //           }

   //           await Promise.all(operations);

   //           // Récupération de la version actualisée
   //           return tx.group.findUniqueOrThrow({
   //              where: { id },
   //              include: {
   //                 GroupUser: {
   //                    include: { user: true },
   //                 },
   //              },
   //           });
   //        });

   //        requestLogger('Group updated successfully', {
   //           groupId: id,
   //           changes: {
   //              nameUpdated: name !== undefined,
   //              membersAdded: usersToAdd.length,
   //              membersUpdated: usersToUpdate.length,
   //              membersRemoved: usersToRemove.length,
   //           },
   //        });

   //        await Promise.all([
   //           invalidateCacheByPrefix(`${this.CACHE_PREFIX}${id}`),
   //           this.invalidateListCache(),
   //        ]);

   //        return updatedGroup;
   //     } catch (error) {
   //        if (error instanceof PrismaClientKnownRequestError) {
   //           switch (error.code) {
   //              case 'P2025':
   //                 throw new ErrorWithStatus('Group not found', 404);
   //              case 'P2002':
   //                 throw new ErrorWithStatus('Group name already exists', 409);
   //              case 'P2016':
   //                 throw new ErrorWithStatus('Invalid member operation', 400);
   //           }
   //        }
   //        requestLogger('Error updating group', { error, groupId: id });
   //        throw new ErrorWithStatus('Failed to update group', 500);
   //     }
   //  }

   async deleteGroup(id: string): Promise<void> {
      try {
         await this.prisma.$transaction([
            this.prisma.groupUser.deleteMany({ where: { groupId: id } }),
            this.prisma.group.delete({ where: { id } }),
         ]);

         await Promise.all([
            invalidateCacheByPrefix(this.CACHE_PREFIX),
            this.invalidateListCache(),
         ]);
      } catch (error) {
         if (
            error instanceof PrismaClientKnownRequestError &&
            error.code === 'P2025'
         ) {
            throw new ErrorWithStatus('Group not found', 404);
         }
         throw new ErrorWithStatus('Failed to delete group', 500);
      }
   }
}

export default GroupPrismaService;
