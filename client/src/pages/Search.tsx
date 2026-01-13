import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Avatar } from '../components/ui';
import './Search.css';

interface User {
    _id: string;
    name: string;
    email: string;
    username?: string;
    avatar?: string;
    status: string;
}

interface FriendshipStatus {
    status: 'none' | 'friends' | 'pending_sent' | 'pending_received';
    requestId?: string;
}

export const Search: React.FC = () => {
    const navigate = useNavigate();
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [friendshipStatuses, setFriendshipStatuses] = useState<Record<string, FriendshipStatus>>({});
    const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) return;

        setIsLoading(true);
        try {
            const response = await api.searchUsers(query);
            setResults(response.users);

            // Fetch friendship status for each user
            const statuses: Record<string, FriendshipStatus> = {};
            await Promise.all(
                response.users.map(async (user) => {
                    try {
                        const status = await api.getFriendshipStatus(user._id);
                        statuses[user._id] = status as FriendshipStatus;
                    } catch {
                        statuses[user._id] = { status: 'none' };
                    }
                })
            );
            setFriendshipStatuses(statuses);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendRequest = async (userId: string) => {
        setLoadingActions(prev => ({ ...prev, [userId]: true }));
        try {
            await api.sendFriendRequest(userId);
            setFriendshipStatuses(prev => ({
                ...prev,
                [userId]: { status: 'pending_sent' }
            }));
        } catch (error) {
            console.error('Failed to send request:', error);
        } finally {
            setLoadingActions(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleCancelRequest = async (userId: string, requestId: string) => {
        setLoadingActions(prev => ({ ...prev, [userId]: true }));
        try {
            await api.cancelFriendRequest(requestId);
            setFriendshipStatuses(prev => ({
                ...prev,
                [userId]: { status: 'none' }
            }));
        } catch (error) {
            console.error('Failed to cancel request:', error);
        } finally {
            setLoadingActions(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleAcceptRequest = async (userId: string, requestId: string) => {
        setLoadingActions(prev => ({ ...prev, [userId]: true }));
        try {
            await api.acceptFriendRequest(requestId);
            setFriendshipStatuses(prev => ({
                ...prev,
                [userId]: { status: 'friends' }
            }));
        } catch (error) {
            console.error('Failed to accept request:', error);
        } finally {
            setLoadingActions(prev => ({ ...prev, [userId]: false }));
        }
    };

    const handleMessage = (_userId: string) => {
        // Navigate to chat with this user
        navigate('/app/home');
        // The chat will be initiated when the user clicks on the Message button
    };

    const getActionButton = (user: User) => {
        const status = friendshipStatuses[user._id];
        const isLoading = loadingActions[user._id];

        if (isLoading) {
            return <button className="action-btn loading" disabled>...</button>;
        }

        if (!status || status.status === 'none') {
            return (
                <button
                    className="action-btn add-friend"
                    onClick={() => handleSendRequest(user._id)}
                >
                    Add Friend
                </button>
            );
        }

        if (status.status === 'pending_sent') {
            return (
                <button
                    className="action-btn pending"
                    onClick={() => handleCancelRequest(user._id, status.requestId!)}
                >
                    Pending
                </button>
            );
        }

        if (status.status === 'pending_received') {
            return (
                <button
                    className="action-btn accept"
                    onClick={() => handleAcceptRequest(user._id, status.requestId!)}
                >
                    Accept
                </button>
            );
        }

        if (status.status === 'friends') {
            return (
                <button
                    className="action-btn message"
                    onClick={() => handleMessage(user._id)}
                >
                    Message
                </button>
            );
        }

        return null;
    };

    return (
        <div className="search-page">
            <div className="search-container">
                <header className="search-header">
                    <h1>Search</h1>
                    <p>Find users by username</p>
                </header>

                <form className="search-form" onSubmit={handleSearch}>
                    <div className="search-input-group">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" />
                            <path d="m21 21-4.35-4.35" />
                        </svg>
                        <input
                            type="text"
                            placeholder="Search by @username..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                        <button type="submit" disabled={isLoading}>
                            {isLoading ? 'Searching...' : 'Search'}
                        </button>
                    </div>
                </form>

                <div className="search-results-section">
                    {results.length > 0 ? (
                        <div className="results-grid">
                            {results.map((user) => (
                                <div key={user._id} className="user-card">
                                    <Avatar
                                        name={user.name}
                                        src={user.avatar}
                                        size="lg"
                                        status={user.status as 'online' | 'offline' | 'away' | 'busy' | undefined}
                                        showStatus
                                    />
                                    <div className="user-card-info">
                                        <h3>{user.name}</h3>
                                        {user.username && (
                                            <p className="username">@{user.username}</p>
                                        )}
                                    </div>
                                    {getActionButton(user)}
                                </div>
                            ))}
                        </div>
                    ) : query && !isLoading ? (
                        <div className="no-results">
                            <p>No users found for "{query}"</p>
                        </div>
                    ) : (
                        <div className="search-placeholder">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <circle cx="11" cy="11" r="8" />
                                <path d="m21 21-4.35-4.35" />
                            </svg>
                            <p>Search for users by their @username</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
