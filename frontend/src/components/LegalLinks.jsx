import React from 'react';
import { Link } from 'react-router-dom';

const linkClass = 'text-[#347745] font-semibold no-underline hover:underline';

// "agree" is shown next to sign-in buttons; "footer" on public pages
const LegalLinks = ({ variant = 'footer', className = '' }) =>
  variant === 'agree' ? (
    <p className={`m-0 text-center text-[11px] leading-relaxed text-[#6E6455] ${className}`}>
      By continuing, you agree to our{' '}
      <Link to="/terms" className={linkClass}>Terms of Service</Link> and{' '}
      <Link to="/privacy-policy" className={linkClass}>Privacy Policy</Link>.
    </p>
  ) : (
    <footer className={`flex flex-wrap items-center justify-center gap-x-4 gap-y-1 py-4 text-xs text-[#6E6455] ${className}`}>
      <span>© {new Date().getFullYear()} Climate Solutions · WELL Labs</span>
      <Link to="/privacy-policy" className={linkClass}>Privacy Policy</Link>
      <Link to="/terms" className={linkClass}>Terms of Service</Link>
    </footer>
  );

export default LegalLinks;
