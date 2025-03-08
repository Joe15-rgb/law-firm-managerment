import { GroupUserRole, Sex, UserRole, type User } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import { fieldUsers } from './input';
import { prisma } from '@db/seeds/users_seed';

const locals = async (req: Request, res: Response, next: NextFunction) => {
   const users = await prisma.user.findMany();

   res.locals.User = req.user as User;
   res.locals.luxon = await import('luxon');
   res.locals.roles = [...Object.values(UserRole)];
   res.locals.sex = [...Object.values(Sex)];
   res.locals.UserFields = fieldUsers;
   res.locals.users = users;
  res.locals.groupUserRoles = [...Object.values(GroupUserRole)]

   next();
};

export default locals;
