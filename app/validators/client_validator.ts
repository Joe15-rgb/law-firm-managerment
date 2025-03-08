import { ClientType, Sex, type Client } from '@prisma/client';
import Joi from 'joi';

export const clientValidatorData = (data: Client) => {
   const schema = Joi.object({
      firstName: Joi.string().min(2).max(40).required(),
      lastName: Joi.string().min(2).max(40).required(),
      sex: Joi.string()
         .valid(...Object.values(Sex))
         .required(),
      clientType: Joi.string()
         .valid(...Object.values(ClientType))
         .required(),
      email: Joi.string().email().required(),
      phone: Joi.string().min(10).max(20).trim().optional(),
      address: Joi.string().optional(),
      age: Joi.number().max(100).required(),
   });

   return schema.validate(data);
};
