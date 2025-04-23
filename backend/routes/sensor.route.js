import { Router } from "express";
import {getReadingsByManhole} from '../controllers/sensor.controller.js';
const router = Router();
router.get('/readings/manhole/:manholeId?limit&timeRange',getReadingsByManhole);

export default router;
// Get last 50 readings from past 6 hours
// GET /readings/manhole/:manholeId?limit=50&timeRange=6