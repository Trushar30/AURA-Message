import { Router } from 'express';
import { authenticate } from '../middleware/index.js';
import {
    createCategory,
    getCategories,
    updateCategory,
    deleteCategory,
    addFriendToCategory,
    removeFriendFromCategory,
    reorderCategories
} from '../controllers/categoryController.js';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

// Category CRUD
router.post('/', createCategory as any);
router.get('/', getCategories as any);
router.patch('/:id', updateCategory as any);
router.delete('/:id', deleteCategory as any);

// Friend management in categories
router.post('/:id/friends/:friendId', addFriendToCategory as any);
router.delete('/:id/friends/:friendId', removeFriendFromCategory as any);

// Reorder categories
router.patch('/reorder', reorderCategories as any);

export default router;
