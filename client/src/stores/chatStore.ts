import { create } from 'zustand';
import { Conversation, Message, TypingUser } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface ChatStore {
    conversations: Conversation[];
    activeConversation: Conversation | null;
    messages: Message[];
    typingUsers: TypingUser[];
    isLoadingConversations: boolean;
    isLoadingMessages: boolean;

    // Actions
    fetchConversations: () => Promise<void>;
    setActiveConversation: (conversation: Conversation | null) => void;
    fetchMessages: (conversationId: string) => Promise<void>;
    sendMessage: (content: string, type?: string) => void;
    addMessage: (message: Message) => void;
    updateConversation: (conversation: Conversation) => void;
    addTypingUser: (user: TypingUser) => void;
    removeTypingUser: (userId: string, conversationId: string) => void;
    createDirectConversation: (recipientId: string) => Promise<Conversation>;
    createGroupConversation: (name: string, participantIds: string[], description?: string) => Promise<Conversation>;
}

export const useChatStore = create<ChatStore>((set, get) => ({
    conversations: [],
    activeConversation: null,
    messages: [],
    typingUsers: [],
    isLoadingConversations: false,
    isLoadingMessages: false,

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

            // Mark messages as delivered/read
            const unreadIds = response.messages
                .filter((m: Message) => m.sender.id !== get().activeConversation?.participants[0]?.user?.id)
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
}));
