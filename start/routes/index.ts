import { Router } from 'express';
import AuthController from '@app/controllers/auth_controllers';
import { guest, auth } from '@app/middlewares';

const router = Router();

router
   .route('/')
   .get(guest, AuthController.renderLoginPage)
   .post(AuthController.login);

router.route('/logout').all(auth).delete(AuthController.logout);

router
   .route('/forgot')
   .all(guest)
   .get(AuthController.renderPageforgotPassword)
   .post(AuthController.forgotPassword);

export default router;
