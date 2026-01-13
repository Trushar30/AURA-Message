import { Response } from 'express';
import mongoose from 'mongoose';
import { Message, Conversation } from '../models/index.js';
import { AuthRequest } from '../middleware/index.js';

export const getMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { conversationId } = req.params;
        const { before, limit = 50 } = req.query;
        const userId = req.user?._id;

        // Verify user is participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            'participants.user': userId,
        });

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        const query: any = { conversationId, isDeleted: false };

        if (before) {
            query.createdAt = { $lt: new Date(before as string) };
        }

        const messages = await Message.find(query)
            .populate('sender', 'name email avatar')
            .populate('replyTo')
            .sort({ createdAt: -1 })
            .limit(Number(limit));

        res.json({ messages: messages.reverse() });
    } catch (error) {
        res.status(500).json({ error: 'Failed to get messages' });
    }
};

export const sendMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { conversationId } = req.params;
        const { content, type = 'text', replyTo, attachments } = req.body;
        const userId = req.user?._id;

        // Verify user is participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            'participants.user': userId,
        });

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        const message = await Message.create({
            conversationId,
            sender: userId,
            content,
            type,
            replyTo,
            attachments: attachments || [],
            deliveredTo: [{ user: userId, deliveredAt: new Date() }],
            readBy: [{ user: userId, readAt: new Date() }],
        });

        // Update conversation's last message
        conversation.lastMessage = message._id;
        await conversation.save();

        const populatedMessage = await message.populate('sender', 'name email avatar');

        res.status(201).json({ message: populatedMessage });
    } catch (error) {
        res.status(500).json({ error: 'Failed to send message' });
    }
};

export const markAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { conversationId } = req.params;
        const userId = req.user?._id;

        // Verify user is participant
        const conversation = await Conversation.findOne({
            _id: conversationId,
            'participants.user': userId,
        });

        if (!conversation) {
            res.status(404).json({ error: 'Conversation not found' });
            return;
        }

        // Mark all messages as read
        await Message.updateMany(
            {
                conversationId,
                sender: { $ne: userId },
                'readBy.user': { $ne: userId },
            },
            {
                $push: {
                    readBy: { user: userId, readAt: new Date() },
                },
            }
        );

        // Update last read in conversation
        const participantIndex = conversation.participants.findIndex(
            (p) => p.user.toString() === userId?.toString()
        );

        if (participantIndex !== -1) {
            conversation.participants[participantIndex].lastRead = new Date();
            await conversation.save();
        }

        res.json({ message: 'Messages marked as read' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark as read' });
    }
};

export const editMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;
        const { content } = req.body;
        const userId = req.user?._id;

        const message = await Message.findOne({
            _id: messageId,
            sender: userId,
            isDeleted: false,
        });

        if (!message) {
            res.status(404).json({ error: 'Message not found' });
            return;
        }

        message.content = content;
        message.isEdited = true;
        await message.save();

        const populatedMessage = await message.populate('sender', 'name email avatar');

        res.json({ message: populatedMessage });
    } catch (error) {
        res.status(500).json({ error: 'Failed to edit message' });
    }
};

export const deleteMessage = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;
        const userId = req.user?._id;

        const message = await Message.findOne({
            _id: messageId,
            sender: userId,
        });

        if (!message) {
            res.status(404).json({ error: 'Message not found' });
            return;
        }

        message.isDeleted = true;
        message.content = 'This message was deleted';
        await message.save();

        res.json({ message: 'Message deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete message' });
    }
};

export const searchMessages = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const { q, conversationId } = req.query;
        const userId = req.user?._id;

        if (!q || typeof q !== 'string') {
            res.status(400).json({ error: 'Search query required' });
            return;
        }

        // Get user's conversations
        const userConversations = await Conversation.find({
            'participants.user': userId,
        }).select('_id');

        const conversationIds = userConversations.map((c) => c._id);

        const query: any = {
            conversationId: conversationId
                ? new mongoose.Types.ObjectId(conversationId as string)
                : { $in: conversationIds },
            isDeleted: false,
            $text: { $search: q },
        };

        const messages = await Message.find(query)
            .populate('sender', 'name email avatar')
            .sort({ score: { $meta: 'textScore' } })
            .limit(50);

        res.json({ messages });
    } catch (error) {
        res.status(500).json({ error: 'Search failed' });
    }
};
