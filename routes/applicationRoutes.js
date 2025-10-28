import express from 'express'
import { getSeekerApplications, updateApplication } from '../controllers/applicationController.js';
import { protect, role } from '../middleware/authMiddleware.js'
const router = express.Router();

router.get('/' , protect , role ('seeker') , getSeekerApplications);
router.put('/:id/status' , protect , role('company' , 'admin') , updateApplication);

export default router;