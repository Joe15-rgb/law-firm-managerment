import TreatmentController from '@app/controllers/treatment_controller';
import { Router } from 'express';

const router = Router();
const treatmentController = new TreatmentController();

router.route('/').get(treatmentController.index);

router.route('/assign').post(treatmentController.assign);

export default router;
