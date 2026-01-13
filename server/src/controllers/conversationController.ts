import { Response } from 'express';
import mongoose from 'mongoose';
import { Conversation, Message, User } from '../models/index.js';
import { AuthRequest } from '../middleware/index.js';

export const getConversations = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;

        const conversations = await Conversation.find({
            'participants.user': userId,
            isArchived: false,
        })
            .populate('participants.user', 'name email avatar status lastSeen')
            .populate('lastMessage')
            .sort({ updatedAt: -1 });

        res.json({ conversations });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get conversations' });
    }
};

export const getConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        const conversation = await Conversation.findOne({
            _id: id,
            'participants.user': userId,
        })
            .populate('participants.user', 'name email avatar status lastSeen')
            .populate('lastMessage');

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        res.json({ conversation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get conversation' });
    }
};

export const createDirectConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { recipientId } = req.body;

        if (!recipientId) {
            res.status(400).json({ error: 'Recipient ID required' });
            return;
        }

        // Check if recipient exists
        const recipient = await User.findById(recipientId);
        if (!recipient) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        // Check if conversation already exists
        const existingConversation = await Conversation.findOne({
            type: 'direct',
            'participants.user': { $all: [userId, recipientId] },
        }).populate('participants.user', 'name email avatar status lastSeen');

        if (existingConversation) {
            res.json({ conversation: existingConversation });
            return;
        }

        // Create new conversation
        const conversation = await Conversation.create({
            type: 'direct',
            participants: [
                { user: userId, role: 'member' },
                { user: recipientId, role: 'member' },
            ],
            createdBy: userId,
        });

        const populatedConversation = await conversation.populate(
            'participants.user',
            'name email avatar status lastSeen'
        );

        res.status(201).json({ conversation: populatedConversation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create conversation' });
    }
};

export const createGroupConversation = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const userId = req.user?._id;
        const { name, participantIds, description } = req.body;

        if (!name || !participantIds || participantIds.length < 1) {
            res.status(400).json({ error: 'Group name and participants required' });
            return;
        }

        // Ensure all participants exist
        const participants = [
            { user: userId, role: 'admin' as const },
            ...participantIds.map((id: string) => ({ user: new mongoose.Types.ObjectId(id), role: 'member' as const })),
        ];

        const conversation = await Conversation.create({
            type: 'group',
            name,
            description,
            participants,
            createdBy: userId,
        });

        const populatedConversation = await conversation.populate(
            'participants.user',
            'name email avatar status lastSeen'
        );

        res.status(201).json({ conversation: populatedConversation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create group' });
    }
};

export const updateGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        const { name, description, avatar } = req.body;

        const conversation = await Conversation.findOne({
            _id: id,
            type: 'group',
            'participants.user': userId,
            'participants.role': 'admin',
        });

        if (!conversation) {
            res.status(404).json({ error: 'Group not found or not authorized' });
            return;
        }

        if (name) conversation.name = name;
        if (description !== undefined) conversation.description = description;
        if (avatar !== undefined) conversation.avatar = avatar;

        await conversation.save();

        const populatedConversation = await conversation.populate(
            'participants.user',
            'name email avatar status lastSeen'
        );

        res.json({ conversation: populatedConversation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update group' });
    }
};

export const addParticipant = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;
        const { participantId } = req.body;

        const conversation = await Conversation.findOne({
            _id: id,
            type: 'group',
            'participants.user': userId,
        });

        if (!conversation) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        // Check if user is already a participant
        const isParticipant = conversation.participants.some(
            (p) => p.user.toString() === participantId
        );

        if (isParticipant) {
            res.status(400).json({ error: 'User already in group' });
            return;
        }

        conversation.participants.push({
            user: new mongoose.Types.ObjectId(participantId),
            role: 'member',
            joinedAt: new Date(),
        });

        await conversation.save();

        const populatedConversation = await conversation.populate(
            'participants.user',
            'name email avatar status lastSeen'
        );

        res.json({ conversation: populatedConversation });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add participant' });
    }
};

export const leaveGroup = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        const conversation = await Conversation.findOne({
            _id: id,
            type: 'group',
            'participants.user': userId,
        });

        if (!conversation) {
            res.status(404).json({ error: 'Group not found' });
            return;
        }

        conversation.participants = conversation.participants.filter(
            (p) => p.user.toString() !== userId?.toString()
        );

        await conversation.save();

        res.json({ message: 'Left group successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to leave group' });
    }
};
