import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const hideSignIn =
    location.pathname === '/home' ||
    location.pathname === '/' ||
    location.pathname === '/casestudy' ||
    location.pathname === '/casestudies';

  const handleLogoutClick = async () => {
    try {
      if (onLogout) {
        await onLogout();
      }
    } catch (err) {
      console.warn('Logout handler error:', err);
    } finally {
      navigate('/home', { replace: true });
    }
  };

  return (
    <header className="dashboard-header">
      <div className="header-content">
        <div className="logo-section cursor-pointer" onClick={() => navigate(user ? '/dashboard' : '/home')} title={user ? "Go to Dashboard" : "Go to Home"}>
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
            <h1 className="logo-text">Climate Solutions</h1>
            <p className="logo-subtitle">WELL Labs & Citizen Hydrology Hub</p>
          </div>
        </div>

        <div className="user-section">
          {user ? (
            <>
              <div className="user-info">
                <span className="user-greeting">Logged in as:</span>
                <strong className="user-name">{user.name}</strong>
                <div className={`role-badge role-${user.role?.toLowerCase().replace(/\s+/g, '-') || ''}`}>
                  {user.role}
                </div>
              </div>
              <button onClick={handleLogoutClick} className="logout-button" title="Sign Out" aria-label="Sign Out">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="logout-text">Sign Out</span>
              </button>
            </>
          ) : !hideSignIn ? (
            <button onClick={() => navigate('/login')} className="header-signin-btn" title="Sign In" aria-label="Sign In">
              <span className="signin-text">Sign In</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;