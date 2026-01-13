import React from 'react';
import './Avatar.css';

interface AvatarProps {
    src?: string;
    name: string;
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    status?: 'online' | 'offline' | 'away' | 'busy';
    showStatus?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
    src,
    name,
    size = 'md',
    status,
    showStatus = false,
}) => {
    const initials = name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);

    const colors = [
        '#7c3aed', '#2563eb', '#0891b2', '#059669',
        '#d97706', '#dc2626', '#db2777', '#9333ea',
    ];

    const colorIndex = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
    const bgColor = colors[colorIndex];

    return (
        <div className={`avatar avatar-${size}`}>
            {src ? (
                <img src={src} alt={name} className="avatar-image" />
            ) : (
                <div className="avatar-initials" style={{ background: bgColor }}>
                    {initials}
                </div>
            )}
            {showStatus && status && (
                <span className={`avatar-status avatar-status-${status}`} />
            )}
        </div>
    );
};
