/*******************************************************
 * KERNEL REGISTER ALL MIDDLEWARES, PLUGINS AND ROUTES *
 *******************************************************/

import type { Request, Response, NextFunction, Express } from 'express'
import locals from '@tools/locals'
import indexRoutes from '@ioc/routes/index'
import adminRoutes from '@ioc/routes/admin'
import userRoutes from '@ioc/routes/user'
import groupRoutes from '@ioc/routes/group'
import clientRoutes from '@ioc/routes/client'

// Liste des middlewares à ajouter
export const middlewares: Array<(req: Request, res: Response, next: NextFunction) => void> = [locals];

// routes
export const routes = (app: Express): void => {
  app.use('/', indexRoutes)
  app.use('/admins', adminRoutes)
  app.use('/users', userRoutes)
  app.use('/groups', groupRoutes)
  app.use('/clients', clientRoutes)
}