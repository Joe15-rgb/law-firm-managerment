import ClientControllers from '@app/controllers/client_controllers';
import { Router } from 'express';

const router = Router();

router.route('/').get(ClientControllers.index);

router.route('/register').post(ClientControllers.create);

router.route('/:id').get(ClientControllers.show);

export default router;
