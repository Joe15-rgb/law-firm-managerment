import type { NextFunction, Request, Response } from 'express';
import type { User } from '@prisma/client';
import { casbinInitAdaptator } from '@configs/casbin_config';

export const permission = () => {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void | any> => {
    try {
      const permission = await casbinInitAdaptator();

      if (!req.user) {
        req.flash('error', 'Access Denied');
        return res.status(401).redirect('/');
      }

      const { role } = req.user as User;
      const resource = req.baseUrl.toLowerCase();
      const action = req.method.toUpperCase();

      const isAllowed = await permission?.enforce(role, resource, action);

      if (isAllowed) {
        return next();
      } else {
        console.warn(
          `Access denied for role "${role}" on ${req.method} ${req.originalUrl}`
        );
        return res.status(403).send('Access Denied'); // Retourne une erreur 403
      }
    } catch (error) {
      console.error('Casbin middleware error:', error);
      res.status(500).send('Internal Server Error'); // Erreur 500 pour les erreurs inattendues
    }
  };
};
