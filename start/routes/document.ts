import DocumentController from "@app/controllers/document-controllers";
import { Router } from "express";

const router = Router()

router.route('/register')
.post(DocumentController.create)


export default router