import React, { useState } from 'react';
import './Settings.css';

export const Settings: React.FC = () => {
    const [notifications, setNotifications] = useState(true);
    const [darkMode, setDarkMode] = useState(true);
    const [soundEnabled, setSoundEnabled] = useState(true);

    return (
        <div className="settings-page">
            <div className="settings-container">
                <header className="page-header">
                    <h1>Settings</h1>
                    <p>Manage your preferences</p>
                </header>

                <div className="settings-sections">
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
                        <h2>Appearance</h2>
                        <div className="setting-item">
                            <div className="setting-info">
                                <h3>Dark Mode</h3>
                                <p>Use dark theme</p>
                            </div>
                            <label className="toggle">
                                <input
                                    type="checkbox"
                                    checked={darkMode}
                                    onChange={(e) => setDarkMode(e.target.checked)}
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
