import { useEffect, useRef, useState } from 'react';

// Public OAuth client ID; must match GOOGLE_CLIENT_ID on the backend
const CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID || '660304717733-g5d02t6mn67jcppsoc0ef0m9go39qe8a.apps.googleusercontent.com';
let scriptPromise = null;

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error('Could not load Google sign-in. Check your connection and try again.'));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
};

/**
 * Official "Sign in with Google" button (Google Identity Services).
 * Calls onCredential with the signed ID token, which the backend verifies.
 */
const GoogleSignInButton = ({ onCredential, onError, busy = false }) => {
  const containerRef = useRef(null);
  const callbacks = useRef({ onCredential, onError });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    callbacks.current = { onCredential, onError };
  }, [onCredential, onError]);

  useEffect(() => {
    let cancelled = false;
    loadGoogleScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: (response) => callbacks.current.onCredential(response.credential),
          ux_mode: 'popup',
          auto_select: false,
          cancel_on_tap_outside: true,
        });
        window.google.accounts.id.renderButton(containerRef.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'pill',
          text: 'continue_with',
          logo_alignment: 'center',
          width: Math.min(Math.max(containerRef.current.offsetWidth, 200), 400),
        });
        setReady(true);
      })
      .catch((err) => {
        if (!cancelled) callbacks.current.onError?.(err.message);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className={`relative ${busy ? 'pointer-events-none opacity-60' : ''}`}>
      <div ref={containerRef} className="w-full flex justify-center min-h-[44px]" />
      {!ready && <p className="m-0 text-center text-[11px] text-[#6E6455]">Loading Google sign-in…</p>}
      {busy && <p className="m-0 mt-1 text-center text-[11px] text-[#6E6455]">Signing you in with Google…</p>}
    </div>
  );
};

export default GoogleSignInButton;
