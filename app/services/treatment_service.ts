import { CACHE_TTL } from '@configs/env_config';
import {
   PrismaClient,
   type Treatment,
   ActorType,
   TreatmentStatus,
} from '@prisma/client';
import { invalidateCacheByPrefix } from '@tools/cache';

// Déclaration des erreurs métier
class ApplicationError extends Error {
   constructor(
      message: string,
      public readonly context?: Record<string, unknown>
   ) {
      super(message);
      this.name = this.constructor.name;
      Error.captureStackTrace(this, this.constructor);
   }
}

class NotFoundError extends ApplicationError {}
class ValidationError extends ApplicationError {}
class InfrastructureError extends ApplicationError {}

type EntityType = 'user' | 'group' | 'legalCase';
type TreatmentInput = Omit<
   Treatment,
   'id' | 'createdAt' | 'updatedAt' | 'status'
>;

const ERROR_MESSAGES = {
   ENTITY_NOT_FOUND: (entity: EntityType) =>
      `${
         entity === 'user'
            ? 'Utilisateur'
            : entity === 'group'
            ? 'Groupe'
            : 'Dossier juridique'
      } introuvable`,
   INVALID_ASSIGNMENT:
      "Le traitement doit être assigné soit à un utilisateur, soit à un groupe, en fonction de 'actorType'.",
   INVALID_STATUS: 'Statut de traitement invalide.',
   TREATMENT_NOT_FOUND: 'Traitement introuvable',
} as const;

class TreatmentPrismaService {
   private readonly CASE_CACHE_PREFIX = 'legal-case:';
   private readonly LIST_CACHE_PREFIX = 'legal-cases:all';

   constructor(private readonly prisma: PrismaClient = new PrismaClient()) {}

   async assignTreatment(data: TreatmentInput): Promise<Treatment> {
      const { legalCaseId, actorType, userId, groupId } = data;

      try {
         this.validateActorAssignment(actorType, userId!, groupId!);

         await Promise.all([
            this.verifyEntityExists('legalCase', legalCaseId),
            actorType === ActorType.USER
               ? this.verifyEntityExists('user', userId!)
               : this.verifyEntityExists('group', groupId!),
         ]);


         return await this.prisma.$transaction(async (tx) => {
            const treatment = await tx.treatment.create({ data });

            await this.handleCacheInvalidation(legalCaseId);

            return treatment;
         });
      } catch (error) {
         this.handleError(error, 'assignTreatment', { legalCaseId, actorType });
      }
   }

   async removeTreatment(id: string): Promise<void> {
      try {
         return await this.prisma.$transaction(async (tx) => {
            const treatment = await tx.treatment.findUnique({ where: { id } });
            if (!treatment)
               throw new NotFoundError(ERROR_MESSAGES.TREATMENT_NOT_FOUND);

            await tx.treatment.delete({ where: { id } });
            await this.handleCacheInvalidation(treatment.legalCaseId);
         });
      } catch (error) {
         this.handleError(error, 'removeTreatment', { treatmentId: id });
      }
   }

   async updateStatus(id: string, status: TreatmentStatus): Promise<Treatment> {
      try {
         if (!Object.values(TreatmentStatus).includes(status)) {
            throw new ValidationError(ERROR_MESSAGES.INVALID_STATUS);
         }

         return await this.prisma.$transaction(async (tx) => {
            const treatment = await tx.treatment.update({
               where: { id },
               data: { status },
            });

            await this.handleCacheInvalidation(treatment.legalCaseId);
            return treatment;
         });
      } catch (error) {
         this.handleError(error, 'updateStatus', { treatmentId: id, status });
      }
   }

   async getAllTreatments(page = 1, limit = 10): Promise<Treatment[]> {
      const offset = (page - 1) * limit;

      try {
         return await this.prisma.treatment.findMany({
            skip: offset,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: {
               legalCase: {
                  include: {
                     client: true,
                  },
               },
               Group: {
                  include: { members: true },
               },
               User: true,
            },
         });
      } catch (error) {
         this.handleError(error, 'getAllTreatments', { page, limit });
      }
   }

   private async verifyEntityExists(
      entity: EntityType,
      id: string
   ): Promise<void> {
      let exists = false;
      switch (entity) {
         case 'user':
            exists = !!(await this.prisma.user.findUnique({ where: { id } }));
            break;
         case 'group':
            exists = !!(await this.prisma.group.findUnique({ where: { id } }));
            break;
         case 'legalCase':
            exists = !!(await this.prisma.legalCase.findUnique({
               where: { id },
            }));
            break;
         default:
            throw new NotFoundError(ERROR_MESSAGES.ENTITY_NOT_FOUND(entity), {
               entity,
               id,
            });
      }

      if (!exists) {
         throw new NotFoundError(ERROR_MESSAGES.ENTITY_NOT_FOUND(entity), {
            entity,
            id,
         });
      }
   }

   private validateActorAssignment(
      actorType: ActorType,
      userId?: string,
      groupId?: string
   ): void {
      const isValidAssignment = {
         [ActorType.USER]: !!userId && !groupId,
         [ActorType.GROUP]: !!groupId && !userId,
      }[actorType];

      if (!isValidAssignment) {
         throw new ValidationError(ERROR_MESSAGES.INVALID_ASSIGNMENT, {
            actorType,
            userId,
            groupId,
         });
      }
   }

   private async handleCacheInvalidation(legalCaseId: string): Promise<void> {
      try {
         await Promise.all([
            invalidateCacheByPrefix(this.LIST_CACHE_PREFIX),
            invalidateCacheByPrefix(`${this.CASE_CACHE_PREFIX}${legalCaseId}`),
         ]);
      } catch (cacheError) {
         throw new InfrastructureError('Échec de la gestion du cache', {
            legalCaseId,
            cause: cacheError,
         });
      }
   }

   private handleError(
      error: unknown,
      methodName: string,
      context?: Record<string, unknown>
   ): never {
      if (error instanceof ApplicationError) throw error;

      const errorMessage = `${methodName} error: ${
         error instanceof Error ? error.message : 'Unknown error'
      }`;

      console.error(errorMessage, {
         context,
         stack: error instanceof Error ? error.stack : undefined,
      });

      throw new InfrastructureError(errorMessage, {
         originalError: error,
         context,
      });
   }
}

export default TreatmentPrismaService;
