import { Router } from 'express';
import sensorRoutes from './sensor.route.js';
// import maintenanceRoutes from './maintenance.route.js'; // Example additional route
// import alertRoutes from './alert.route.js';           // Example additional route

const router = Router();

router.use('/sensors', sensorRoutes);
// router.use('/maintenance', maintenanceRoutes);
// router.use('/alerts', alertRoutes);
export default router;

