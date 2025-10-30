import express from 'express';
import { getUserProfile, loginUser, registerUser, updateUserProfile } from "../controllers/authController.js";
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Register route
router.post('/register', registerUser);
// Login route
router.post('/login', loginUser);

router.route('/profile')
.get(protect , getUserProfile)
.put(protect , updateUserProfile)


export default router;
