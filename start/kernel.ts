/*******************************************************
 * KERNEL REGISTER ALL MIDDLEWARES, PLUGINS AND ROUTES *
 *******************************************************/

import type { Request, Response, NextFunction, Express } from 'express';
import locals from '@tools/locals';
import indexRoutes from '@ioc/routes/index';
import adminRoutes from '@ioc/routes/admin';
import lawyerRoutes from '@ioc/routes/lawyer';
import userRoutes from '@ioc/routes/user';
import groupRoutes from '@ioc/routes/group';
import clientRoutes from '@ioc/routes/client';
import ledgerRoutes from '@ioc/routes/ledger';
import treatmentRoutes from '@ioc/routes/treatment';
import appointmentRoutes from '@ioc/routes/appointment';
import documentRoutes from '@ioc/routes/document';
import { auth } from '@app/middlewares';
import { permission } from '@app/middlewares/permission_middlewares';

// Liste des middlewares à ajouter
export const middlewares: Array<
   (req: Request, res: Response, next: NextFunction) => void
> = [locals];

// routes
export const routes = (app: Express): void => {
   // Public ressources
   app.use('/', indexRoutes);

   //Admin ressources
   app.use('/admins', auth, permission(), adminRoutes);
   app.use('/users', auth, permission(), userRoutes);
   app.use('/groups', auth, permission(), groupRoutes);
   app.use('/clients', auth, permission(), clientRoutes);
   app.use('/ledgers', auth, permission(), ledgerRoutes);
   app.use('/treatments', auth, permission(), treatmentRoutes);

   // lawyer and paralage ressources
   app.use('/lawyers', auth, permission(), lawyerRoutes);
   app.use('/documents', auth, permission(), documentRoutes);
   app.use('/appointments', auth, permission(), appointmentRoutes);
};
