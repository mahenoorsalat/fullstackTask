import express from 'express';
import { getUsersByRole } from '../controllers/authController.js'; 
import { protect, admin } from '../middleware/authMiddleware.js'; 
import { getAllUsers, deleteUser } from '../controllers/authController.js'; 

const router = express.Router();

// GET /api/user?role=seeker or /api/user?role=company
router.route('/').get(protect, getUsersByRole); 
router.route('/admin/users').get(protect, admin, getAllUsers);
router.route('/admin/users/:id').delete(protect, admin, deleteUser);

export default router;