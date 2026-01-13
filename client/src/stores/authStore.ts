import { create } from 'zustand';
import { User } from '../types';
import { api } from '../services/api';
import { socketService } from '../services/socket';

interface AuthStore {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (email: string, password: string, name: string) => Promise<void>;
    logout: () => Promise<void>;
    checkAuth: () => Promise<void>;
    updateProfile: (data: { name?: string; bio?: string; avatar?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,

    login: async (email, password) => {
        const response = await api.login({ email, password });
        api.setToken(response.token);
        socketService.connect(response.token);
        set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
        });
    },

    register: async (email, password, name) => {
        const response = await api.register({ email, password, name });
        api.setToken(response.token);
        socketService.connect(response.token);
        set({
            user: response.user,
            token: response.token,
            isAuthenticated: true,
        });
    },

    logout: async () => {
        try {
            await api.logout();
        } catch {
            // Ignore errors
        }
        api.setToken(null);
        socketService.disconnect();
        set({
            user: null,
            token: null,
            isAuthenticated: false,
        });
    },

    checkAuth: async () => {
        const token = api.getToken();
        if (!token) {
            set({ isLoading: false });
            return;
        }

        try {
            const response = await api.getMe();
            socketService.connect(token);
            set({
                user: response.user,
                token,
                isAuthenticated: true,
                isLoading: false,
            });
        } catch {
            api.setToken(null);
            set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
            });
        }
    },

    updateProfile: async (data) => {
        const response = await api.updateProfile(data);
        set({ user: response.user });
    },
}));
