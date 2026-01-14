export interface UserPreferences {
    theme: 'dark' | 'light' | 'system';
    accentColor: string;
    fontFamily: 'inter' | 'roboto' | 'outfit' | 'poppins' | 'system';
    fontSize: 'small' | 'medium' | 'large';
}

export interface User {
    id: string;
    email: string;
    name: string;
    username?: string;
    avatar?: string;
    bio?: string;
    status: 'online' | 'offline' | 'away' | 'busy';
    lastSeen?: string;
    isProfileComplete?: boolean;
    preferences?: UserPreferences;
}

export interface Message {
    _id: string;
    conversationId: string;
    sender: User;
    content: string;
    type: 'text' | 'image' | 'file' | 'audio' | 'video' | 'system';
    attachments?: {
        url: string;
        type: string;
        name: string;
        size: number;
    }[];
    replyTo?: Message;
    readBy: {
        user: string;
        readAt: string;
    }[];
    deliveredTo: {
        user: string;
        deliveredAt: string;
    }[];
    isEdited: boolean;
    isDeleted: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface Participant {
    user: User;
    role: 'admin' | 'member';
    joinedAt: string;
    lastRead?: string;
}

export interface Conversation {
    _id: string;
    type: 'direct' | 'group';
    name?: string;
    avatar?: string;
    description?: string;
    participants: Participant[];
    lastMessage?: Message;
    isArchived: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface TypingUser {
    userId: string;
    userName: string;
    conversationId: string;
}

export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
}
