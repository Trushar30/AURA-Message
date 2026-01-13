import React, { useEffect, useRef, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Avatar } from '../ui';
import { Message } from '../../types';
import { useAuthStore, useChatStore } from '../../stores';
import { socketService } from '../../services/socket';
import './MessageThread.css';

export const MessageThread: React.FC = () => {
    const { user } = useAuthStore();
    const { activeConversation, messages, typingUsers, isLoadingMessages } = useChatStore();
    const [newMessage, setNewMessage] = useState('');
    const [isTyping, setIsTyping] = useState(false);
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
        return activeConversation.participants.find((p) => p.user.id !== user?.id)?.user;
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

    const renderMessage = (message: Message, index: number) => {
        const isMine = message.sender.id === user?.id;
        const showAvatar = index === 0 || messages[index - 1]?.sender.id !== message.sender.id;
        const showTime = index === messages.length - 1 ||
            messages[index + 1]?.sender.id !== message.sender.id ||
            new Date(messages[index + 1]?.createdAt).getTime() - new Date(message.createdAt).getTime() > 300000;

        return (
            <div
                key={message._id}
                className={`message ${isMine ? 'message-sent' : 'message-received'} ${showAvatar ? 'has-avatar' : ''
                    }`}
            >
                {!isMine && showAvatar && (
                    <Avatar name={message.sender.name} src={message.sender.avatar} size="sm" />
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
                                <span className="message-status">
                                    {message.readBy.length > 1 ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="read">
                                            <path d="M18 7l-8.156 8.156M2 12l5.156 5.156M7 12l5.156 5.156" />
                                        </svg>
                                    ) : message.deliveredTo.length > 1 ? (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M18 7l-8.156 8.156M2 12l5.156 5.156M7 12l5.156 5.156" />
                                        </svg>
                                    ) : (
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M5 12l5 5L20 7" />
                                        </svg>
                                    )}
                                </span>
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
    const conversationTypers = typingUsers.filter(
        (t) => t.conversationId === activeConversation._id
    );

    return (
        <div className="message-thread">
            <div className="thread-header">
                <Avatar
                    name={
                        activeConversation.type === 'group'
                            ? activeConversation.name || 'Group'
                            : otherUser?.name || 'Unknown'
                    }
                    src={
                        activeConversation.type === 'group'
                            ? activeConversation.avatar
                            : otherUser?.avatar
                    }
                    size="md"
                    status={otherUser?.status}
                    showStatus={activeConversation.type === 'direct'}
                />
                <div className="thread-info">
                    <h3>
                        {activeConversation.type === 'group'
                            ? activeConversation.name
                            : otherUser?.name || 'Unknown'}
                    </h3>
                    <span className="thread-status">
                        {conversationTypers.length > 0 ? (
                            <span className="typing-text">
                                {conversationTypers.map((t) => t.userName).join(', ')} typing...
                            </span>
                        ) : activeConversation.type === 'group' ? (
                            `${activeConversation.participants.length} members`
                        ) : otherUser?.status === 'online' ? (
                            'Online'
                        ) : (
                            'Offline'
                        )}
                    </span>
                </div>
            </div>

            <div className="messages-container">
                {isLoadingMessages ? (
                    <div className="loading-messages">
                        <div className="loading-spinner" />
                    </div>
                ) : (
                    <>
                        {messages.map((message, index) => renderMessage(message, index))}

                        {conversationTypers.length > 0 && (
                            <div className="typing-indicator">
                                <div className="typing-dots">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

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
        </div>
    );
};
