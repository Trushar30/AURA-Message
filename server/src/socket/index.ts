import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { User, Message, Conversation } from '../models/index.js';

interface AuthenticatedSocket extends Socket {
    userId?: string;
    user?: any;
}

// Track online users: Map<userId, Set<socketId>>
const onlineUsers = new Map<string, Set<string>>();

// Track which conversations each socket is typing in: Map<socketId, Set<conversationId>>
const typingUsers = new Map<string, Set<string>>();

export const initializeSocket = (httpServer: HttpServer): Server => {
    const io = new Server(httpServer, {
        cors: {
            origin: config.clientUrl,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });

    // Authentication middleware
    io.use(async (socket: AuthenticatedSocket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                return next(new Error('Authentication required'));
            }

            const decoded = jwt.verify(token, config.jwt.secret) as { userId: string };
            const user = await User.findById(decoded.userId);

            if (!user) {
                return next(new Error('User not found'));
            }

            socket.userId = decoded.userId;
            socket.user = user;
            next();
        } catch (error) {
            next(new Error('Authentication failed'));
        }
    });

    io.on('connection', async (socket: AuthenticatedSocket) => {
        const userId = socket.userId!;
        console.log(`✓ User connected: ${socket.user?.name} (${userId})`);

        // Track online status
        if (!onlineUsers.has(userId)) {
            onlineUsers.set(userId, new Set());
        }
        onlineUsers.get(userId)!.add(socket.id);

        // Update user status to online
        await User.findByIdAndUpdate(userId, { status: 'online', lastSeen: new Date() });

        // Join user's conversation rooms
        const conversations = await Conversation.find({ 'participants.user': userId });
        conversations.forEach((conv) => {
            socket.join(`conversation:${conv._id}`);
        });

        // Broadcast online status to relevant users
        socket.broadcast.emit('user:online', { userId, status: 'online' });

        // Handle joining a conversation room
        socket.on('conversation:join', (conversationId: string) => {
            socket.join(`conversation:${conversationId}`);
        });

        // Handle leaving a conversation room
        socket.on('conversation:leave', (conversationId: string) => {
            socket.leave(`conversation:${conversationId}`);
        });

        // Handle new message
        socket.on('message:send', async (data: {
            conversationId: string;
            content: string;
            type?: string;
            replyTo?: string;
        }) => {
            try {
                const { conversationId, content, type = 'text', replyTo } = data;

                // Verify user is participant
                const conversation = await Conversation.findOne({
                    _id: conversationId,
                    'participants.user': userId,
                });

                if (!conversation) {
                    socket.emit('error', { message: 'Conversation not found' });
                    return;
                }

                // Create message
                const message = await Message.create({
                    conversationId,
                    sender: userId,
                    content,
                    type,
                    replyTo,
                    deliveredTo: [{ user: userId, deliveredAt: new Date() }],
                    readBy: [{ user: userId, readAt: new Date() }],
                });

                // Update conversation
                conversation.lastMessage = message._id;
                await conversation.save();

                // Populate sender info
                const populatedMessage = await message.populate('sender', 'name email avatar');

                // Emit to all participants in the conversation
                io.to(`conversation:${conversationId}`).emit('message:new', {
                    message: populatedMessage,
                    conversationId,
                });

                // Send delivery status to sender
                socket.emit('message:sent', { messageId: message._id, conversationId });
            } catch (error) {
                console.error('Error sending message:', error);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle typing indicator
        socket.on('typing:start', (conversationId: string) => {
            // Track which conversations this socket is typing in
            if (!typingUsers.has(socket.id)) {
                typingUsers.set(socket.id, new Set());
            }
            typingUsers.get(socket.id)!.add(conversationId);

            socket.to(`conversation:${conversationId}`).emit('typing:start', {
                userId,
                userName: socket.user?.name,
                conversationId,
            });
        });

        socket.on('typing:stop', (conversationId: string) => {
            // Remove from tracking
            const userTyping = typingUsers.get(socket.id);
            if (userTyping) {
                userTyping.delete(conversationId);
                if (userTyping.size === 0) {
                    typingUsers.delete(socket.id);
                }
            }

            socket.to(`conversation:${conversationId}`).emit('typing:stop', {
                userId,
                conversationId,
            });
        });

        // Handle message read
        socket.on('message:read', async (data: { conversationId: string; messageIds: string[] }) => {
            const { conversationId, messageIds } = data;

            try {
                // Update messages as read
                await Message.updateMany(
                    {
                        _id: { $in: messageIds },
                        'readBy.user': { $ne: userId },
                    },
                    {
                        $push: {
                            readBy: { user: userId, readAt: new Date() },
                        },
                    }
                );

                // Notify other users
                socket.to(`conversation:${conversationId}`).emit('message:read', {
                    userId,
                    conversationId,
                    messageIds,
                });
            } catch (error) {
                console.error('Error marking messages as read:', error);
            }
        });

        // Handle message delivered
        socket.on('message:delivered', async (data: { conversationId: string; messageIds: string[] }) => {
            const { conversationId, messageIds } = data;

            try {
                await Message.updateMany(
                    {
                        _id: { $in: messageIds },
                        'deliveredTo.user': { $ne: userId },
                    },
                    {
                        $push: {
                            deliveredTo: { user: userId, deliveredAt: new Date() },
                        },
                    }
                );

                socket.to(`conversation:${conversationId}`).emit('message:delivered', {
                    userId,
                    conversationId,
                    messageIds,
                });
            } catch (error) {
                console.error('Error marking messages as delivered:', error);
            }
        });

        // Handle user status change
        socket.on('status:change', async (status: 'online' | 'away' | 'busy') => {
            await User.findByIdAndUpdate(userId, { status });
            socket.broadcast.emit('user:status', { userId, status });
        });

        // Handle disconnect
        socket.on('disconnect', async () => {
            console.log(`✗ User disconnected: ${socket.user?.name} (${userId})`);

            // Clear typing indicators for all conversations this socket was typing in
            const socketTyping = typingUsers.get(socket.id);
            if (socketTyping) {
                socketTyping.forEach((conversationId) => {
                    socket.to(`conversation:${conversationId}`).emit('typing:stop', {
                        userId,
                        conversationId,
                    });
                });
                typingUsers.delete(socket.id);
            }

            // Remove socket from tracking
            const userSockets = onlineUsers.get(userId);
            if (userSockets) {
                userSockets.delete(socket.id);

                // If no more sockets, user is offline
                if (userSockets.size === 0) {
                    onlineUsers.delete(userId);
                    await User.findByIdAndUpdate(userId, { status: 'offline', lastSeen: new Date() });
                    socket.broadcast.emit('user:offline', { userId, lastSeen: new Date() });
                }
            }
        });
    });

    return io;
};

export const getOnlineUsers = (): string[] => {
    return Array.from(onlineUsers.keys());
};

export const isUserOnline = (userId: string): boolean => {
    return onlineUsers.has(userId);
};
