import type { Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import chalk from 'chalk';

export const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Maximum number of requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: (req: Request, res: Response) => {
    console.log(chalk.yellow(`Rate limit exceeded for IP: ${req.ip}`));
    res.status(429).send(
      '<h1>Trop de requêtes effectuées depuis cette IP, veuillez réessayer plus tard.</h1>'
    );
  },
  keyGenerator: (req: Request): any => req.ip, // Customize key to rate-limit by IP
  handler: (req: Request, res: Response, next, options) => {
    console.error(chalk.red(`Request blocked: ${req.ip} exceeded the rate limit.`));
    res.status(429).json({ error: 'Too many requests, please try again later.' });
  },
});
