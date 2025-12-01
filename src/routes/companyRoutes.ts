import { CompanyController } from '@/controllers/companyController';
import { requireAuth } from '@/middleware/authMiddleware';
import { Router } from 'express';

const companyRoutes = Router();

// Route công khai để lấy thông tin công ty
companyRoutes.get('/info', CompanyController.getCompanyInfo);

companyRoutes.put('/info', requireAuth, CompanyController.updateCompanyInfo);

export default companyRoutes;