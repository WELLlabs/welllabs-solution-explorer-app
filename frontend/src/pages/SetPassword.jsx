import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/utils/api';

const inputClass =
  'w-full px-3.5 py-2.5 border border-khaki-beige rounded-lg text-sm text-ink bg-white focus:outline-none focus:border-ocean-deep focus:shadow-[0_0_0_3px_rgba(54,105,169,0.15)]';

const SetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';

  const [info, setInfo] = useState(null);
  const [fetchError, setFetchError] = useState('');
  const linkError = token ? fetchError : 'This link is missing its token. Ask the administrator for a new one.';
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  useEffect(() => {
    if (!token) return;
    api
      .get(`/auth/password-token/${encodeURIComponent(token)}`)
      .then(({ data }) => setInfo(data))
      .catch((err) => setFetchError(err.response?.data?.message || 'This link is invalid or has expired.'));
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (password.length < 8) return setError('Password must be at least 8 characters');
    if (password !== confirm) return setError('Passwords do not match');
    setSubmitting(true);
    try {
      await api.post('/auth/set-password', { token, password });
      setDone(true);
      setTimeout(() => navigate(`/login?role=${info?.persona || 'funder'}`, { replace: true }), 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save password');
      setSubmitting(false);
    }
  };

  const isInvite = info?.purpose === 'invite';

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm bg-white rounded-2xl border border-border-light shadow-[0_4px_16px_-1px_rgba(0,0,0,0.06)] p-8">
        {linkError ? (
          <div className="text-center flex flex-col gap-4">
            <h1 className="text-xl font-bold text-ink">Link not valid</h1>
            <p className="text-sm text-muted">{linkError}</p>
            <Link to="/login" className="text-sm font-semibold text-ocean-deep hover:underline">
              Go to sign in
            </Link>
          </div>
        ) : !info ? (
          <p className="text-center text-sm text-muted">Checking link…</p>
        ) : done ? (
          <div className="text-center flex flex-col gap-2">
            <h1 className="text-xl font-bold text-ink">Password saved</h1>
            <p className="text-sm text-muted">Taking you to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h1 className="text-xl font-bold text-ink">{isInvite ? 'Welcome! Create your password' : 'Reset your password'}</h1>
              <p className="text-sm text-muted mt-1">
                {info.name ? `${info.name} · ` : ''}
                {info.email}
              </p>
            </div>

            <input type="email" autoComplete="username" value={info.email} readOnly hidden />

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
              New password
              <input
                type="password"
                autoComplete="new-password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
              Confirm password
              <input
                type="password"
                autoComplete="new-password"
                required
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClass}
              />
            </label>

            {error && (
              <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full py-2.5 rounded-lg bg-ocean-deep text-white text-sm font-bold cursor-pointer transition-colors hover:bg-turf-green disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? 'Saving…' : 'Save password'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default SetPassword;
