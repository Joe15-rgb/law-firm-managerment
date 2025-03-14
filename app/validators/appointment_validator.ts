import { AppointmentStatus, type Appointment } from '@prisma/client';
import Joi from 'joi';

export const AppointmentValidateCreatedData = (data: Appointment) =>
   Joi.object<Omit<Appointment, 'id'>>({
      legalCaseId: Joi.string().required(),
      organizerId: Joi.string().required(),
      scheduledAt: Joi.date().required(),
      duration: Joi.number(),
      subject: Joi.string().required(),
      description: Joi.string().optional(),
      status: Joi.string().valid(...Object.values(AppointmentStatus)),
   }).validate(data);
