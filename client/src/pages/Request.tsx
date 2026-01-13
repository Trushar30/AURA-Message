import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Avatar } from '../components/ui';
import './Request.css';

interface User {
    _id: string;
    name: string;
    email: string;
    username?: string;
    avatar?: string;
    status: 'online' | 'offline' | 'away' | 'busy';
}

interface FriendRequest {
    _id: string;
    sender: User;
    receiver: User;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: string;
}

export const Request: React.FC = () => {
    const [pendingRequests, setPendingRequests] = useState<FriendRequest[]>([]);
    const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingActions, setLoadingActions] = useState<Record<string, boolean>>({});

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        setIsLoading(true);
        try {
            const [pendingRes, sentRes] = await Promise.all([
                api.getPendingRequests(),
                api.getSentRequests()
            ]);
            setPendingRequests(pendingRes.requests);
            setSentRequests(sentRes.requests);
        } catch (error) {
            console.error('Failed to fetch requests:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAccept = async (requestId: string) => {
        setLoadingActions(prev => ({ ...prev, [requestId]: true }));
        try {
            await api.acceptFriendRequest(requestId);
            setPendingRequests(prev => prev.filter(r => r._id !== requestId));
        } catch (error) {
            console.error('Failed to accept request:', error);
        } finally {
            setLoadingActions(prev => ({ ...prev, [requestId]: false }));
        }
    };

    const handleReject = async (requestId: string) => {
        setLoadingActions(prev => ({ ...prev, [requestId]: true }));
        try {
            await api.rejectFriendRequest(requestId);
            setPendingRequests(prev => prev.filter(r => r._id !== requestId));
        } catch (error) {
            console.error('Failed to reject request:', error);
        } finally {
            setLoadingActions(prev => ({ ...prev, [requestId]: false }));
        }
    };

    const handleCancel = async (requestId: string) => {
        setLoadingActions(prev => ({ ...prev, [requestId]: true }));
        try {
            await api.cancelFriendRequest(requestId);
            setSentRequests(prev => prev.filter(r => r._id !== requestId));
        } catch (error) {
            console.error('Failed to cancel request:', error);
        } finally {
            setLoadingActions(prev => ({ ...prev, [requestId]: false }));
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    };

    if (isLoading) {
        return (
            <div className="request-page">
                <div className="request-container">
                    <header className="page-header">
                        <h1>Requests</h1>
                        <p>Manage your connection requests</p>
                    </header>
                    <div className="loading-state">
                        <div className="loading-spinner" />
                        <p>Loading requests...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="request-page">
            <div className="request-container">
                <header className="page-header">
                    <h1>Requests</h1>
                    <p>Manage your connection requests</p>
                </header>

                <section className="requests-section">
                    <h2>
                        Pending Requests
                        {pendingRequests.length > 0 && (
                            <span className="badge">{pendingRequests.length}</span>
                        )}
                    </h2>
                    {pendingRequests.length > 0 ? (
                        <div className="requests-list">
                            {pendingRequests.map((request) => (
                                <div key={request._id} className="request-card">
                                    <Avatar
                                        name={request.sender.name}
                                        src={request.sender.avatar}
                                        size="md"
                                        status={request.sender.status}
                                        showStatus
                                    />
                                    <div className="request-info">
                                        <h3>{request.sender.name}</h3>
                                        {request.sender.username && (
                                            <p className="username">@{request.sender.username}</p>
                                        )}
                                        <p className="time">{formatTime(request.createdAt)}</p>
                                    </div>
                                    <div className="request-actions">
                                        <button
                                            className="accept-btn"
                                            onClick={() => handleAccept(request._id)}
                                            disabled={loadingActions[request._id]}
                                        >
                                            {loadingActions[request._id] ? '...' : 'Accept'}
                                        </button>
                                        <button
                                            className="reject-btn"
                                            onClick={() => handleReject(request._id)}
                                            disabled={loadingActions[request._id]}
                                        >
                                            {loadingActions[request._id] ? '...' : 'Reject'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <line x1="19" y1="8" x2="19" y2="14" />
                                <line x1="22" y1="11" x2="16" y2="11" />
                            </svg>
                            <p>No pending requests</p>
                        </div>
                    )}
                </section>

                <section className="requests-section">
                    <h2>
                        Sent Requests
                        {sentRequests.length > 0 && (
                            <span className="badge secondary">{sentRequests.length}</span>
                        )}
                    </h2>
                    {sentRequests.length > 0 ? (
                        <div className="requests-list">
                            {sentRequests.map((request) => (
                                <div key={request._id} className="request-card sent">
                                    <Avatar
                                        name={request.receiver.name}
                                        src={request.receiver.avatar}
                                        size="md"
                                        status={request.receiver.status}
                                        showStatus
                                    />
                                    <div className="request-info">
                                        <h3>{request.receiver.name}</h3>
                                        {request.receiver.username && (
                                            <p className="username">@{request.receiver.username}</p>
                                        )}
                                        <p className="time">Sent {formatTime(request.createdAt)}</p>
                                    </div>
                                    <div className="request-actions">
                                        <button
                                            className="cancel-btn"
                                            onClick={() => handleCancel(request._id)}
                                            disabled={loadingActions[request._id]}
                                        >
                                            {loadingActions[request._id] ? '...' : 'Cancel'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M22 2 11 13" />
                                <path d="m22 2-7 20-4-9-9-4 20-7z" />
                            </svg>
                            <p>No sent requests</p>
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
};
