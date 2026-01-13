const API_URL = '/api';

class ApiService {
    private token: string | null = null;

    setToken(token: string | null) {
        this.token = token;
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    }

    getToken(): string | null {
        if (!this.token) {
            this.token = localStorage.getItem('token');
        }
        return this.token;
    }

    private async request<T>(
        endpoint: string,
        options: RequestInit = {}
    ): Promise<T> {
        const token = this.getToken();

        const headers: HeadersInit = {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` }),
            ...options.headers,
        };

        const response = await fetch(`${API_URL}${endpoint}`, {
            ...options,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || 'Request failed');
        }

        return response.json();
    }

    // Auth
    async register(data: { email: string; password: string; name: string }) {
        return this.request<{ token: string; user: any }>('/auth/register', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async login(data: { email: string; password: string }) {
        return this.request<{ token: string; user: any }>('/auth/login', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async getMe() {
        return this.request<{ user: any }>('/auth/me');
    }

    async updateProfile(data: { name?: string; bio?: string; avatar?: string }) {
        return this.request<{ user: any }>('/auth/profile', {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async searchUsers(query: string) {
        return this.request<{ users: any[] }>(`/auth/search?q=${encodeURIComponent(query)}`);
    }

    async logout() {
        return this.request<{ message: string }>('/auth/logout', { method: 'POST' });
    }

    async completeProfile(data: { name: string; bio?: string }) {
        return this.request<{ user: any }>('/auth/complete-profile', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    // Conversations
    async getConversations() {
        return this.request<{ conversations: any[] }>('/conversations');
    }

    async getConversation(id: string) {
        return this.request<{ conversation: any }>(`/conversations/${id}`);
    }

    async createDirectConversation(recipientId: string) {
        return this.request<{ conversation: any }>('/conversations/direct', {
            method: 'POST',
            body: JSON.stringify({ recipientId }),
        });
    }

    async createGroupConversation(data: { name: string; participantIds: string[]; description?: string }) {
        return this.request<{ conversation: any }>('/conversations/group', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async updateGroup(id: string, data: { name?: string; description?: string; avatar?: string }) {
        return this.request<{ conversation: any }>(`/conversations/group/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(data),
        });
    }

    async leaveGroup(id: string) {
        return this.request<{ message: string }>(`/conversations/${id}/leave`, {
            method: 'DELETE',
        });
    }

    // Messages
    async getMessages(conversationId: string, before?: string) {
        const query = before ? `?before=${before}` : '';
        return this.request<{ messages: any[] }>(`/messages/${conversationId}${query}`);
    }

    async sendMessage(conversationId: string, data: { content: string; type?: string; replyTo?: string }) {
        return this.request<{ message: any }>(`/messages/${conversationId}`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async markAsRead(conversationId: string) {
        return this.request<{ message: string }>(`/messages/${conversationId}/read`, {
            method: 'PATCH',
        });
    }

    async editMessage(messageId: string, content: string) {
        return this.request<{ message: any }>(`/messages/${messageId}/edit`, {
            method: 'PATCH',
            body: JSON.stringify({ content }),
        });
    }

    async deleteMessage(messageId: string) {
        return this.request<{ message: string }>(`/messages/${messageId}`, {
            method: 'DELETE',
        });
    }

    async searchMessages(query: string, conversationId?: string) {
        const params = new URLSearchParams({ q: query });
        if (conversationId) params.set('conversationId', conversationId);
        return this.request<{ messages: any[] }>(`/messages/search?${params}`);
    }
}

export const api = new ApiService();
