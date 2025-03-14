import { asyncMiddleware } from "@app/middlewares/asyncMiddleware";
import AppointmentPrismaService from "@app/services/appointment_service";
import { AppointmentValidateCreatedData } from "@app/validators/appointment_validator";
import type { Request, Response } from "express";
import luxon from 'luxon'


const service = new AppointmentPrismaService()

class AppointmentControllers{
  static create = asyncMiddleware(async (req, res): Promise<any> =>{
    // const {error, value} = AppointmentValidateCreatedData(req.body)
    // if (error) {
    //   return res.send(error.details[0].message)

    // }
    // res.send(await service.createAppointment(value))
    // console.log(new luxon.DateTime(req.body.scheduledAt));
    res.send(req.body)
  })
}

export default AppointmentControllers