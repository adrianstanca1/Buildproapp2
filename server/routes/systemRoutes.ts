import { Router } from 'express';
import * as systemController from '../controllers/systemController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

// These should be protected by SUPERADMIN check ideally
// requirePermission('system', 'manage') could map to SuperAdmin role
router.get('/settings', systemController.getSystemSettings);
router.post('/settings', systemController.updateSystemSetting); // Updates one key
router.post('/broadcast', systemController.broadcastMessage);

export default router;
