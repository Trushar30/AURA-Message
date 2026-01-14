import React, { useEffect, useState } from 'react';
import { ConversationList, MessageThread } from '../components/chat';
import { useChatStore, useAuthStore } from '../stores';
import { socketService } from '../services/socket';
import { api } from '../services/api';
import './Home.css';

interface Friend {
    _id: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
}

export const Home: React.FC = () => {
    const { } = useAuthStore();
    const { fetchConversations, addMessage, addTypingUser, removeTypingUser } = useChatStore();
    const [showNewChat, setShowNewChat] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [friends, setFriends] = useState<Friend[]>([]);

    useEffect(() => {
        fetchConversations();
        fetchFriends();

        const unsubMessage = socketService.onMessage((data) => {
            addMessage(data.message);
        });

        const unsubTypingStart = socketService.onTypingStart((data) => {
            addTypingUser(data);
        });

        const unsubTypingStop = socketService.onTypingStop((data) => {
            removeTypingUser(data.userId, data.conversationId);
        });

        const unsubOffline = socketService.onUserOffline((data) => {
            const { typingUsers } = useChatStore.getState();
            typingUsers.forEach((t) => {
                if (t.userId === data.userId) {
                    removeTypingUser(data.userId, t.conversationId);
                }
            });
        });

        return () => {
            unsubMessage();
            unsubTypingStart();
            unsubTypingStop();
            unsubOffline();
        };
    }, [fetchConversations, addMessage, addTypingUser, removeTypingUser]);

    const fetchFriends = async () => {
        try {
            const response = await api.getFriends();
            setFriends(response.friends);
        } catch (error) {
            console.error('Failed to fetch friends:', error);
        }
    };

    const handleStartConversation = async (userId: string) => {
        const { createDirectConversation, setActiveConversation, fetchMessages, fetchConversations: refreshConversations } = useChatStore.getState();

        try {
            const conversation = await createDirectConversation(userId);
            setActiveConversation(conversation);
            await fetchMessages(conversation._id);
            await refreshConversations(); // Refresh conversations list
            setSearchQuery('');
        } catch (error) {
            console.error('Failed to create conversation:', error);
        }
    };

    return (
        <div className="home-page">
            <aside className="conversations-sidebar">
                <ConversationList
                    onNewChat={() => setShowNewChat(true)}
                    friends={friends}
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onStartConversation={handleStartConversation}
                />
            </aside>

            <main className="message-area">
                <MessageThread />
            </main>

            {/* New Chat Modal - for searching all users */}
            {showNewChat && (
                <NewChatModal
                    onClose={() => setShowNewChat(false)}
                    onStartConversation={(userId) => {
                        handleStartConversation(userId);
                        setShowNewChat(false);
                    }}
                />
            )}
        </div>
    );
};

// Separate modal component for new chat
interface NewChatModalProps {
    onClose: () => void;
    onStartConversation: (userId: string) => void;
}

const NewChatModal: React.FC<NewChatModalProps> = ({ onClose, onStartConversation }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    const handleSearch = async (query: string) => {
        setSearchQuery(query);

        if (!query.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await api.searchUsers(query);
            setSearchResults(response.users);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>New Conversation</h3>
                    <button className="modal-close" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="modal-content">
                    <div className="search-input-wrapper">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search users by name or email..."
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            autoFocus
                        />
                    </div>

                    <div className="search-results">
                        {isSearching ? (
                            <div className="search-loading">
                                <div className="loading-spinner" />
                            </div>
                        ) : searchResults.length > 0 ? (
                            searchResults.map((result) => (
                                <button
                                    key={result._id}
                                    className="search-result-item"
                                    onClick={() => onStartConversation(result._id)}
                                >
                                    <div className="result-avatar">
                                        {result.avatar ? (
                                            <img src={result.avatar} alt={result.name} />
                                        ) : (
                                            <div className="avatar-placeholder">
                                                {result.name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                    </div>
                                    <div className="result-info">
                                        <span className="result-name">{result.name}</span>
                                        <span className="result-email">{result.email}</span>
                                    </div>
                                </button>
                            ))
                        ) : searchQuery ? (
                            <div className="no-results">
                                <p>No users found</p>
                            </div>
                        ) : (
                            <div className="search-hint">
                                <p>Search for users to start a conversation</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
