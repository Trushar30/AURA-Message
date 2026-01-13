import { Router } from 'express';
import { authenticate } from '../middleware/index.js';
import {
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    cancelFriendRequest,
    getPendingRequests,
    getSentRequests,
    getFriends,
    removeFriend,
    getFriendshipStatus
} from '../controllers/friendController.js';

const router = Router();

// All routes require authentication
router.use(authenticate as any);

// Friend request routes
router.post('/request/:userId', sendFriendRequest as any);
router.post('/accept/:requestId', acceptFriendRequest as any);
router.post('/reject/:requestId', rejectFriendRequest as any);
router.delete('/cancel/:requestId', cancelFriendRequest as any);

// Get requests
router.get('/pending', getPendingRequests as any);
router.get('/sent', getSentRequests as any);

// Friends list
router.get('/', getFriends as any);
router.delete('/:userId', removeFriend as any);

// Friendship status
router.get('/status/:userId', getFriendshipStatus as any);

export default router;
