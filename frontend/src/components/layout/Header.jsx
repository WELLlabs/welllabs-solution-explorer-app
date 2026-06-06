import React from 'react';
import './Header.css';

const Header = ({ user, onLogout }) => {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="logo-section">
          <div className="logo-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="logo-text">Solution Explorer</h1>
            <p className="logo-subtitle">WELL Labs & Citizen Hydrology Hub</p>
          </div>
        </div>
        
        <div className="user-section">
          <div className="user-info">
            <span className="user-greeting">Logged in as:</span>
            <strong className="user-name">{user.name}</strong>
            <div className={`role-badge role-${user.role.toLowerCase().replace(' ', '-')}`}>
              {user.role}
            </div>
          </div>
          <button onClick={onLogout} className="logout-button">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
