import AppointmentControllers from "@app/controllers/appointment_controllers";
import { Router } from "express";

const router = Router()


router.route('/new')
.post(AppointmentControllers.create)




export default router