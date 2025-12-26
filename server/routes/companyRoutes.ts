import { Router } from 'express';
import * as companyController from '../controllers/companyController.js';

const router = Router();

// Company member management routes (nested under /api/companies/:companyId)
router.post('/:companyId/admins', companyController.inviteCompanyAdmin);
router.get('/:companyId/members', companyController.getCompanyMembers);
router.put('/:companyId/members/:userId/role', companyController.updateMemberRole);
router.delete('/:companyId/members/:userId', companyController.removeMember);

export default router;