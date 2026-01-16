import React, { useEffect, useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Avatar, QuickProfile } from '../ui';
import { Message, User } from '../../types';
import { useAuthStore, useChatStore } from '../../stores';
import { socketService } from '../../services/socket';
import './MessageThread.css';

export const MessageThread: React.FC = () => {
    const { user } = useAuthStore();
    const { activeConversation, messages, isLoadingMessages, summarizeMessages, isSummarizing } = useChatStore();
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
    const [summaryResult, setSummaryResult] = useState<string | null>(null);
    const [activeInfoId, setActiveInfoId] = useState<string | null>(null);
    const [profileUser, setProfileUser] = useState<User | null>(null);
    const [profilePosition, setProfilePosition] = useState({ x: 0, y: 0 });
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

    const scrollToBottom = useCallback(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages, scrollToBottom]);

    const getOtherParticipant = () => {
        if (!activeConversation || activeConversation.type === 'group') return null;
        const currentUserId = user?.id || (user as any)?._id;
        return activeConversation.participants.find((p) => {
            const participantId = p.user.id || (p.user as any)?._id;
            return participantId !== currentUserId;
        })?.user;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setNewMessage(e.target.value);

        if (!isTyping && activeConversation) {
            setIsTyping(true);
            socketService.startTyping(activeConversation._id);
        }

        // Stop typing after 2 seconds of inactivity
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        typingTimeoutRef.current = setTimeout(() => {
            if (activeConversation) {
                setIsTyping(false);
                socketService.stopTyping(activeConversation._id);
            }
        }, 2000);
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        if (!newMessage.trim() || !activeConversation) return;

        socketService.sendMessage({
            conversationId: activeConversation._id,
            content: newMessage.trim(),
        });

        setNewMessage('');
        setIsTyping(false);
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        inputRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const toggleSelectionMode = () => {
        setIsSelectionMode(!isSelectionMode);
        setSelectedMessageIds([]);
        setSummaryResult(null);
    };

    const toggleMessageSelection = (messageId: string) => {
        setSelectedMessageIds(prev =>
            prev.includes(messageId)
                ? prev.filter(id => id !== messageId)
                : [...prev, messageId]
        );
    };

    const handleSummarize = async () => {
        if (selectedMessageIds.length === 0) return;
        const summary = await summarizeMessages(selectedMessageIds);
        setSummaryResult(summary);
    };

    const handleAvatarClick = (clickedUser: User, event: React.MouseEvent) => {
        event.stopPropagation();
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setProfilePosition({ x: rect.left, y: rect.bottom + 8 });
        setProfileUser(clickedUser);
    };

    const renderMessage = (message: Message, index: number) => {
        const currentUserId = user?.id || (user as any)?._id;
        const senderId = message.sender.id || (message.sender as any)?._id;
        const isMine = senderId === currentUserId;

        const prevSenderId = messages[index - 1]?.sender.id || (messages[index - 1]?.sender as any)?._id;
        const nextSenderId = messages[index + 1]?.sender.id || (messages[index + 1]?.sender as any)?._id;

        const showAvatar = index === 0 || prevSenderId !== senderId;
        const showTime = index === messages.length - 1 ||
            nextSenderId !== senderId ||
            new Date(messages[index + 1]?.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000;

        return (
            <div
                key={message._id}
                className={`message ${isMine ? 'message-sent' : 'message-received'} ${showAvatar ? 'has-avatar' : ''
                    }`}
            >
                {isSelectionMode && (
                    <div className="message-checkbox-container">
                        <input
                            type="checkbox"
                            className="message-checkbox"
                            checked={selectedMessageIds.includes(message._id)}
                            onChange={() => toggleMessageSelection(message._id)}
                        />
                    </div>
                )}
                {!isMine && showAvatar && (
                    <div
                        className="message-avatar-clickable"
                        onClick={(e) => handleAvatarClick(message.sender, e)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View ${message.sender.name}'s profile`}
                    >
                        <Avatar name={message.sender.name} src={message.sender.avatar} size="sm" />
                    </div>
                )}
                <div className="message-content">
                    {!isMine && showAvatar && activeConversation?.type === 'group' && (
                        <span className="message-sender">{message.sender.name}</span>
                    )}
                    <div className="message-bubble">
                        {message.isDeleted ? (
                            <span className="message-deleted">This message was deleted</span>
                        ) : (
                            <p>{message.content}</p>
                        )}
                    </div>
                    {showTime && (
                        <div className="message-meta">
                            <span className="message-time">
                                {format(new Date(message.createdAt), 'HH:mm')}
                            </span>
                            {isMine && (
                                <>
                                    <span className={`message-status ${message.readBy.length > 1 ? 'status-seen' : message.deliveredTo.length > 1 ? 'status-delivered' : 'status-sent'}`}>
                                        {message.readBy.length > 1 ? (
                                            // Seen - Eye icon with glow
                                            <div className="status-icon seen">
                                                <svg viewBox="0 0 24 24" fill="none">
                                                    <path d="M12 5C5.636 5 2 12 2 12s3.636 7 10 7 10-7 10-7-3.636-7-10-7Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                                                </svg>
                                            </div>
                                        ) : message.deliveredTo.length > 1 ? (
                                            // Delivered - Double check with animation
                                            <div className="status-icon delivered">
                                                <svg viewBox="0 0 24 24" fill="none">
                                                    <path className="check-1" d="M2 12l5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    <path className="check-2" d="M7 17l10-10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                    <path className="check-3" d="M12 12l5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                                </svg>
                                            </div>
                                        ) : (
                                            // Sent - Single check with pop animation
                                            <div className="status-icon sent">
                                                <svg viewBox="0 0 24 24" fill="none">
                                                    <path d="M5 12l5 5L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </div>
                                        )}
                                    </span>
                                    {/* Info Button */}
                                    <button
                                        className="message-info-btn"
                                        onClick={() => setActiveInfoId(activeInfoId === message._id ? null : message._id)}
                                    >
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <circle cx="12" cy="12" r="10" />
                                            <path d="M12 16v-4M12 8h.01" />
                                        </svg>
                                    </button>
                                    {/* Info Popup */}
                                    {activeInfoId === message._id && (
                                        <div className="message-info-popup">
                                            <div className="info-popup-header">
                                                <span className="info-popup-title">Message Info</span>
                                                <button className="info-popup-close" onClick={() => setActiveInfoId(null)}>
                                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M18 6L6 18M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="info-popup-content">
                                                <div className="info-item sent-info">
                                                    <div className="info-icon">
                                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                            <path d="M22 2L11 13" />
                                                            <path d="M22 2l-7 20-4-9-9-4 20-7z" />
                                                        </svg>
                                                    </div>
                                                    <div className="info-details">
                                                        <span className="info-label">Sent</span>
                                                        <span className="info-time">{format(new Date(message.createdAt), 'MMM d, yyyy • HH:mm:ss')}</span>
                                                    </div>
                                                </div>
                                                {message.deliveredTo.length > 1 && (
                                                    <div className="info-item delivered-info">
                                                        <div className="info-icon">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M2 12l5 5M7 17l10-10M12 12l5-5" />
                                                            </svg>
                                                        </div>
                                                        <div className="info-details">
                                                            <span className="info-label">Delivered</span>
                                                            <span className="info-time">
                                                                {message.deliveredTo[1]?.deliveredAt
                                                                    ? format(new Date(message.deliveredTo[1].deliveredAt), 'MMM d, yyyy • HH:mm:ss')
                                                                    : 'Delivered'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                                {message.readBy.length > 1 && (
                                                    <div className="info-item seen-info">
                                                        <div className="info-icon">
                                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                                                <path d="M12 5C5.636 5 2 12 2 12s3.636 7 10 7 10-7 10-7-3.636-7-10-7Z" />
                                                                <circle cx="12" cy="12" r="3" />
                                                            </svg>
                                                        </div>
                                                        <div className="info-details">
                                                            <span className="info-label">Seen</span>
                                                            <span className="info-time">
                                                                {message.readBy[1]?.readAt
                                                                    ? format(new Date(message.readBy[1].readAt), 'MMM d, yyyy • HH:mm:ss')
                                                                    : 'Seen'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                            {message.isEdited && <span className="message-edited">edited</span>}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (!activeConversation) {
        return (
            <div className="message-thread empty">
                <div className="empty-state">
                    <div className="empty-icon">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                        </svg>
                    </div>
                    <h3>Welcome to AURA</h3>
                    <p>Select a conversation or start a new one</p>
                </div>
            </div>
        );
    }

    const otherUser = getOtherParticipant();

    return (
        <div className="message-thread">
            <div className="thread-header">
                {activeConversation.type === 'direct' && otherUser ? (
                    <div
                        className="thread-header-user"
                        onClick={(e) => handleAvatarClick(otherUser, e)}
                        role="button"
                        tabIndex={0}
                        aria-label={`View ${otherUser.name}'s profile`}
                    >
                        <Avatar
                            name={otherUser.name || 'Unknown'}
                            src={otherUser.avatar}
                            size="md"
                            status={otherUser.status}
                            showStatus={true}
                        />
                        <div className="thread-info">
                            <h3>{otherUser.name || 'Unknown'}</h3>
                            <span className="thread-status">
                                {otherUser.status === 'online' ? 'Online' : 'Offline'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <>
                        <Avatar
                            name={activeConversation.name || 'Group'}
                            src={activeConversation.avatar}
                            size="md"
                        />
                        <div className="thread-info">
                            <h3>{activeConversation.name}</h3>
                            <span className="thread-status">
                                {`${activeConversation.participants.length} members`}
                            </span>
                        </div>
                    </>
                )}
                <div className="thread-actions">
                    <button className="icon-btn" onClick={toggleSelectionMode} title="Select Messages">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                    {isSelectionMode && (
                        <button className="icon-btn" onClick={handleSummarize} disabled={selectedMessageIds.length === 0 || isSummarizing} title="Summarize">
                            {isSummarizing ? (
                                <div className="spinner-sm" />
                            ) : (
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            )}
                        </button>
                    )}
                </div>
            </div>

            <div className="messages-container">
                {isLoadingMessages ? (
                    <div className="loading-messages">
                        <div className="loading-spinner" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="empty-chat-state">
                        <div className="empty-chat-icon">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h4>Start the conversation</h4>
                        <p>Send a message to {otherUser?.name || 'start chatting'}</p>
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => renderMessage(message, index))}



                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {isSelectionMode ? (
                <div className="selection-bar">
                    <span className="selection-count">{selectedMessageIds.length} selected</span>
                    <div className="selection-actions">
                        <button className="btn-secondary" onClick={() => setIsSelectionMode(false)}>Cancel</button>
                        <button className="btn-primary" onClick={handleSummarize} disabled={selectedMessageIds.length === 0 || isSummarizing}>
                            {isSummarizing ? 'Summarizing...' : 'Generate Summary'}
                        </button>
                    </div>
                </div>
            ) : (
                <form className="message-composer" onSubmit={handleSubmit}>
                    <textarea
                        ref={inputRef}
                        value={newMessage}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Type a message..."
                        rows={1}
                    />
                    <button type="submit" disabled={!newMessage.trim()}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
                        </svg>
                    </button>
                </form>
            )}

            {summaryResult && (
                <div className="summary-modal-overlay">
                    <div className="summary-modal">
                        <div className="summary-header">
                            <h3>Conversation Summary</h3>
                            <button className="close-btn" onClick={() => setSummaryResult(null)}>
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M18 6L6 18M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="summary-content">
                            {summaryResult}
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Profile Popup */}
            {profileUser && (
                <QuickProfile
                    user={profileUser}
                    isOpen={!!profileUser}
                    onClose={() => setProfileUser(null)}
                    position={profilePosition}
                />
            )}
        </div>
    );
};
