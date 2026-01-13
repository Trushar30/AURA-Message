import { io, Socket } from 'socket.io-client';
import { Message, TypingUser } from '../types';

type MessageHandler = (data: { message: Message; conversationId: string }) => void;
type TypingHandler = (data: TypingUser) => void;
type PresenceHandler = (data: { userId: string; status?: string; lastSeen?: Date }) => void;
type ReadHandler = (data: { userId: string; conversationId: string; messageIds: string[] }) => void;

class SocketService {
    private socket: Socket | null = null;
    private messageHandlers: Set<MessageHandler> = new Set();
    private typingStartHandlers: Set<TypingHandler> = new Set();
    private typingStopHandlers: Set<TypingHandler> = new Set();
    private onlineHandlers: Set<PresenceHandler> = new Set();
    private offlineHandlers: Set<PresenceHandler> = new Set();
    private readHandlers: Set<ReadHandler> = new Set();

    connect(token: string) {
        if (this.socket?.connected) return;

        this.socket = io(window.location.origin, {
            auth: { token },
            transports: ['websocket', 'polling'],
        });

        this.socket.on('connect', () => {
            console.log('✓ Socket connected');
        });

        this.socket.on('disconnect', (reason) => {
            console.log('✗ Socket disconnected:', reason);
        });

        this.socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error.message);
        });

        // Message events
        this.socket.on('message:new', (data: { message: Message; conversationId: string }) => {
            this.messageHandlers.forEach((handler) => handler(data));
        });

        // Typing events
        this.socket.on('typing:start', (data: TypingUser) => {
            this.typingStartHandlers.forEach((handler) => handler(data));
        });

        this.socket.on('typing:stop', (data: TypingUser) => {
            this.typingStopHandlers.forEach((handler) => handler(data));
        });

        // Presence events
        this.socket.on('user:online', (data: { userId: string; status: string }) => {
            this.onlineHandlers.forEach((handler) => handler(data));
        });

        this.socket.on('user:offline', (data: { userId: string; lastSeen: Date }) => {
            this.offlineHandlers.forEach((handler) => handler(data));
        });

        this.socket.on('user:status', (data: { userId: string; status: string }) => {
            this.onlineHandlers.forEach((handler) => handler(data));
        });

        // Read events
        this.socket.on('message:read', (data: { userId: string; conversationId: string; messageIds: string[] }) => {
            this.readHandlers.forEach((handler) => handler(data));
        });
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
    }

    // Emit events
    sendMessage(data: { conversationId: string; content: string; type?: string; replyTo?: string }) {
        this.socket?.emit('message:send', data);
    }

    startTyping(conversationId: string) {
        this.socket?.emit('typing:start', conversationId);
    }

    stopTyping(conversationId: string) {
        this.socket?.emit('typing:stop', conversationId);
    }

    markAsRead(conversationId: string, messageIds: string[]) {
        this.socket?.emit('message:read', { conversationId, messageIds });
    }

    markAsDelivered(conversationId: string, messageIds: string[]) {
        this.socket?.emit('message:delivered', { conversationId, messageIds });
    }

    joinConversation(conversationId: string) {
        this.socket?.emit('conversation:join', conversationId);
    }

    leaveConversation(conversationId: string) {
        this.socket?.emit('conversation:leave', conversationId);
    }

    changeStatus(status: 'online' | 'away' | 'busy') {
        this.socket?.emit('status:change', status);
    }

    // Event subscriptions
    onMessage(handler: MessageHandler) {
        this.messageHandlers.add(handler);
        return () => this.messageHandlers.delete(handler);
    }

    onTypingStart(handler: TypingHandler) {
        this.typingStartHandlers.add(handler);
        return () => this.typingStartHandlers.delete(handler);
    }

    onTypingStop(handler: TypingHandler) {
        this.typingStopHandlers.add(handler);
        return () => this.typingStopHandlers.delete(handler);
    }

    onUserOnline(handler: PresenceHandler) {
        this.onlineHandlers.add(handler);
        return () => this.onlineHandlers.delete(handler);
    }

    onUserOffline(handler: PresenceHandler) {
        this.offlineHandlers.add(handler);
        return () => this.offlineHandlers.delete(handler);
    }

    onMessageRead(handler: ReadHandler) {
        this.readHandlers.add(handler);
        return () => this.readHandlers.delete(handler);
    }

    isConnected() {
        return this.socket?.connected || false;
    }
}

export const socketService = new SocketService();
