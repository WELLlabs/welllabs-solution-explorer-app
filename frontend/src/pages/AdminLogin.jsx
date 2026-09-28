import React, { useContext, useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from '@/context/AuthContext';

const AdminLogin = () => {
  const { user, loading, adminLogin } = useContext(AuthContext);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Keep this page out of search engine results.
  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'robots';
    meta.content = 'noindex, nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  if (loading) return null;
  if (user?.role === 'Admin') return <Navigate to="/usermanagement" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    const result = await adminLogin(email, password);
    setSubmitting(false);
    if (result.success) {
      navigate('/usermanagement', { replace: true });
    } else {
      setError(result.message);
      setPassword('');
    }
  };

  const inputClass =
    'w-full px-3.5 py-2.5 border border-khaki-beige rounded-lg text-sm text-ink bg-white focus:outline-none focus:border-ocean-deep focus:shadow-[0_0_0_3px_rgba(54,105,169,0.15)]';

  return (
    <div className="min-h-screen flex items-center justify-center bg-page px-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-white rounded-2xl border border-border-light shadow-[0_4px_16px_-1px_rgba(0,0,0,0.06)] p-8 flex flex-col gap-4"
      >
        <div className="text-center mb-2">
          <h1 className="text-xl font-bold text-ink">WELL Labs Admin</h1>
          <p className="text-sm text-muted mt-1">Authorised administrators only</p>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Email
          <input
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-semibold text-ink">
          Password
          <input
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

export default AdminLogin;
