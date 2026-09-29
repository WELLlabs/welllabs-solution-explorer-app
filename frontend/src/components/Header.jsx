import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const logoClass =
  'h-6 min-[380px]:h-7 sm:h-9 md:h-10 lg:h-12 w-auto max-w-[44px] min-[380px]:max-w-[56px] sm:max-w-[90px] md:max-w-[120px] lg:max-w-[150px] object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-transform duration-200 hover:scale-[1.03]';

const pillButtonClass =
  'flex items-center justify-center gap-1.5 bg-ocean-deep border border-ocean-deep rounded-full font-bold text-white cursor-pointer transition-all duration-200 shrink-0 shadow-[0_2px_6px_rgba(54,105,169,0.18)] hover:bg-turf-green hover:border-turf-green hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(52,119,69,0.2)]';

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
    <header className="sticky top-0 z-[1000] w-full bg-white border-b border-border-light shadow-[0_1px_4px_rgba(31,42,36,0.05)]">
      <div className="w-full box-border flex items-center justify-between gap-1.5 min-[380px]:gap-2 sm:gap-4 px-2.5 min-[380px]:px-3 sm:px-5 lg:px-7 py-2 sm:py-3 lg:py-4 min-h-14 sm:min-h-16 lg:min-h-20">
        {/* Left: logos + app name */}
        <div
          className="flex items-center gap-2 sm:gap-3 lg:gap-4 min-w-0 cursor-pointer"
          onClick={() => navigate(user ? '/dashboard' : '/home')}
          title={user ? 'Go to Dashboard' : 'Go to Home'}
        >
          <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3.5 shrink-0 bg-[#F4F6F2] px-1.5 sm:px-2.5 py-1 sm:py-[5px] rounded-lg sm:rounded-[10px] border border-[#C8D7BC]">
            <img
              src="/images/logo/govt-karnataka-logo.png"
              alt="Government of Karnataka Logo"
              className={logoClass}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="w-px sm:w-[1.5px] h-5 sm:h-7 lg:h-[34px] bg-[#A99E8A] rounded-[1px] shrink-0" />
            <img
              src="/images/logo/GBA-logo.png"
              alt="GBA Logo"
              className={logoClass}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <h1 className="m-0 text-[14px] min-[380px]:text-[15px] sm:text-lg lg:text-[21px] font-bold text-ink leading-tight tracking-[-0.3px] lg:tracking-[-0.4px] truncate">
              Climate Solutions
            </h1>
            <p className="m-0 mt-0.5 text-[10.5px] sm:text-[11.5px] lg:text-[12.5px] font-medium text-ink-muted leading-tight truncate">
              WELL Labs & Citizen Hydrology Hub
            </p>
          </div>
        </div>

        {/* Right: user details + actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {user ? (
            <>
              <div className="flex items-center gap-2 bg-[#F4F6F2] p-1 md:pl-4 md:pr-1.5 md:py-1.5 rounded-full border border-[#C8D7BC]">
                <span className="hidden xl:inline text-[13px] text-ink-muted whitespace-nowrap">Logged in as:</span>
                <strong className="hidden md:inline text-[13px] lg:text-sm font-semibold text-ink max-w-[110px] lg:max-w-[170px] truncate">
                  {user.name}
                </strong>
                <span className="px-2 sm:px-3 py-[3px] sm:py-1 rounded-full text-[10.5px] sm:text-[11.5px] font-semibold tracking-[0.2px] whitespace-nowrap bg-turf-green/12 text-turf-green border border-turf-green/25">
                  {user.role}
                </span>
              </div>
              <button
                onClick={handleLogoutClick}
                className={`${pillButtonClass} w-9 h-9 sm:w-auto sm:h-auto sm:px-4 sm:py-2 text-[12.5px] lg:text-[13px]`}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </>
          ) : !hideSignIn ? (
            <button
              onClick={() => navigate('/login')}
              className={`${pillButtonClass} px-4 sm:px-[18px] py-2 text-[12.5px] sm:text-[13px]`}
              title="Sign In"
              aria-label="Sign In"
            >
              <span>Sign In</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;
