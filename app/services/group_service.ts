import type { ResultData } from '@bases/index';
import { CACHE_TTL } from '@configs/env_config';
import {
   GroupRole,
   PrismaClient,
   UserRole,
   type Group,
   type GroupMember,
} from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { getCache, invalidateCacheByPrefix, setCache } from '@tools/cache';
import { ErrorWithStatus, NotFoundError } from '@tools/errors';
import { requestLogger } from '@tools/logger';

type OmittedProperties = 'createdAt' | 'updatedAt';

interface GroupUserCreateRequest {
   id: string;
   role: GroupRole;
}

interface GroupCreateRequest {
   name: string;
   users: GroupUserCreateRequest[];
}

interface GroupUpdateRequest {
   name?: string;
   usersToAdd?: Array<{ userid: string; role: GroupRole; groupId: string }>;
   usersToUpdate?: Array<{ userId: string; role: GroupRole }>;
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
               const userGroup: GroupMember[] = users.map((user) => {
                  return {
                     groupId: newGroup.id,
                     userId: user.id,
                     role: user.role,
                  };
               });

               await tx.groupMember.createMany({
                  data: userGroup,
               });
            }

            return tx.group.findUniqueOrThrow({
               where: { id: newGroup.id },
               include: {
                  members: {
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
      id?: string,
      role?: UserRole,
   ): Promise<ResultData<any>> {
      const validatedPage = Math.max(1, page);
      const validatedLimit = Math.min(Math.max(limit, 1), 100);
      const cacheKey = `${
         this.LIST_CACHE_PREFIX
      }${validatedPage}:${validatedLimit}:${role || 'all'}`;

      const cachedData = await getCache(cacheKey);

      const [groups, total] = await Promise.all([
         this.prisma.group.findMany({
            include: {
               members: {
                  include: { user: true },
                  where: id ? { user: { id } } : undefined,
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
         members: group.members.map((member) => ({
            ...member.user,
            role_group: member.role,
            role: member.user.role,
         })),
         membersCount: group.members.length,
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

   async getOneGroup(id: string): Promise<any> {
      const cacheKey = `${this.CACHE_PREFIX}${id}`;
      const cachedData = await getCache(cacheKey);

      if (cachedData) return cachedData;

      const group = await this.prisma.group.findUnique({
         where: { id },
         include: {
            members: {
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
         members: group.members.map((member) => ({
            ...member.user,
            role_group: member.role,
            role: member.user.role,
         })),
         membersCount: group.members.length,
      };

      await setCache(cacheKey, result, this.CACHE_TTL);
      return result;
   }

   async removeMemberInGroup(userId: string, groupId: string) {
      try {
         const member = await this.prisma.groupMember.findFirst({
            where: {
               userId,
               groupId,
            },
         });

         if (!member) {
            throw new NotFoundError('Member association group not found');
         }

         await this.prisma.$transaction([
            this.prisma.groupMember.deleteMany({
               where: {
                  userId,
                  groupId,
               },
            }),
         ]);
         return true;
      } catch (error) {}
   }

   async deleteGroup(id: string): Promise<void> {
      try {
         await this.prisma.$transaction([
            this.prisma.groupMember.deleteMany({ where: { groupId: id } }),
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
