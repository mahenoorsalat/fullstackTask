import express from 'express';
import { getJobs, getJobById, createJob, updateJob, deleteJob, getEmployerJobs } from '../controllers/jobController.js';
import { protect, role } from '../middleware/authMiddleware.js';
import { applyToJob , getApplicationForJob } from '../controllers/applicationController.js';
const router = express.Router();

router.get('/'  , getJobs);
router.get('/employer/jobs' , protect , role('company') , getEmployerJobs)

router.get('/:id' , getJobById);
router.post('/:id/apply' , protect , role('seeker') , applyToJob)
router.get('/:id/applications' , protect , role('company') , getApplicationForJob)


router.route('/')
.post(protect , role("company") , createJob);

router.route('/:id')
.put(protect , role('company') , updateJob)
.delete(protect , role('company' , 'admin') , deleteJob);


export default router;