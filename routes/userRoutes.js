import express from 'express';
import { getUsersByRole } from '../controllers/authController.js'; 
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// GET /api/user?role=seeker or /api/user?role=company
router.route('/').get(protect, getUsersByRole); 

export default router;