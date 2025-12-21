import { Router } from 'express';
import * as companyController from '../controllers/companyController.js';

const router = Router();

router.get('/', companyController.getCompanies);
router.post('/', companyController.createCompany);
router.put('/:id', companyController.updateCompany);
router.delete('/:id', companyController.deleteCompany);

export default router;
