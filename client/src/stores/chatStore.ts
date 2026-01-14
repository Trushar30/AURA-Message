import { create } from 'zustand';
import { Conversation, Message, TypingUser } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { useAuthStore } from './authStore';

interface ChatStore {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: Message[];
    typingUsers: TypingUser[];
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;
    isSummarizing: boolean;

    // Actions
    fetchConversations: () => Promise<void>;
    setActiveConversation: (conversation: Conversation | null) => void;
    fetchMessages: (conversationId: string) => Promise<void>;
    sendMessage: (content: string, type?: string) => void;
    addMessage: (message: Message) => void;
    updateConversation: (conversation: Conversation) => void;
    addTypingUser: (user: TypingUser) => void;
    removeTypingUser: (userId: string, conversationId: string) => void;
    updateMessageReadStatus: (messageIds: string[], userId: string, readAt: string) => void;
    createDirectConversation: (recipientId: string) => Promise<Conversation>;
    createGroupConversation: (name: string, participantIds: string[], description?: string) => Promise<Conversation>;
    summarizeMessages: (messageIds: string[]) => Promise<string>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    typingUsers: [],
    isLoadingConversations: false,

    isLoadingMessages: false,
    isSummarizing: false,

    fetchConversations: async () => {
        set({ isLoadingConversations: true });
        try {
            const response = await api.getConversations();
            set({ conversations: response.conversations });
        } finally {
            set({ isLoadingConversations: false });
        }
    },

    setActiveConversation: (conversation) => {
        const prev = get().activeConversation;
        if (prev) {
            socketService.leaveConversation(prev._id);
        }
        if (conversation) {
            socketService.joinConversation(conversation._id);
        }
        set({ activeConversation: conversation, messages: [], typingUsers: [] });
    },

    fetchMessages: async (conversationId) => {
        set({ isLoadingMessages: true });
        try {
            const response = await api.getMessages(conversationId);
            set({ messages: response.messages });

            // Get current user ID from authStore
            const currentUser = useAuthStore.getState().user;
            const currentUserId = currentUser?.id || (currentUser as any)?._id;

            if (!currentUserId) return;

            // Find all message IDs from other users (messages we need to mark as read)
            const unreadIds = response.messages
                .filter((m: Message) => {
                    // Get sender ID (handle both id and _id)
                    const senderId = m.sender.id || (m.sender as any)?._id;
                    // Only mark messages from OTHER users as read
                    return senderId !== currentUserId;
                })
                .map((m: Message) => m._id);

            if (unreadIds.length > 0) {
                socketService.markAsRead(conversationId, unreadIds);
            }
        } finally {
            set({ isLoadingMessages: false });
        }
    },

    sendMessage: (content, type = 'text') => {
        const conversation = get().activeConversation;
        if (!conversation) return;

        socketService.sendMessage({
            conversationId: conversation._id,
            content,
            type,
        });
        socketService.stopTyping(conversation._id);
    },

    addMessage: (message) => {
        set((state) => {
            // Only add if in the active conversation
            if (state.activeConversation?._id !== message.conversationId) {
                // Update conversation's last message
                const updatedConversations = state.conversations.map((c) =>
                    c._id === message.conversationId ? { ...c, lastMessage: message, updatedAt: message.createdAt } : c
                );
                // Sort by most recent
                updatedConversations.sort((a, b) =>
                    new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                );
                return { conversations: updatedConversations };
            }

            // Check if message already exists
            if (state.messages.some((m) => m._id === message._id)) {
                return state;
            }

            const updatedConversations = state.conversations.map((c) =>
                c._id === message.conversationId ? { ...c, lastMessage: message, updatedAt: message.createdAt } : c
            );
            updatedConversations.sort((a, b) =>
                new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
            );

            return {
                messages: [...state.messages, message],
                conversations: updatedConversations,
            };
        });
    },

    updateConversation: (conversation) => {
        set((state) => ({
            conversations: state.conversations.map((c) =>
                c._id === conversation._id ? conversation : c
            ),
            activeConversation:
                state.activeConversation?._id === conversation._id
                    ? conversation
                    : state.activeConversation,
        }));
    },

    addTypingUser: (user) => {
        set((state) => {
            if (state.typingUsers.some((u) => u.userId === user.userId)) {
                return state;
            }
            return { typingUsers: [...state.typingUsers, user] };
        });
    },

    removeTypingUser: (userId, conversationId) => {
        set((state) => ({
            typingUsers: state.typingUsers.filter(
                (u) => !(u.userId === userId && u.conversationId === conversationId)
            ),
        }));
    },

    createDirectConversation: async (recipientId) => {
        const response = await api.createDirectConversation(recipientId);
        set((state) => {
            const exists = state.conversations.some((c) => c._id === response.conversation._id);
            if (exists) return state;
            return { conversations: [response.conversation, ...state.conversations] };
        });
        return response.conversation;
    },

    createGroupConversation: async (name, participantIds, description) => {
        const response = await api.createGroupConversation({ name, participantIds, description });
        set((state) => ({
            conversations: [response.conversation, ...state.conversations],
        }));
        return response.conversation;
    },

    updateMessageReadStatus: (messageIds, userId, readAt) => {
        set((state) => ({
            messages: state.messages.map((msg) => {
                if (messageIds.includes(msg._id)) {
                    // Check if already read by this user
                    const alreadyRead = msg.readBy.some((r) => r.user === userId);
                    if (alreadyRead) return msg;

                    return {
                        ...msg,
                        readBy: [...msg.readBy, { user: userId, readAt }],
                    };
                }
                return msg;
            }),
        }));
    },

    summarizeMessages: async (messageIds) => {
        set({ isSummarizing: true });
        try {
            // Get content of selected messages
            const messages = get().messages
                .filter(m => messageIds.includes(m._id))
                .map(m => `${m.sender.name}: ${m.content}`);

            const response = await api.summarizeMessages(messages);
            return response.summary;
        } finally {
            set({ isSummarizing: false });
        }
    },
}));
