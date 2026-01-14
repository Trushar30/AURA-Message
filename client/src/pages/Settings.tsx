import React, { useState, useEffect } from 'react';
import { useThemeStore, colorPresets, fontOptions, defaultPreferences } from '../stores/themeStore';
import './Settings.css';

export const Settings: React.FC = () => {
    const [notifications, setNotifications] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [customColor, setCustomColor] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const { preferences, setPreference, resetToDefaults, saveToServer } = useThemeStore();

    useEffect(() => {
        setCustomColor(preferences.accentColor);
    }, [preferences.accentColor]);

    const handleColorSelect = (color: string) => {
        setPreference('accentColor', color);
        setCustomColor(color);
    };

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const color = e.target.value;
        setCustomColor(color);
        if (/^#[0-9A-Fa-f]{6}$/.test(color)) {
            setPreference('accentColor', color);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveToServer();
        } finally {
            setIsSaving(false);
        }
    };

    const handleReset = () => {
        resetToDefaults();
        setCustomColor(defaultPreferences.accentColor);
    };

    return (
        <div className="settings-page">
            <div className="settings-container">
                <header className="page-header">
                    <h1>Settings</h1>
                    <p>Manage your preferences</p>
                </header>

                <div className="settings-sections">
                    {/* Personalization Section */}
                    <section className="settings-section personalization">
                        <h2>Personalization</h2>

                        {/* Theme Mode */}
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>Theme Mode</h3>
                                <p>Choose your preferred theme</p>
                            </div>
                            <div className="theme-mode-selector">
                                {(['dark', 'light', 'system'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        className={`theme-mode-btn ${preferences.theme === mode ? 'active' : ''}`}
                                        onClick={() => setPreference('theme', mode)}
                                    >
                                        {mode === 'dark' && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                                            </svg>
                                        )}
                                        {mode === 'light' && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <circle cx="12" cy="12" r="5" />
                                                <line x1="12" y1="1" x2="12" y2="3" />
                                                <line x1="12" y1="21" x2="12" y2="23" />
                                                <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                                                <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                                                <line x1="1" y1="12" x2="3" y2="12" />
                                                <line x1="21" y1="12" x2="23" y2="12" />
                                                <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                                                <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                                            </svg>
                                        )}
                                        {mode === 'system' && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                <rect x="2" y="3" width="20" height="14" rx="2" />
                                                <line x1="8" y1="21" x2="16" y2="21" />
                                                <line x1="12" y1="17" x2="12" y2="21" />
                                            </svg>
                                        )}
                                        <span>{mode.charAt(0).toUpperCase() + mode.slice(1)}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Accent Color */}
                        <div className="setting-item column">
                            <div className="setting-info">
                                <h3>Accent Color</h3>
                                <p>Customize the primary accent color</p>
                            </div>
                            <div className="color-palette">
                                {colorPresets.map((preset) => (
                                    <button
                                        key={preset.name}
                                        className={`color-swatch ${preferences.accentColor === preset.color ? 'active' : ''}`}
                                        style={{ '--swatch-color': preset.color } as React.CSSProperties}
                                        onClick={() => handleColorSelect(preset.color)}
                                        title={preset.name}
                                    >
                                        {preferences.accentColor === preset.color && (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                                <div className="custom-color-input">
                                    <input
                                        type="color"
                                        value={customColor}
                                        onChange={handleCustomColorChange}
                                        title="Custom color"
                                    />
                                    <span>Custom</span>
                                </div>
                            </div>
                        </div>

                        {/* Font Family */}
                        <div className="setting-item column">
                            <div className="setting-info">
                                <h3>Font Family</h3>
                                <p>Choose your preferred font</p>
                            </div>
                            <div className="font-selector">
                                {fontOptions.map((font) => (
                                    <button
                                        key={font.id}
                                        className={`font-option ${preferences.fontFamily === font.id ? 'active' : ''}`}
                                        style={{ fontFamily: font.family }}
                                        onClick={() => setPreference('fontFamily', font.id)}
                                    >
                                        <span className="font-preview">Aa</span>
                                        <span className="font-name">{font.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Font Size */}
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>Font Size</h3>
                                <p>Adjust text size for readability</p>
                            </div>
                            <div className="size-selector">
                                {(['small', 'medium', 'large'] as const).map((size) => (
                                    <button
                                        key={size}
                                        className={`size-option ${preferences.fontSize === size ? 'active' : ''}`}
                                        onClick={() => setPreference('fontSize', size)}
                                    >
                                        <span className={`size-preview size-${size}`}>A</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Save/Reset Actions */}
                        <div className="setting-actions">
                            <button
                                className="btn-secondary"
                                onClick={handleReset}
                            >
                                Reset to Defaults
                            </button>
                            <button
                                className="btn-primary"
                                onClick={handleSave}
                                disabled={isSaving}
                            >
                                {isSaving ? 'Saving...' : 'Save Preferences'}
                            </button>
                        </div>
                    </section>

                    <section className="settings-section">
                        <h2>Notifications</h2>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>Push Notifications</h3>
                                <p>Receive notifications for new messages</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={notifications}
                                    onChange={(e) => setNotifications(e.target.checked)}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>Sound Effects</h3>
                                <p>Play sounds for notifications</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={soundEnabled}
                                    onChange={(e) => setSoundEnabled(e.target.checked)}
                                />
                                <span className="toggle-slider" />
                            </label>
                        </div>
                    </section>

                    <section className="settings-section">
                        <h2>Privacy</h2>
                        <div className="setting-item clickable">
                            <div className="setting-info">
                                <h3>Blocked Users</h3>
                                <p>Manage blocked accounts</p>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </div>
                        <div className="setting-item clickable">
                            <div className="setting-info">
                                <h3>Data & Storage</h3>
                                <p>Manage your data</p>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </div>
                    </section>

                    <section className="settings-section danger">
                        <h2>Account</h2>
                        <div className="setting-item clickable danger">
                            <div className="setting-info">
                                <h3>Delete Account</h3>
                                <p>Permanently delete your account and data</p>
                            </div>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="9 18 15 12 9 6" />
                            </svg>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};
