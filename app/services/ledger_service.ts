import { CACHE_TTL } from '@configs/env_config';
import { CaseTypes, PrismaClient, type Case } from '@prisma/client';

type OmitCasePropriety = 'createdAt' | ' updatedAt' | 'id';

export class LedgerPrismaService {
   private readonly CACHE_TTL = CACHE_TTL;
   private readonly CACHE_PREFIX = 'group:';
   private readonly LIST_CACHE_PREFIX = 'groups:all:';
   private prisma: PrismaClient;

   constructor(prisma?: PrismaClient) {
      this.prisma = prisma || new PrismaClient();
   }

   private generateCaseReference(cliendId: string, caseType: CaseTypes) {}

   async createLedger(data: Omit<Case, OmitCasePropriety>) {
      try {
      } catch (error) {}
   }
}
