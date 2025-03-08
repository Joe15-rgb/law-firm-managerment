import UserControllers from "@app/controllers/user_controllers";
import { Router } from "express";

const router = Router()

router.route('/')
  .get(UserControllers.index)

router.route('/register')
  .get(UserControllers.register)
  .post(UserControllers.create)

router.route('/:id')
  .get(UserControllers.show)
  .delete(UserControllers.destroy)

router.route('/edit/:id')
  .get(UserControllers.edit)
  .put(UserControllers.update)

export default router