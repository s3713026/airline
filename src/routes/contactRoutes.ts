import { ContactController } from '@/controllers/contactController';
import { Router } from 'express';

const contactRoutes = Router();

contactRoutes.post('/send', ContactController.sendMessage);

export default contactRoutes;