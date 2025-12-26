import { Router } from 'express';
import * as projectController from '../controllers/projectController.js';

import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

router.get('/', requirePermission('projects', 'read'), projectController.getProjects);
router.get('/:id', requirePermission('projects', 'read'), projectController.getProject);
router.post('/', requirePermission('projects', 'create'), projectController.createProject);
router.put('/:id', requirePermission('projects', 'update'), projectController.updateProject);
router.delete('/:id', requirePermission('projects', 'delete'), projectController.deleteProject);

export default router;
