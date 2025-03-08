import AdminControllers from "@app/controllers/admin_controllers";
import { Router } from "express";

const router = Router()

router.route('/')
.get(AdminControllers.index)

export default router