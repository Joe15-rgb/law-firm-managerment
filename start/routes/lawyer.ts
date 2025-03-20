import LawyerControllers from '@app/controllers/lawyer_controllers';
import { Router } from 'express';

const router = Router();

router.route('/').get(LawyerControllers.index);

// router.route('/register').post();

router.route('/ledger/:id').get(LawyerControllers.readMyLegalCase);

export default router;
