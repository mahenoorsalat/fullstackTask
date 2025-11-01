import express from 'express'
import { getApplicationForJob, getSeekerApplications, updateApplication } from '../controllers/applicationController.js';
import { protect, role } from '../middleware/authMiddleware.js'
const router = express.Router();

router.get('/' , protect , role ('seeker') , getSeekerApplications);
router.put('/:id/status' , protect , role('company' , 'admin') , updateApplication);
// Example route to add:
router.route('/job/:jobId').get(protect, getApplicationForJob);
export default router;