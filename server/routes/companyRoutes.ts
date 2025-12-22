import { Router } from 'express';
import * as companyController from '../controllers/companyController.js';
import { requirePermission } from '../middleware/rbacMiddleware.js';

const router = Router();

router.get('/', requirePermission('companies', 'read'), companyController.getCompanies);
router.post('/', requirePermission('companies', 'create'), companyController.createCompany);
router.put('/:id', requirePermission('companies', 'update'), companyController.updateCompany);
router.delete('/:id', requirePermission('companies', 'delete'), companyController.deleteCompany);

export default router;
