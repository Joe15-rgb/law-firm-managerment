import {
   CaseStatus,
   CaseTypes,
   UrgencyCase,
   type LegalCase,
} from '@prisma/client';
import Joi from 'joi';

type LegalCaseInput = Omit<
   LegalCase,
   'id' | 'createdAt' | 'updatedAt' | 'caseNumber' | 'reference'
>;
type LegalCaseUpdate = Partial<LegalCaseInput>;

export const LedgerValidateData = (data: LegalCaseInput) =>
   Joi.object({
      title: Joi.string().required(),
      clientId: Joi.string().uuid().required(),
      description: Joi.string().optional(),
      priority: Joi.number().max(10).min(1).required(),
      urgency: Joi.string().valid(...Object.values(UrgencyCase)),
      status: Joi.string().valid(...Object.values(CaseStatus)),
      caseType: Joi.string().valid(...Object.values(CaseTypes)),
   }).validate(data, { abortEarly: false });

export const LedgerUpdateValidateData = (data: LegalCaseUpdate) =>
   Joi.object({
      title: Joi.string().optional(),
      clientId: Joi.string().uuid().optional(),
      description: Joi.string().optional(),
      priority: Joi.number().optional(),
      urgency: Joi.string().valid(...Object.values(UrgencyCase)),
      status: Joi.string().valid(...Object.values(CaseStatus)),
      caseType: Joi.string().valid(...Object.values(CaseTypes)),
      reference: Joi.string().optional(),
   }).validate(data, { abortEarly: false });
