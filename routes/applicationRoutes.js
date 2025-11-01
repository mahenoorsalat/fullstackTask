// routes/applicationRoutes.js (Corrected)

import express from 'express'
// Import the missing applyToJob controller
import { applyToJob, getApplicationForJob, getSeekerApplications, updateApplication } from '../controllers/applicationController.js'; 
import { protect, role } from '../middleware/authMiddleware.js'

const router = express.Router();

router.get('/' , protect , role ('seeker') , getSeekerApplications);
router.put('/:id/status' , protect , role('company' , 'admin') , updateApplication);

router.post('/job/:jobId', protect, role('seeker'), applyToJob); 

router.get('/job/:jobId', protect, role('company'), getApplicationForJob); 

export default router;