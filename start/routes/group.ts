import GroupControllers from "@app/controllers/group_controllers";
import { Router } from "express";

const router = Router()

router.route('/')
.get(GroupControllers.index)
.post(GroupControllers.create)

router.route('/:id')
.get(GroupControllers.show)
.delete(GroupControllers.destroy)


export default router