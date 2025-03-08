import UserPrismaServices from '@app/services/user_service';
import {
   emailUserIsUnique,
   UserDataValidator,
} from '@app/validators/user_validator';
import type { User } from '@prisma/client';
import { ErrorWithStatus } from '@tools/errors';
import type { Request, Response } from 'express';

const service = new UserPrismaServices();

class UserControllers {
   static async index(req: Request, res: Response) {
      try {
         const users = await service.getAllUsers();
         res.status(200).render('pages/user/index', {users});
      } catch (error) {
         UserControllers.handleControllerError(
            res,
            error,
            'Erreur lors de la récupération des utilisateurs.'
         );
      }
   }
   static async create(req: Request, res: Response): Promise<void | any> {
      try {
         const { error, value } = UserDataValidator(req.body);
         const payload: Partial<User> = {
            firstName: value.firstName,
            lastName: value.lastName,
            email: value.email,
            password: value.password,
            role: value.role,
            sex: value.sex,
            phone: value.phone,
            address: value.address,
            thumbnail: value.thumbnail,
         };
         if (error) {
            req.flash('error', error.details[0].message);
            return res.status(400).send(error.details[0].message);
         }
         if (await emailUserIsUnique(value.email)) {
            return res
               .status(400)
               .send(`${value.email} - Cette adresse email est déjà utilisé`);
         }
         const user = await service.createUser(payload as User);
         res.status(201).send(user);
      } catch (error) {
         UserControllers.handleControllerError(
            res,
            error,
            "Erreur lors de la création de l'utilisateur."
         );
      }
   }
   static async show(req: Request, res: Response) {
      UserControllers.renderUserPage(req, res, 'pages/user/show');
   }
   static async edit(req: Request, res: Response) {
      UserControllers.renderUserPage(req, res, 'pages/user/edit');
   }
   static async register(req: Request, res: Response) {
      res.status(200).render('pages/user/register');
   }
   static async update(req: Request, res: Response): Promise<any | void> {
      try {
         const id = String(req.params.id);
         const { error, value } = UserDataValidator(req.body);
         const payload: Partial<User> = {
            firstName: value.firstName,
            lastName: value.lastName,
            email: value.email,
            password: value.password,
            role: value.role,
            sex: value.sex,
            phone: value.phone,
            address: value.address,
            thumbnail: value.thumbnail,
         };
         if (error) {
            req.flash('error', error.details[0].message);
            return res.status(400).send(error.details[0].message);
         }

         const userUpdate = await service.updateUser(id, payload);
         res.status(200).send(userUpdate);
      } catch (error) {
         UserControllers.handleControllerError(
            res,
            error,
            "Erreur lors de la mise à jours de l'utilisateur."
         );
      }
   }
   static async destroy(req: Request, res: Response): Promise<any | void> {
      try {
         const id = req.params.id;
         const user = await service.getOneUser(id);

         if (!user) {
            req.flash('error', 'Utilisateur non trouvé');
            return res.status(404).redirect('/users');
         }

         const userDestroyed = await service.deleteUser(id);

         if (!userDestroyed) {
            req.flash('error', 'Utilisateur est non supprimé');
            return res.status(500).redirect('/users');
         }
         req.flash('success', 'Utilisateur supprimé avec succes!');
         return res.status(200).send('');
      } catch (error) {
         UserControllers.handleControllerError(
            res,
            error,
            "Erreur lors de la suppression de l'utilisateur"
         );
      }
   }

   /**
    * Factorise le rendu des pages utilisateur (`edit` et `show`).
    */
   private static async renderUserPage(
      req: Request,
      res: Response,
      view: string
   ) {
      try {
         const id = String(req.params.id);
         const user = await service.getOneUser(id);

         res.status(200).render(view, { user });
      } catch (error) {
         if (error instanceof ErrorWithStatus && error.status === 404) {
            req.flash('error', 'Utilisateur non trouvé');
            return res.status(404).redirect('/users');
         }

         UserControllers.handleControllerError(
            res,
            error,
            "Erreur lors de la récupération de l'utilisateur."
         );
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
      console.error('User Controller Error:', error);
      res.status(500).render('Internal error server', { message });
   }
}

export default UserControllers;
