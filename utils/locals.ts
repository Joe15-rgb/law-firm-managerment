import { GroupRole, PrismaClient, Sex, UserRole, type User } from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import GroupPrismaService from '@app/services/group_service';
import LedgerPrismaService from '@app/services/ledger_service';
import { cardData, inputClients, inputLegalCase, inputsAppointment, inputUsers } from './clientInput';

const prisma = new PrismaClient()
const groupServices = new GroupPrismaService();
const legalCase = new LedgerPrismaService();

const locals = async (req: Request, res: Response, next: NextFunction) => {
   const users = await prisma.user.findMany();
   const clients = await prisma.client.findMany()

   res.locals.title = process.env.TITLE || 'LAW FIRM MANAGERMENT';
   res.locals.luxon = await import('luxon');
   res.locals.roles = [...Object.values(UserRole)];

   res.locals.sex = [...Object.values(Sex)];
   res.locals.groupUserRoles = [...Object.values(GroupRole)];

   res.locals.users = users;
   res.locals.user = req.user as User;
   res.locals.clients = clients

   res.locals.teams = await groupServices.getAllGroups();
   res.locals.legalCases = await legalCase.getAllLegalCases();
   res.locals.cardData = cardData;
   res.locals.UserFields = inputUsers;
   res.locals.inputClients = inputClients;
   res.locals.inputLegalCases = inputLegalCase;
   res.locals.inputsAppointments = inputsAppointment

   next();
};

export default locals;
