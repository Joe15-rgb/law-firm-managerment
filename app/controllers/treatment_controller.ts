import { asyncMiddleware } from '@app/middlewares/asyncMiddleware';
import TreatmentPrismaService from '@app/services/treatment_service';
import { ActorType, type Treatment } from '@prisma/client';
import { ErrorWithStatus } from '@tools/errors';
import type { Request, Response, NextFunction } from 'express';

type TreatmentCreateInput = Omit<
   Treatment,
   'id' | 'updatedAt' | 'createdAt' | 'status'
>;
type TreatmentUpdateInput = Partial<Pick<Treatment, 'status'>>;

const DEFAULT_PAGINATION = {
   PAGE: 1,
   LIMIT: 10,
} as const;

const ERROR_MESSAGES = {
   INVALID_INPUT: "Données d'entrée invalides",
   MISSING_PARAMS: 'Paramètres requis manquants',
   INVALID_ACTOR_TYPE: "Type d'acteur non valide",
   TREATMENT_NOT_FOUND: 'Traitement introuvable',
} as const;

class TreatmentController {
   private readonly service: TreatmentPrismaService;

   constructor(service?: TreatmentPrismaService) {
      this.service = service ?? new TreatmentPrismaService();
   }

   index = asyncMiddleware(async (req: Request, res: Response) => {
      const page = Number(req.query.page) || DEFAULT_PAGINATION.PAGE;
      const limit = Number(req.query.limit) || DEFAULT_PAGINATION.LIMIT;

      const treatments = await this.service.getAllTreatments(page, limit);

      const userAssign = treatments.filter((t) => t.actorType === 'USER');
      const teamAssign = treatments.filter((t) => t.actorType === 'GROUP');

      const result = {
         data: {
            users: userAssign,
            teams: teamAssign
         },
         pagination: {
            page,
            limit,
            total: treatments.length,
         },
      };

      res.status(200).render('pages/ledgers/assign', {result});
      res.send(result);
   });

   assign = asyncMiddleware(
      async (req: Request, res: Response): Promise<void> => {
         const { body } = req;

         this.validateTreatmentInput(body);

         const treatment = await this.service.assignTreatment(body);

         res.status(201).json({
            message: 'Traitement assigné avec succès',
            data: req.body,
         });
      }
   );

   removeAssign = asyncMiddleware(async (req: Request, res: Response) => {
      const { id } = req.params;

      if (!id) {
         throw new ErrorWithStatus(ERROR_MESSAGES.MISSING_PARAMS, 400);
      }

      await this.service.removeTreatment(id);

      res.status(204).send();
   });

   updateAssign = asyncMiddleware(async (req: Request, res: Response) => {
      const { id } = req.params;
      const { status } = req.body;

      if (!id || !status) {
         throw new ErrorWithStatus(ERROR_MESSAGES.MISSING_PARAMS, 400);
      }

      const updatedTreatment = await this.service.updateStatus(id, status);

      res.status(200).json({
         message: 'Statut mis à jour avec succès',
         data: updatedTreatment,
      });
   });

   private validateTreatmentInput(input: TreatmentCreateInput): void {
      const requiredFields = ['legalCaseId', 'actorType'];
      const missingFields = requiredFields.filter((field) => !input);

      if (missingFields.length > 0) {
         throw new ErrorWithStatus(
            `${ERROR_MESSAGES.MISSING_PARAMS}: ${missingFields.join(', ')}`,
            400
         );
      }

      const isValidActorType = Object.values(ActorType).includes(
         input.actorType
      );
      if (!isValidActorType) {
         throw new ErrorWithStatus(ERROR_MESSAGES.INVALID_ACTOR_TYPE, 400);
      }

      const isValidAssignment =
         (input.actorType === ActorType.USER &&
            input.userId &&
            !input.groupId) ||
         (input.actorType === ActorType.GROUP &&
            input.groupId &&
            !input.userId);

      if (!isValidAssignment) {
         throw new ErrorWithStatus(ERROR_MESSAGES.INVALID_INPUT, 400);
      }
   }

   private handleError(error: unknown, message: string): never {
      if (error instanceof ErrorWithStatus) throw error;

      const errorMessage =
         error instanceof Error ? error.message : 'Erreur inconnue';
      console.error(`${message}: ${errorMessage}`, { error });

      throw new ErrorWithStatus(message, 500);
   }
}

export default TreatmentController;
