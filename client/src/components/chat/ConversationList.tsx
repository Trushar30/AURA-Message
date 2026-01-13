import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Avatar } from '../ui';
import { Conversation } from '../../types';
import { useAuthStore, useChatStore } from '../../stores';
import './ConversationList.css';

interface ConversationListProps {
    onNewChat: () => void;
}

export const ConversationList: React.FC<ConversationListProps> = ({ onNewChat }) => {
    const { user } = useAuthStore();
    const { conversations, activeConversation, setActiveConversation, fetchMessages } = useChatStore();

    const getConversationName = (conversation: Conversation) => {
        if (conversation.type === 'group') {
            return conversation.name || 'Group';
        }
        const otherParticipant = conversation.participants.find(
            (p) => p.user.id !== user?.id
        );
        return otherParticipant?.user.name || 'Unknown';
    };

    const getConversationAvatar = (conversation: Conversation) => {
        if (conversation.type === 'group') {
            return conversation.avatar;
        }
        const otherParticipant = conversation.participants.find(
            (p) => p.user.id !== user?.id
        );
        return otherParticipant?.user.avatar;
    };

    const getOtherUserStatus = (conversation: Conversation) => {
        if (conversation.type === 'group') return undefined;
        const otherParticipant = conversation.participants.find(
            (p) => p.user.id !== user?.id
        );
        return otherParticipant?.user.status;
    };

    const handleSelect = (conversation: Conversation) => {
        setActiveConversation(conversation);
        fetchMessages(conversation._id);
    };

    return (
        <div className="conversation-list">
            <div className="conversation-list-header">
                <h2>Messages</h2>
                <button className="new-chat-btn" onClick={onNewChat}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 5v14M5 12h14" />
                    </svg>
                </button>
            </div>

            <div className="conversation-list-content">
                {conversations.length === 0 ? (
                    <div className="no-conversations">
                        <div className="no-conversations-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                            </svg>
                        </div>
                        <p>No conversations yet</p>
                        <button className="start-chat-btn" onClick={onNewChat}>
                            Start a conversation
                        </button>
                    </div>
                ) : (
                    conversations.map((conversation) => (
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
                    ))
                )}
            </div>
        </div>
    );
};
