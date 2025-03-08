import express, { type Express, type Request, type Response, type NextFunction, type RequestHandler } from 'express';

export interface ServerOptions {
  port: number;
  middlewares?: RequestHandler[];
  plugins?: (app: Express) => void;
  routes?: (app: Express) => void;
}