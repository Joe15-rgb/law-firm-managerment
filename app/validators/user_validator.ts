import { PrismaClient, Sex, UserRole, type User } from '@prisma/client';
import Joi from 'joi';

const prisma = new PrismaClient();

export async function emailUserIsUnique(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { email } });

  if (user) {
    return true;
  } else {
    return false;
  }
}

export const UserDataValidator = (data: User) => {
  const schema = Joi.object({
    firstName: Joi.string().min(4).max(40).required(),
    lastName: Joi.string().min(4).max(40).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(4).max(20).required(),
    confirm_password: Joi.ref('password'),
    phone: Joi.string().min(10).max(20).optional(),
    address: Joi.string().optional(),
    thumbnail: Joi.string().optional(),
    role: Joi.string().valid(...Object.values(UserRole)).default(UserRole.LAWYER),
    sex: Joi.string().valid(...Object.values(Sex))
  })

  return schema.validate(data)
}