import React from 'react';
import './Header.css';

const Header = ({ user, onLogout }) => {
  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="logo-section">
          <div className="header-logos-container">
            <img
              src="/images/logo/govt-karnataka-logo.png"
              alt="Government of Karnataka Logo"
              className="header-brand-logo"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="logo-separator" />
            <img
              src="/images/logo/GBA-logo.png"
              alt="GBA Logo"
              className="header-brand-logo"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          <div className="logo-text-container">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="logo-text">Climate Solutions</h1>
            </div>
            <p className="logo-subtitle">WELL Labs & Citizen Hydrology Hub</p>
          </div>
        </div>

        <div className="user-section">
          {user && (
            <>
              <div className="user-info">
                <span className="user-greeting">Logged in as:</span>
                <strong className="user-name">{user.name}</strong>
                <div className={`role-badge role-${user.role?.toLowerCase().replace(' ', '-') || ''}`}>
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
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

