import React, { useEffect, useState, useRef } from 'react';
import { Avatar } from './Avatar';
import { User } from '../../types';
import { api } from '../../services/api';
import { useAuthStore, useChatStore } from '../../stores';
import './QuickProfile.css';

interface QuickProfileProps {
    user: User;
    isOpen: boolean;
    onClose: () => void;
    position?: { x: number; y: number };
    anchorRef?: React.RefObject<HTMLElement>;
}

interface FriendshipStatus {
    status: 'none' | 'pending_sent' | 'pending_received' | 'friends';
    requestId?: string;
}

interface ProfileData {
    id: string;
    name: string;
    username?: string;
    avatar?: string;
    bio?: string;
    status: string;
    lastSeen: string;
    createdAt: string;
    mutualFriendsCount: number;
}

export const QuickProfile: React.FC<QuickProfileProps> = ({
    user,
    isOpen,
    onClose,
    position,
    anchorRef,
}) => {
    const { user: currentUser } = useAuthStore();
    const { setActiveConversation, conversations, fetchConversations } = useChatStore();
    const [friendshipStatus, setFriendshipStatus] = useState<FriendshipStatus>({ status: 'none' });
    const [profileData, setProfileData] = useState<ProfileData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);
    const [cardPosition, setCardPosition] = useState({ top: 0, left: 0 });
    const [isVisible, setIsVisible] = useState(false);

    // Get user ID safely
    const userId = user.id || (user as any)?._id;
    const currentUserId = currentUser?.id || (currentUser as any)?._id;
    const isSelf = userId === currentUserId;

    // Calculate card position
    useEffect(() => {
        if (isOpen && anchorRef?.current) {
            const rect = anchorRef.current.getBoundingClientRect();
            const cardWidth = 320;
            const cardHeight = 400;

            let top = rect.bottom + 8;
            let left = rect.left;

            // Adjust if going off screen
            if (left + cardWidth > window.innerWidth) {
                left = window.innerWidth - cardWidth - 16;
            }
            if (top + cardHeight > window.innerHeight) {
                top = rect.top - cardHeight - 8;
            }

            setCardPosition({ top, left });
        } else if (position) {
            setCardPosition({ top: position.y, left: position.x });
        }
    }, [isOpen, position, anchorRef]);

    // Animate in
    useEffect(() => {
        if (isOpen) {
            const timer = setTimeout(() => setIsVisible(true), 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    // Fetch profile data and friendship status
    useEffect(() => {
        const fetchData = async () => {
            if (!isOpen || !userId) return;

            setIsLoading(true);
            try {
                // Fetch profile data
                const profileResponse = await api.getUserProfile(userId);
                setProfileData(profileResponse.user);

                // Fetch friendship status if not self
                if (!isSelf) {
                    const statusResponse = await api.getFriendshipStatus(userId);
                    setFriendshipStatus(statusResponse as FriendshipStatus);
                }
            } catch (error) {
                console.error('Failed to fetch profile data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [isOpen, userId, isSelf]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (cardRef.current && !cardRef.current.contains(e.target as Node)) {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [isOpen, onClose]);

    // Close on escape
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            return () => document.removeEventListener('keydown', handleEscape);
        }
    }, [isOpen, onClose]);

    const handleSendRequest = async () => {
        setActionLoading(true);
        try {
            const response = await api.sendFriendRequest(userId);
            setFriendshipStatus({ status: 'pending_sent', requestId: response.request?._id });
        } catch (error) {
            console.error('Failed to send friend request:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancelRequest = async () => {
        if (!friendshipStatus.requestId) return;
        setActionLoading(true);
        try {
            await api.cancelFriendRequest(friendshipStatus.requestId);
            setFriendshipStatus({ status: 'none' });
        } catch (error) {
            console.error('Failed to cancel request:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleAcceptRequest = async () => {
        if (!friendshipStatus.requestId) return;
        setActionLoading(true);
        try {
            await api.acceptFriendRequest(friendshipStatus.requestId);
            setFriendshipStatus({ status: 'friends' });
        } catch (error) {
            console.error('Failed to accept request:', error);
        } finally {
            setActionLoading(false);
        }
    };

    const handleMessage = async () => {
        try {
            // Check if conversation already exists
            const existingConversation = conversations.find(
                (c) => c.type === 'direct' && c.participants.some(
                    (p) => (p.user.id || (p.user as any)?._id) === userId
                )
            );

            if (existingConversation) {
                setActiveConversation(existingConversation);
            } else {
                const response = await api.createDirectConversation(userId);
                await fetchConversations();
                setActiveConversation(response.conversation);
            }
            onClose();
        } catch (error) {
            console.error('Failed to start conversation:', error);
        }
    };

    // Generate a unique "vibe" based on username/name
    const getVibeEmoji = () => {
        const vibes = ['🌟', '✨', '🔥', '💫', '🌈', '🦋', '🌸', '🎭', '🎨', '🎵', '⚡', '🌙', '☀️', '🌊', '🍀'];
        const name = profileData?.name || user.name || user.username || '';
        const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        return vibes[hash % vibes.length];
    };

    // Get status text with emoji
    const getStatusInfo = () => {
        const status = profileData?.status || user.status;
        switch (status) {
            case 'online':
                return { text: 'Online', emoji: '🟢', class: 'status-online' };
            case 'away':
                return { text: 'Away', emoji: '🌙', class: 'status-away' };
            case 'busy':
                return { text: 'Do not disturb', emoji: '🔴', class: 'status-busy' };
            default:
                return { text: 'Offline', emoji: '⚫', class: 'status-offline' };
        }
    };

    // Get time since last seen
    const getLastSeenText = () => {
        const status = profileData?.status || user.status;
        if (status === 'online') return 'Active now';

        const lastSeen = profileData?.lastSeen || user.lastSeen;
        if (!lastSeen) return 'Last seen recently';

        const lastSeenDate = new Date(lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - lastSeenDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return lastSeenDate.toLocaleDateString();
    };

    // Get member since text
    const getMemberSince = () => {
        const createdAt = profileData?.createdAt;
        if (!createdAt) return 'Recently';

        const date = new Date(createdAt);
        const options: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    };

    if (!isOpen) return null;

    const statusInfo = getStatusInfo();
    const displayName = profileData?.name || user.name;
    const displayUsername = profileData?.username || user.username;
    const displayBio = profileData?.bio || user.bio;
    const displayAvatar = profileData?.avatar || user.avatar;
    const displayStatus = (profileData?.status || user.status) as 'online' | 'offline' | 'away' | 'busy';

    return (
        <div className="quick-profile-overlay">
            <div
                ref={cardRef}
                className={`quick-profile-card ${isVisible ? 'visible' : ''}`}
                style={{ top: cardPosition.top, left: cardPosition.left }}
            >
                {/* Header with gradient background */}
                <div className="qp-header">
                    <div className="qp-header-bg" />
                    <button className="qp-close-btn" onClick={onClose}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                    <div className="qp-avatar-container">
                        <Avatar
                            name={displayName}
                            src={displayAvatar}
                            size="xl"
                            status={displayStatus}
                            showStatus={true}
                        />
                        <span className="qp-vibe-badge">{getVibeEmoji()}</span>
                    </div>
                </div>

                {/* User Info */}
                <div className="qp-info">
                    <h3 className="qp-name">{displayName}</h3>
                    {displayUsername && (
                        <span className="qp-username">@{displayUsername}</span>
                    )}

                    {/* Status Pill */}
                    <div className={`qp-status-pill ${statusInfo.class}`}>
                        {displayStatus === 'online' && <span className="status-pulse" />}
                        <span className="status-emoji">{statusInfo.emoji}</span>
                        <span className="status-text">{statusInfo.text}</span>
                        <span className="status-separator">•</span>
                        <span className="last-seen">{getLastSeenText()}</span>
                    </div>

                    {/* Bio */}
                    {displayBio && (
                        <p className="qp-bio">{displayBio}</p>
                    )}
                </div>

                {/* Quick Stats */}
                <div className="qp-stats">
                    <div className="qp-stat">
                        <div className="qp-stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                                <line x1="16" y1="2" x2="16" y2="6" />
                                <line x1="8" y1="2" x2="8" y2="6" />
                                <line x1="3" y1="10" x2="21" y2="10" />
                            </svg>
                        </div>
                        <span className="qp-stat-label">Member since</span>
                        <span className="qp-stat-value">{getMemberSince()}</span>
                    </div>
                    <div className="qp-stat-divider" />
                    <div className="qp-stat">
                        <div className="qp-stat-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                        </div>
                        <span className="qp-stat-label">Mutual friends</span>
                        <span className="qp-stat-value">{profileData?.mutualFriendsCount ?? 0}</span>
                    </div>
                </div>

                {/* Actions */}
                {!isSelf && (
                    <div className="qp-actions">
                        {isLoading ? (
                            <div className="qp-loading">
                                <div className="spinner-sm" />
                            </div>
                        ) : (
                            <>
                                {friendshipStatus.status === 'none' && (
                                    <button
                                        className="qp-btn qp-btn-primary"
                                        onClick={handleSendRequest}
                                        disabled={actionLoading}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                            <circle cx="8.5" cy="7" r="4" />
                                            <line x1="20" y1="8" x2="20" y2="14" />
                                            <line x1="23" y1="11" x2="17" y2="11" />
                                        </svg>
                                        {actionLoading ? 'Sending...' : 'Add Friend'}
                                    </button>
                                )}

                                {friendshipStatus.status === 'pending_sent' && (
                                    <button
                                        className="qp-btn qp-btn-secondary"
                                        onClick={handleCancelRequest}
                                        disabled={actionLoading}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <line x1="15" y1="9" x2="9" y2="15" />
                                            <line x1="9" y1="9" x2="15" y2="15" />
                                        </svg>
                                        {actionLoading ? 'Cancelling...' : 'Cancel Request'}
                                    </button>
                                )}

                                {friendshipStatus.status === 'pending_received' && (
                                    <button
                                        className="qp-btn qp-btn-primary"
                                        onClick={handleAcceptRequest}
                                        disabled={actionLoading}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        {actionLoading ? 'Accepting...' : 'Accept Request'}
                                    </button>
                                )}

                                {friendshipStatus.status === 'friends' && (
                                    <button
                                        className="qp-btn qp-btn-primary"
                                        onClick={handleMessage}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                        </svg>
                                        Send Message
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* Self Profile View */}
                {isSelf && (
                    <div className="qp-self-badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                            <circle cx="12" cy="7" r="4" />
                        </svg>
                        <span>This is you!</span>
                    </div>
                )}

                {/* Decorative Elements */}
                <div className="qp-decoration">
                    <div className="qp-orb qp-orb-1" />
                    <div className="qp-orb qp-orb-2" />
                </div>
            </div>
        </div>
    );
};
