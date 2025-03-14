import LedgerPrismaService from '@app/services/ledger_service';
import type { LegalCase } from '@prisma/client';
import type { Request, Response } from 'express';
import {
   LedgerValidateData,
   LedgerUpdateValidateData,
} from '@app/validators/ledger_validator';
import { NotFoundError } from '@tools/errors';
import { asyncMiddleware } from '@app/middlewares/asyncMiddleware';

class LedgerControllers {
   private static service = new LedgerPrismaService();

   static index = asyncMiddleware(async (req: Request, res: Response) => {
      const { page = 1, limit = 10, search } = req.query;
      const ledgers = await this.service.getAllLegalCases();

      res.status(200).render('pages/ledgers/index', {
         ledgers,
      });
   });

   static show = asyncMiddleware(async (req: Request, res: Response) => {
      const ledger = await this.getLedgerOrFail(req.params.id);
      // res.status(200).render('pages/ledgers/show', { ledger });
      res.send(ledger)
   });

   static create = asyncMiddleware(async (req: Request, res: Response) => {
      const { error, value } = LedgerValidateData(req.body);

      if (error) {
         req.flash('error', error.details.map((d) => d.message).join(', '));
         return res.redirect('/ledgers');
      }

      const newLedger = await this.service.createLegalCase(value);
      req.flash('success', 'Ledger created successfully');
      res.redirect(`/ledgers/${newLedger.id}`);
   });

   static edit = asyncMiddleware(async (req: Request, res: Response) => {
      const ledger = await this.getLedgerOrFail(req.params.id);
      res.status(200).render('pages/ledgers/edit', { ledger });
   });

   static update = asyncMiddleware(async (req: Request, res: Response) => {
      const { error, value } = LedgerUpdateValidateData(req.body);

      if (error) {
         req.flash('error', error.details.map((d) => d.message).join(', '));
         return res.redirect(`/ledgers/${req.params.id}/edit`);
      }

      const updatedLedger = await this.service.updateLegalCase(
         req.params.id,
         value
      );
      req.flash('success', 'Ledger updated successfully');
      res.redirect(`/ledgers/${updatedLedger.id}`);
   });

   static destroy = asyncMiddleware(async (req: Request, res: Response) => {
      await this.service.deleteLegalCase(req.params.id);
      req.flash('success', 'Ledger deleted successfully');
      res.redirect('/ledgers');
   });

   // Méthodes privées helpers
   private static async getLedgerOrFail(id: string): Promise<LegalCase> {
      const ledger = await this.service.getLegalCaseById(id);
      if (!ledger) {
         throw new NotFoundError('Ledger not found');
      }
      return ledger;
   }

   private static handleValidationError(
      req: Request,
      messages: string[]
   ): void {
      req.flash('error', messages);
      req.flash('formData', req.body);
   }
}

export default LedgerControllers;
