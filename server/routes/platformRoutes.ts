import { Router } from 'express';
import * as platformController from '../controllers/platformController.js';
import { requireRole } from '../middleware/rbacMiddleware.js';
import { UserRole } from '../../types.js';

const router = Router();

// All platform routes require SUPERADMIN role
router.use(requireRole([UserRole.SUPERADMIN]));

router.get('/stats', platformController.getDashboardStats);
router.get('/health', platformController.getSystemHealth);
router.get('/activity', platformController.getGlobalActivity); // Legacy alias
router.get('/audit-logs', platformController.getAuditLogs);
router.get('/metrics', platformController.getAdvancedMetrics);

router.get('/users', platformController.getAllUsers);
router.put('/users/:id/status', platformController.updateUserStatus);
router.put('/users/:id/role', platformController.updateUserRole);

router.post('/broadcast', platformController.broadcastMessage);
router.post('/maintenance', platformController.toggleMaintenance);
router.post('/sql', platformController.executeSql);

router.get('/config', platformController.getSystemConfig);
router.post('/config', platformController.updateSystemConfig);

export default router;
