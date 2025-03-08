import { Router } from "express";
import AuthController from "@app/controllers/auth_controllers";

const router = Router()

router.route('/')
.get(AuthController.renderLoginPage)
.post(AuthController.login)

router.route('/logout')
.delete(AuthController.logout)

router.route('/forgot')
.get(AuthController.renderPageforgotPassword)
.post(AuthController.forgotPassword)


export default router