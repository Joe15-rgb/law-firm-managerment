import {
   DocumentType,
   GroupRole,
   PrismaClient,
   Sex,
   UserRole,
   type User,
} from '@prisma/client';
import type { NextFunction, Request, Response } from 'express';
import GroupPrismaService from '@app/services/group_service';
import LedgerPrismaService from '@app/services/ledger_service';
import {
   cardData,
   inputClients,
   inputLegalCase,
   inputsAppointment,
   inputUsers,
} from './clientInput';

const prisma = new PrismaClient();
const groupServices = new GroupPrismaService();
const legalCase = new LedgerPrismaService();

const locals = async (req: Request, res: Response, next: NextFunction) => {
   const users = await prisma.user.findMany();
   const clients = await prisma.client.findMany();
   const groups = await prisma.group.findMany({
      include: {
         members: {
            include: {
               user: true,
            },
         },
      },
   });
    const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
   const transformedData = groups.map((group) => ({
      id: group.id,
      name: group.name,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
      members: group.members.map((member) => ({
         ...member.user,
         role_group: member.role,
         role: member.user.role,
      })),
      membersCount: group.members.length,
   }));

   res.locals.title = process.env.TITLE || 'LAW FIRM MANAGERMENT';
   res.locals.luxon = await import('luxon');
   res.locals.roles = [...Object.values(UserRole)];
   res.locals.formatFileSize = formatFileSize

   res.locals.sex = [...Object.values(Sex)];
   res.locals.groupUserRoles = [...Object.values(GroupRole)];
   res.locals.documentType = [...Object.values(DocumentType)]

   res.locals.user = req.user as User;
   res.locals.users = users;
   res.locals.clients = clients;
   res.locals.groups = transformedData;

   res.locals.teams = await groupServices.getAllGroups();
   res.locals.legalCases = await legalCase.getAllLegalCases();
   res.locals.cardData = cardData;
   res.locals.UserFields = inputUsers;
   res.locals.inputClients = inputClients;
   res.locals.inputLegalCases = inputLegalCase;
   res.locals.inputsAppointments = inputsAppointment;

   next();
};

export default locals;
