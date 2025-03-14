import type { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import type { User } from '@prisma/client';

export default class AuthController {

  static async renderLoginPage(req: Request, res: Response) {
    res.status(200).render('auth/login');
  }
  static async renderPageforgotPassword(req: Request, res: Response) {
    res.status(200).render('auth/forgot')
  }

  static async forgotPassword(req: Request, res: Response) {
    res.send('Forgot Password')
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      passport.authenticate(
        'local',
        (err: any, user: Express.User, info: any) => {
          if (err) return next(err);
          if (!user) {
            req.flash('error', info?.message);
            return res.status(401).redirect('/');
          }
          req.logIn(user, (err) => {
            if (err) return next(err);

            const userAuth = user as User;

            switch (userAuth.role) {
              case 'ADMIN':
                res.redirect('/admins');
                break
              case 'LAWYER':
                res.redirect('/lawyers');
                break
              case 'PARALEGAL':
                res.redirect('/paralegals');
                break
              default:
                req.flash('error', 'Rôle utilisateur non reconnu.');
                res.status(403).redirect('/');
                break
            }
          });
        }
      )(req, res, next);
    } catch (error) {
      AuthController.handleControllerError(res, error, 'Erreur lors de la connexion de l\'utilisateur')
    }
  }
  static async logout(req: Request, res: Response) {
    try {
      req.logOut((err) => {
        if (err) throw new Error('Logout error', err)
      })
      req.flash('warn', 'Vous êtez déconnecté(e)')
      res.redirect("/");
    } catch (error) {
      AuthController.handleControllerError(res, error, 'Erreur lors de la déconnexion de l\'utilisateur')
    }
  }


  /**
     * Centralise la gestion des erreurs des contrôleurs.
     */
  private static handleControllerError(
    res: Response,
    error: unknown,
    message: string
  ) {
    console.error('Auth Controller Error:', error);
    res.status(500).render('Internal error server', { message });
  }
}
