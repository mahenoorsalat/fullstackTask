import express from 'express';
import {
  getBlogPost,
  createBlogPost,
  updateBlogPost,
  deleteBlogPost,
  addComment,
  updateComment,
  deleteComment,
  addOrUpdateReactions
} from '../controllers/blogController.js';

import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// 📄 Blog post routes
router.route('/')
  .get(getBlogPost)
  .post(protect, createBlogPost);

router.route('/:id')
  .put(protect, updateBlogPost)
  .delete(protect, deleteBlogPost);

// ❤️ Reaction route
router.route('/:id/react')
  .put(protect, addOrUpdateReactions);

// 💬 Comment routes
router.route('/:id/comment')
  .post(protect, addComment);

router.route('/:postId/comment/:commentId')
  .put(protect, updateComment)
  .delete(protect, deleteComment);

export default router;
