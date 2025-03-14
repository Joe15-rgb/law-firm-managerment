/*******************
 * SERVER PROVIDER *
 *******************/
import express, { type Express, type Request, type Response, type NextFunction, type RequestHandler } from 'express';
import { Server as HttpServer } from 'http';
import type { ServerOptions } from './@types/interfaces/server_interface';
import { ErrorWithStatus } from '@tools/errors';
import { helmetConfig } from '@configs/helmet_config';
import helmet from 'helmet';
import morgan from 'morgan';
import { limiter } from '@configs/rateLimi_config';
import session from 'express-session';
import { sessionOptions } from '@configs/session_config';
import passport from 'passport';
import flash from 'express-flash';
import methodOverride from 'method-override'

class Server {

  public readonly app: Express
  private readonly port: number
  private server?: HttpServer
  private isProduction: boolean

  constructor(options: ServerOptions) {

    this.app = express()
    this.port = options.port
    this.isProduction = process.env.NODE_ENV === 'production'

    // Ordre d'initialisation critique
    this.configureCoreMiddlewares();
    this.initializePlugins(options.plugins);
    this.initializeCustomMiddlewares(options.middlewares);
    this.initializeSecurityPolicies();
    this.initializeRoutes(options.routes);
    this.initializeErrorHandling();
  }

  private configureCoreMiddlewares(): void {
    // Configuration de base essentielle
    this.app.set('trust proxy', 1);
    this.app.use(helmet(helmetConfig));
    this.app.use(express.static('public'));
    this.app.use(express.urlencoded({ extended: true, limit: '10kb' }));
    this.app.use(express.json({ limit: '10kb' }));
    this.app.use(morgan(this.isProduction ? 'combined' : 'dev'));
  }

  private initializePlugins(plugins?: (app: Express) => void): void {
    // Initialisation des extensions externes
    if (plugins) {
      plugins(this.app);
    } else {
      this.app.use((req, res, next) => {
        res.locals = res.locals || {};
        next();
      });
    }
  }
  private initializeCustomMiddlewares(middlewares?: RequestHandler[]): void {
    // Middlewares spécifiques à l'application
    this.app.use(session({
      ...sessionOptions,
      cookie: {
        ...sessionOptions.cookie,
        secure: this.isProduction,
        sameSite: this.isProduction ? 'none' : 'lax'
      }
    }));

    this.app.use(passport.initialize());
    this.app.use(passport.session());
    this.app.use(flash());
    this.app.use(methodOverride('_method', { methods: ['POST', 'GET'] }));
    this.app.set('view engine', 'ejs');

    if (middlewares) {
      middlewares.forEach(middleware => this.app.use(middleware));
    }
  }
  private initializeSecurityPolicies(): void {

    // Rate limiting pour les routes API
    const apiLimiter = limiter

    this.app.use('/', apiLimiter);
    this.app.use('/api', apiLimiter);
  }
  private initializeRoutes(routes?: (app: Express) => void): void {
    // Configuration des routes
    this.app.get('/favicon.ico', (req: Request, res: Response): any => res.status(204).end());

    if (routes) {
      routes(this.app);
    } else {
      this.app.get('/health', (req, res): any =>
        res.json({ status: 'ok', timestamp: new Date() })
      );
    }
  }
  private initializeErrorHandling(): void {
    // Gestion centralisée des erreurs
    this.app.use((req, res, next) => {
      const error = new ErrorWithStatus('Resource not found', 404);
      next(error);
    });

    this.app.use((
      err: ErrorWithStatus,
      req: Request,
      res: Response,
      next: NextFunction
    ) => {
      const status = err.status || 500;
      const message = this.isProduction && status === 500
        ? 'Internal server error'
        : err.message;

      if (this.isProduction) {
        console.error(`[${new Date().toISOString()}] ${err.message}`);
      }

      res.status(status).json({
        status: 'error',
        message,
        ...(!this.isProduction && { stack: err.stack })
      });
    });
  }

  public start(): Promise<void> {
    return new Promise((resolve) => {
      this.server = this.app.listen(
        this.port, () => {
          console.info(`🚀 Server running on port ${this.port}`)
          resolve()
        })
    })
  }

  public async stop(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.server) {
        this.server.close((err) => {
          if (err) {
            console.error('Shutdown error:', err);
            reject(err);
          } else {
            console.log('Server stopped');
            resolve();
          }
        });
      } else {
        reject(new Error('Server not running'));
      }
    });
  }

}



export default Server