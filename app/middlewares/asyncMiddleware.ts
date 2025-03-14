import type { RequestHandler } from 'express';

export const asyncMiddleware =
   (fn: RequestHandler): RequestHandler =>
   (req, res, next) =>
      Promise.resolve(fn(req, res, next)).catch(next);
