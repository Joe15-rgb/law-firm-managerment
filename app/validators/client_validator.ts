import { ClientType, Sex, type Client } from '@prisma/client';
import { City, Country } from '@tools/clientInput';
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
      birthDate: Joi.date().required(),
      addressLine1: Joi.string().optional(),
      addressLine2: Joi.string().optional(),
      city: Joi.string().valid(...Object.values(City)),
      country: Joi.string().valid(...Object.values(Country)),
   });

   return schema.validate(data);
};
