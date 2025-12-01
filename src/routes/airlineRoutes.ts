import { AirlineController } from '@/controllers/airlineController';
import { requireAuth } from '@/middleware/authMiddleware';
import { uploadAirlineLogo } from '@/middleware/uploadMiddleware';
import { Router } from 'express';

const airlineRoutes = Router();

airlineRoutes.get('/', AirlineController.getAll);
airlineRoutes.get('/:name', AirlineController.getByName);
airlineRoutes.post('/', requireAuth, uploadAirlineLogo, AirlineController.create);
airlineRoutes.put('/:name', requireAuth, AirlineController.update);
airlineRoutes.delete('/:name', requireAuth, AirlineController.delete);
airlineRoutes.post('/import', requireAuth, AirlineController.importAirlines);
airlineRoutes.delete('/', requireAuth, AirlineController.deleteAll);

export default airlineRoutes;