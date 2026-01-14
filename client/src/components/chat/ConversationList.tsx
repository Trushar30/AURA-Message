import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui';
import { Conversation } from '../../types';
import { useAuthStore, useChatStore } from '../../stores';
import './ConversationList.css';

interface Friend {
    _id: string;
    name: string;
    username: string;
    email: string;
    avatar?: string;
    status?: 'online' | 'offline' | 'away' | 'busy';
}

interface Category {
    _id: string;
    name: string;
    color: string;
    icon: string;
    friends: Friend[];
    order: number;
}

interface ConversationListProps {
    onNewChat: () => void;
    friends?: Friend[];
    searchQuery?: string;
    onSearchChange?: (query: string) => void;
    onStartConversation?: (userId: string) => void;
    categories?: Category[];
    activeCategory?: string | null;
    onCategoryChange?: (categoryId: string | null) => void;
    categoryFriendIds?: Set<string> | null;
}

export const ConversationList: React.FC<ConversationListProps> = ({
    onNewChat,
    friends = [],
    searchQuery = '',
    onSearchChange,
    onStartConversation,
    categories = [],
    activeCategory = null,
    onCategoryChange,
    categoryFriendIds = null,
}) => {
    const { user } = useAuthStore();
    const { conversations, activeConversation, setActiveConversation, fetchMessages } = useChatStore();

    const getConversationName = (conversation: Conversation) => {
        if (conversation.type === 'group') {
            return conversation.name || 'Group';
        }
        const currentUserId = user?.id || (user as any)?._id;
        const otherParticipant = conversation.participants.find(
            (p) => {
                const participantId = p.user.id || (p.user as any)?._id;
                return participantId !== currentUserId;
            }
        );
        return otherParticipant?.user.name || 'Unknown';
    };

    const getConversationAvatar = (conversation: Conversation) => {
        if (conversation.type === 'group') {
            return conversation.avatar;
        }
        const currentUserId = user?.id || (user as any)?._id;
        const otherParticipant = conversation.participants.find(
            (p) => {
                const participantId = p.user.id || (p.user as any)?._id;
                return participantId !== currentUserId;
            }
        );
        return otherParticipant?.user.avatar;
    };

    const getOtherUserStatus = (conversation: Conversation) => {
        if (conversation.type === 'group') return undefined;
        const currentUserId = user?.id || (user as any)?._id;
        const otherParticipant = conversation.participants.find(
            (p) => {
                const participantId = p.user.id || (p.user as any)?._id;
                return participantId !== currentUserId;
            }
        );
        return otherParticipant?.user.status;
    };

    const getOtherUserId = (conversation: Conversation): string | undefined => {
        if (conversation.type === 'group') return undefined;
        const currentUserId = user?.id || (user as any)?._id;
        const otherParticipant = conversation.participants.find(
            (p) => {
                const participantId = p.user.id || (p.user as any)?._id;
                return participantId !== currentUserId;
            }
        );
        // Return the ID (could be 'id' or '_id')
        return otherParticipant?.user.id || (otherParticipant?.user as any)?._id;
    };

    const handleSelect = (conversation: Conversation) => {
        setActiveConversation(conversation);
        fetchMessages(conversation._id);
    };

    // Filter conversations by search query AND category
    const filteredConversations = conversations.filter((conversation) => {
        // First filter by search query
        if (searchQuery.trim()) {
            const name = getConversationName(conversation).toLowerCase();
            if (!name.includes(searchQuery.toLowerCase())) return false;
        }

        // Then filter by category if one is selected
        if (categoryFriendIds !== null && conversation.type === 'direct') {
            const otherUserId = getOtherUserId(conversation);
            if (otherUserId && !categoryFriendIds.has(otherUserId)) return false;
        }

        return true;
    });

    // Get friend IDs that already have conversations
    const friendsWithConversations = new Set(
        conversations
            .filter((c) => c.type === 'direct')
            .map((c) => getOtherUserId(c))
            .filter(Boolean)
    );

    // Filter friends who don't have existing conversations and match search + category
    const friendsWithoutConversations = friends.filter((friend) => {
        const hasConversation = friendsWithConversations.has(friend._id);
        if (hasConversation) return false;

        // Filter by category if one is selected
        if (categoryFriendIds !== null && !categoryFriendIds.has(friend._id)) return false;

        // Filter by search query
        if (!searchQuery.trim()) return true;
        const matchesName = friend.name.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesUsername = friend.username?.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesName || matchesUsername;
    });

    const handleFriendClick = (friendId: string) => {
        if (onStartConversation) {
            onStartConversation(friendId);
        }
    };

    return (
        <div className="conversation-list">
            <div className="conversation-list-header">
                <h2>Messages</h2>
            </div>

            {/* Category Filter Tabs */}
            {categories.length > 0 && (
                <div className="category-filter">
                    <div className="category-tabs">
                        <button
                            className={`category-tab ${activeCategory === null ? 'active' : ''}`}
                            onClick={() => onCategoryChange?.(null)}
                        >
                            All
                        </button>
                        {categories.map((category) => (
                            <button
                                key={category._id}
                                className={`category-tab ${activeCategory === category._id ? 'active' : ''}`}
                                style={{
                                    '--tab-color': category.color,
                                    '--tab-bg': activeCategory === category._id
                                        ? `color-mix(in srgb, ${category.color} 15%, transparent)`
                                        : undefined
                                } as React.CSSProperties}
                                onClick={() => onCategoryChange?.(category._id)}
                            >
                                <span
                                    className="category-dot"
                                    style={{ backgroundColor: category.color }}
                                />
                                {category.name}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Search Bar */}
            <div className="conversation-search">
                <div className="search-input-container">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8" />
                        <path d="m21 21-4.35-4.35" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Search friends & chats..."
                        value={searchQuery}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            className="search-clear"
                            onClick={() => onSearchChange?.('')}
                        >
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>

            <div className="conversation-list-content">
                {filteredConversations.length === 0 && friendsWithoutConversations.length === 0 ? (
                    <div className="no-conversations">
                        <div className="no-conversations-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <p>
                            {searchQuery
                                ? 'No results found'
                                : activeCategory
                                    ? 'No conversations in this category'
                                    : 'No conversations yet'}
                        </p>
                        {!searchQuery && !activeCategory && (
                            <button className="start-chat-btn" onClick={onNewChat}>
                                Start a conversation
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* Active Conversations */}
                        {filteredConversations.map((conversation) => (
                            <div
                                key={conversation._id}
                                className={`conversation-item ${activeConversation?._id === conversation._id ? 'active' : ''
                                    }`}
                                onClick={() => handleSelect(conversation)}
                            >
                                <Avatar
                                    name={getConversationName(conversation)}
                                    src={getConversationAvatar(conversation)}
                                    size="md"
                                    status={getOtherUserStatus(conversation)}
                                    showStatus={conversation.type === 'direct'}
                                />
                                <div className="conversation-info">
                                    <div className="conversation-header">
                                        <span className="conversation-name">
                                            {getConversationName(conversation)}
                                        </span>
                                        {conversation.lastMessage && (
                                            <span className="conversation-time">
                                                {formatDistanceToNow(new Date(conversation.lastMessage.createdAt), {
                                                    addSuffix: false,
                                                })}
                                            </span>
                                        )}
                                    </div>
                                    {conversation.lastMessage && (
                                        <p className="conversation-preview">
                                            {conversation.lastMessage.isDeleted
                                                ? 'Message deleted'
                                                : conversation.lastMessage.content}
                                        </p>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Friends without conversations */}
                        {friendsWithoutConversations.length > 0 && (
                            <>
                                <div className="friends-section-divider">
                                    <span>Friends</span>
                                </div>
                                {friendsWithoutConversations.map((friend) => (
                                    <div
                                        key={friend._id}
                                        className="conversation-item friend-item"
                                        onClick={() => handleFriendClick(friend._id)}
                                    >
                                        <Avatar
                                            name={friend.name}
                                            src={friend.avatar}
                                            size="md"
                                            status={friend.status}
                                            showStatus
                                        />
                                        <div className="conversation-info">
                                            <div className="conversation-header">
                                                <span className="conversation-name">{friend.name}</span>
                                                <span className="start-chat-badge">Start chat</span>
                                            </div>
                                            <p className="conversation-preview friend-username">
                                                @{friend.username}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};
