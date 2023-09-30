import express from 'express';

import * as AppController from '../controllers/AppController';
import * as AuthController from '../controllers/AuthController';
import * as UsersController from '../controllers/UsersController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);

router.get('/connect', AuthController.getConnect);
router.get('/disconnect', AuthController.getDisconnect);

router.get('/users/me', UsersController.getMe);
router.post('/users', UsersController.postNew);

export default router;
