import React from 'react';
import './Teams.css';

export const Teams: React.FC = () => {
    // Placeholder data - would come from API
    const teams: any[] = [];

    return (
        <div className="teams-page">
            <div className="teams-container">
                <header className="page-header">
                    <h1>Teams</h1>
                    <button className="create-team-btn">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="12" y1="5" x2="12" y2="19" />
                            <line x1="5" y1="12" x2="19" y2="12" />
                        </svg>
                        Create Team
                    </button>
                </header>

                <div className="teams-content">
                    {teams.length > 0 ? (
                        <div className="teams-grid">
                            {/* Team cards would go here */}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                            </svg>
                            <h3>No teams yet</h3>
                            <p>Create a team to start collaborating with others</p>
                            <button className="create-team-btn primary">Create your first team</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
