import { PrismaClient } from '@prisma/client';

class LawyerPrismaService {
   private CACHE_TTL = 600;
   private CACHE_PREFIX = 'lawyer:';
   private LIST_CACHE_PREFIX = 'lawyers:all:';
   private prisma: PrismaClient;

   constructor(prisma?: PrismaClient) {
      this.prisma = prisma || new PrismaClient();
   }

   async getAssignedLedgersByCurrentLawyer(id: string) {
      const [ledgers, total] = await Promise.all([
         await this.prisma.treatment.findMany({
            where: {
               userId: id,
            },
            include: {
               legalCase: {
                  include: {
                     client: true,
                  },
               },
            },
         }),
         await this.prisma.treatment.count({
            where: {
               userId: id,
            },
         })
      ]);
      return {
         data: ledgers,
         total,
      };
   }
   async getGroupsWhereLawyerIsMember(id: string) {
      const groups = await this.prisma.groupMember.findMany({
         where: {
            userId: id,
         },
         include: {
            group: {
               include: {
                  members: true,
               },
            },
         },
      });
      return groups;
   }
   async getGroupAssignedLedgersByCurrentLawyer(id: string) {
      const ledgersGroup = await this.prisma.treatment.findMany({
         where: {
            NOT: {
               groupId: null,
            },
         },
         include: {
            Group: {
               include: {
                  members: {
                     where: {
                        userId: id,
                     },
                  },
               },
            },
            legalCase: true,
         },
      });
      return ledgersGroup;
   }
}
export default LawyerPrismaService;
