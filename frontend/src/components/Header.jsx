import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const logoClass =
  'h-12 max-w-[150px] w-auto object-contain drop-shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-transform duration-200 hover:scale-[1.03] max-lg:h-11 max-lg:max-w-[130px] max-md:h-[38px] max-md:max-w-[100px] max-[540px]:h-8 max-[540px]:max-w-[75px] max-[380px]:h-7 max-[380px]:max-w-[60px]';

const pillButtonClass =
  'flex items-center gap-1.5 px-[18px] py-2 bg-ocean-deep border border-ocean-deep rounded-[40px] text-[13px] font-bold text-white cursor-pointer transition-all duration-200 shrink-0 shadow-[0_2px_6px_rgba(54,105,169,0.18)] hover:bg-turf-green hover:border-turf-green hover:-translate-y-px hover:shadow-[0_4px_10px_rgba(52,119,69,0.2)]';

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
      <div className="w-full box-border flex justify-between items-center gap-5 px-7 py-4 min-h-20 max-lg:px-[22px] max-lg:py-3.5 max-lg:min-h-[72px] max-md:px-[18px] max-md:py-3 max-md:min-h-16 max-md:gap-3 max-[540px]:px-3.5 max-[540px]:py-2.5 max-[540px]:min-h-14 max-[540px]:gap-2.5 max-[380px]:px-2.5 max-[380px]:py-2 max-[380px]:min-h-[50px] max-[380px]:gap-2">
        <div
          className="flex items-center gap-4 min-w-0 shrink cursor-pointer max-md:gap-3 max-[540px]:gap-2.5"
          onClick={() => navigate(user ? '/dashboard' : '/home')}
          title={user ? "Go to Dashboard" : "Go to Home"}
        >
          <div className="flex items-center gap-3.5 shrink-0 bg-[#F4F6F2] px-2.5 py-[5px] rounded-[10px] border border-[#C8D7BC] max-md:gap-2.5 max-[540px]:gap-2">
            <img
              src="/images/logo/govt-karnataka-logo.png"
              alt="Government of Karnataka Logo"
              className={logoClass}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
            <div className="w-[1.5px] h-[34px] bg-[#A99E8A] rounded-[1px] shrink-0 max-lg:h-[30px] max-md:h-[26px] max-[540px]:h-[22px] max-[380px]:hidden" />
            <img
              src="/images/logo/GBA-logo.png"
              alt="GBA Logo"
              className={logoClass}
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          </div>

          <div className="flex flex-col justify-center min-w-0">
            <h1 className="m-0 text-[21px] font-bold text-ink leading-[1.2] tracking-[-0.4px] whitespace-nowrap max-lg:text-[19px] max-md:text-base max-md:tracking-[-0.3px] max-[540px]:text-[15px] max-[380px]:text-[13.5px]">
              Climate Solutions
            </h1>
            <p className="mt-[3px] text-[12.5px] font-medium text-ink-muted leading-[1.2] whitespace-nowrap max-lg:text-[11.5px] max-md:text-[11px] max-md:max-w-[200px] max-md:overflow-hidden max-md:text-ellipsis max-[540px]:text-[10px] max-[540px]:max-w-[150px] max-[380px]:hidden">
              WELL Labs & Citizen Hydrology Hub
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3.5 shrink-0 max-md:gap-2.5">
          {user ? (
            <>
              <div className="flex items-center gap-2.5 bg-[#F4F6F2] px-4 py-2 rounded-[40px] border border-[#C8D7BC] max-md:px-3 max-md:py-1.5 max-md:gap-1.5 max-[540px]:px-2.5 max-[540px]:py-1 max-[540px]:rounded-[20px]">
                <span className="text-[13.5px] text-ink-muted max-lg:hidden">Logged in as:</span>
                <strong className="text-sm font-semibold text-ink max-w-[170px] overflow-hidden text-ellipsis whitespace-nowrap max-md:text-[13px] max-md:max-w-[120px] max-[540px]:hidden">
                  {user.name}
                </strong>
                <div className="px-3 py-1 rounded-[20px] text-[11.5px] font-semibold tracking-[0.2px] whitespace-nowrap bg-turf-green/12 text-turf-green border border-turf-green/25 max-md:text-[10.5px] max-md:px-2 max-md:py-[3px]">
                  {user.role}
                </div>
              </div>
              <button
                onClick={handleLogoutClick}
                className={`${pillButtonClass} max-md:px-3.5 max-md:py-[7px] max-md:text-[12.5px] max-[540px]:p-[7px] max-[540px]:w-9 max-[540px]:h-9 max-[540px]:justify-center max-[540px]:rounded-full`}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span className="inline-block max-[540px]:hidden">Sign Out</span>
              </button>
            </>
          ) : !hideSignIn ? (
            <button onClick={() => navigate('/login')} className={pillButtonClass} title="Sign In" aria-label="Sign In">
              <span>Sign In</span>
            </button>
          ) : null}
        </div>
      </div>
    </header>
  );
};

export default Header;
