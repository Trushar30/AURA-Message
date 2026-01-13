import { Response } from 'express';
import mongoose from 'mongoose';
import { User, FriendRequest } from '../models/index.js';
import { AuthRequest } from '../middleware/index.js';

// Send friend request
export const sendFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId } = req.params;
        const senderId = req.user?._id;

        if (!senderId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        if (senderId.toString() === userId) {
            res.status(400).json({ error: 'Cannot send friend request to yourself' });
            return;
        }

        // Check if recipient exists
        const recipient = await User.findById(userId);
        if (!recipient) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Check if already friends
        if (req.user?.friends?.includes(new mongoose.Types.ObjectId(userId))) {
            res.status(400).json({ error: 'Already friends with this user' });
            return;
        }

        // Check if request already exists (in either direction)
        const existingRequest = await FriendRequest.findOne({
            $or: [
                { sender: senderId, receiver: userId },
                { sender: userId, receiver: senderId }
            ],
            status: 'pending'
        });

        if (existingRequest) {
            res.status(400).json({ error: 'Friend request already exists' });
            return;
        }

        const friendRequest = await FriendRequest.create({
            sender: senderId,
            receiver: userId,
            status: 'pending'
        });

        await friendRequest.populate('receiver', 'name email avatar username status');

        res.status(201).json({
            message: 'Friend request sent',
            request: friendRequest
        });
    } catch (error) {
        console.error('Send friend request error:', error);
        res.status(500).json({ error: 'Failed to send friend request' });
    }
};

// Accept friend request
export const acceptFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { requestId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            res.status(404).json({ error: 'Friend request not found' });
            return;
        }

        if (friendRequest.receiver.toString() !== userId.toString()) {
            res.status(403).json({ error: 'Not authorized to accept this request' });
            return;
        }

        if (friendRequest.status !== 'pending') {
            res.status(400).json({ error: 'Request has already been processed' });
            return;
        }

        // Update request status
        friendRequest.status = 'accepted';
        await friendRequest.save();

        // Add each user to the other's friends list
        await User.findByIdAndUpdate(friendRequest.sender, {
            $addToSet: { friends: friendRequest.receiver }
        });
        await User.findByIdAndUpdate(friendRequest.receiver, {
            $addToSet: { friends: friendRequest.sender }
        });

        res.json({ message: 'Friend request accepted' });
    } catch (error) {
        console.error('Accept friend request error:', error);
        res.status(500).json({ error: 'Failed to accept friend request' });
    }
};

// Reject friend request
export const rejectFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { requestId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            res.status(404).json({ error: 'Friend request not found' });
            return;
        }

        if (friendRequest.receiver.toString() !== userId.toString()) {
            res.status(403).json({ error: 'Not authorized to reject this request' });
            return;
        }

        friendRequest.status = 'rejected';
        await friendRequest.save();

        res.json({ message: 'Friend request rejected' });
    } catch (error) {
        console.error('Reject friend request error:', error);
        res.status(500).json({ error: 'Failed to reject friend request' });
    }
};

// Cancel sent friend request
export const cancelFriendRequest = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { requestId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const friendRequest = await FriendRequest.findById(requestId);

        if (!friendRequest) {
            res.status(404).json({ error: 'Friend request not found' });
            return;
        }

        if (friendRequest.sender.toString() !== userId.toString()) {
            res.status(403).json({ error: 'Not authorized to cancel this request' });
            return;
        }

        await FriendRequest.findByIdAndDelete(requestId);

        res.json({ message: 'Friend request cancelled' });
    } catch (error) {
        console.error('Cancel friend request error:', error);
        res.status(500).json({ error: 'Failed to cancel friend request' });
    }
};

// Get pending requests (received)
export const getPendingRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const requests = await FriendRequest.find({
            receiver: userId,
            status: 'pending'
        })
            .populate('sender', 'name email avatar username status')
            .sort({ createdAt: -1 });

        res.json({ requests });
    } catch (error) {
        console.error('Get pending requests error:', error);
        res.status(500).json({ error: 'Failed to get pending requests' });
    }
};

// Get sent requests
export const getSentRequests = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const requests = await FriendRequest.find({
            sender: userId,
            status: 'pending'
        })
            .populate('receiver', 'name email avatar username status')
            .sort({ createdAt: -1 });

        res.json({ requests });
    } catch (error) {
        console.error('Get sent requests error:', error);
        res.status(500).json({ error: 'Failed to get sent requests' });
    }
};

// Get friends list
export const getFriends = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const user = await User.findById(userId)
            .populate('friends', 'name email avatar username status lastSeen');

        res.json({ friends: user?.friends || [] });
    } catch (error) {
        console.error('Get friends error:', error);
        res.status(500).json({ error: 'Failed to get friends' });
    }
};

// Remove friend
export const removeFriend = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId: friendId } = req.params;
        const userId = req.user?._id;

        if (!userId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Remove from both users' friends lists
        await User.findByIdAndUpdate(userId, {
            $pull: { friends: friendId }
        });
        await User.findByIdAndUpdate(friendId, {
            $pull: { friends: userId }
        });

        res.json({ message: 'Friend removed' });
    } catch (error) {
        console.error('Remove friend error:', error);
        res.status(500).json({ error: 'Failed to remove friend' });
    }
};

// Get friendship status between current user and another user
export const getFriendshipStatus = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { userId: targetUserId } = req.params;
        const currentUserId = req.user?._id;

        if (!currentUserId) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        // Check if friends
        const user = await User.findById(currentUserId);
        if (user?.friends?.includes(new mongoose.Types.ObjectId(targetUserId))) {
            res.json({ status: 'friends' });
            return;
        }

        // Check for pending request
        const pendingRequest = await FriendRequest.findOne({
            $or: [
                { sender: currentUserId, receiver: targetUserId },
                { sender: targetUserId, receiver: currentUserId }
            ],
            status: 'pending'
        });

        if (pendingRequest) {
            if (pendingRequest.sender.toString() === currentUserId.toString()) {
                res.json({ status: 'pending_sent', requestId: pendingRequest._id });
            } else {
                res.json({ status: 'pending_received', requestId: pendingRequest._id });
            }
            return;
        }

        res.json({ status: 'none' });
    } catch (error) {
        console.error('Get friendship status error:', error);
        res.status(500).json({ error: 'Failed to get friendship status' });
    }
};
