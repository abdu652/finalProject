import { Router } from 'express'
import {
    createManhole, 
    getAllManholes, 
    getManholesNearLocation, 
    getManholesByZone, 
    updateManholeStatus
}
  from '../controllers/manhole.controller.js'

  const router = Router();
  //create the manholes
  router.post('/',createManhole);
  //get all manholes
  router.get('/',getAllManholes);
  //get manholes near to specific location
  router.get('/analytics',getManholesNearLocation);
  //get manhole from a given zone
  router.get('/:zone',getManholesByZone);
  // update amnhole using id
  router.put('/:id',updateManholeStatus)

  export default router;
