import React from 'react';
import './Input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, className = '', ...props }, ref) => {
        return (
            <div className={`input-wrapper ${error ? 'input-error' : ''} ${className}`}>
                {label && <label className="input-label">{label}</label>}
                <div className="input-container">
                    {icon && <span className="input-icon">{icon}</span>}
                    <input
                        ref={ref}
                        className={`input-field ${icon ? 'has-icon' : ''}`}
                        {...props}
                    />
                </div>
                {error && <span className="input-error-text">{error}</span>}
            </div>
        );
    }
);

Input.displayName = 'Input';
