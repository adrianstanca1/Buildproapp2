
import { Router } from 'express';
import * as notificationController from '../controllers/notificationController.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { UserRole } from '../../types.js';

const router = Router();

// Only SuperAdmins can manage platform-level system events
router.use(requireRole([UserRole.SUPERADMIN]));

router.get('/events', notificationController.getSystemEvents);
router.put('/events/:id/read', notificationController.markAsRead);
router.post('/events/mark-all-read', notificationController.markAllRead);
router.delete('/events/clear', notificationController.clearEvents);

export default router;
