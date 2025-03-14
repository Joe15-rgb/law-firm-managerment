import LedgerControllers from "@app/controllers/ledger_controllers";
import { Router } from "express";
const router = Router()

router.route('/')
.get(LedgerControllers.index)

router.route('/:id')
.get(LedgerControllers.show)

router.route('/new')
.post(LedgerControllers.create)


export default router
