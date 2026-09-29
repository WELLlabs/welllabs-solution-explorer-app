import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import { thClass, tdClass, inputClass, cardClass, Spinner } from '@/components/AdminUi';
import { formatDateTime } from '@/utils/adminHelpers';

const REASON_STYLES = {
  'Wrong password': 'bg-amber-50 text-amber-800 border-amber-200',
  'Unknown email': 'bg-slate-100 text-slate-700 border-slate-200',
  'Not an admin account': 'bg-red-50 text-red-700 border-red-200',
  'Account suspended': 'bg-red-50 text-red-700 border-red-200',
};

const AdminFailedLogins = () => {
  const [days, setDays] = useState(30);
  const [data, setData] = useState({ attempts: [], byIp: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api
      .get('/admin/failed-logins', { params: { days } })
      .then(({ data }) => {
        if (!cancelled) {
          setData(data);
          setError('');
        }
      })
      .catch(() => !cancelled && setError('Could not load failed logins'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [days]);

  return (
    <div>
      <div className="flex justify-between items-start mb-6 flex-wrap gap-4">
        <div>
          <h2 className="text-[28px] font-bold text-heading mb-2 tracking-[-0.5px]">Failed Admin Logins</h2>
          <p className="text-muted text-[15px]">
            Failed sign-in attempts on the admin page. After 5 failures in 15 minutes an IP address is blocked for 15 minutes. Records are kept for 90 days.
          </p>
        </div>
        <select
          value={days}
          onChange={(e) => {
            setLoading(true);
            setDays(Number(e.target.value));
          }} className={`${inputClass} cursor-pointer`} aria-label="Period">
          <option value={1}>Last 24 hours</option>
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <Spinner label="Loading failed logins..." />
      ) : error ? (
        <p className="text-center py-[60px] text-red-700">{error}</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_340px] gap-5 items-start">
          <div className={`${cardClass} overflow-x-auto`}>
            <table className="w-full border-collapse min-w-[720px]">
              <thead className="bg-section border-b border-border">
                <tr>
                  <th className={thClass}>When</th>
                  <th className={thClass}>Email tried</th>
                  <th className={thClass}>Reason</th>
                  <th className={thClass}>IP address</th>
                  <th className={thClass}>Browser</th>
                </tr>
              </thead>
              <tbody>
                {data.attempts.length === 0 ? (
                  <tr>
                    <td colSpan="5" className={`${tdClass} text-center !py-[60px] text-slate-400`}>
                      No failed attempts in this period
                    </td>
                  </tr>
                ) : (
                  data.attempts.map((a) => (
                    <tr key={a._id} className="hover:bg-slate-50/60">
                      <td className={`${tdClass} text-muted whitespace-nowrap`}>{formatDateTime(a.createdAt)}</td>
                      <td className={`${tdClass} text-ink`}>{a.email || '—'}</td>
                      <td className={tdClass}>
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border whitespace-nowrap ${REASON_STYLES[a.reason] || ''}`}>
                          {a.reason}
                        </span>
                      </td>
                      <td className={`${tdClass} font-mono text-xs text-muted`}>{a.ip || '—'}</td>
                      <td className={`${tdClass} text-xs text-muted max-w-[260px] truncate`} title={a.userAgent}>
                        {a.userAgent || '—'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className={`${cardClass} p-5`}>
            <h3 className="text-sm font-bold text-ink mb-3">Top IP addresses</h3>
            {data.byIp.length === 0 ? (
              <p className="text-sm text-slate-400">Nothing to show</p>
            ) : (
              <ul className="space-y-3">
                {data.byIp.map((row) => (
                  <li key={row._id || 'unknown'} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block font-mono text-xs text-ink">{row._id || 'unknown'}</span>
                      <span className="block text-[11px] text-muted truncate" title={row.emails.join(', ')}>
                        {row.emails.filter(Boolean).join(', ') || '—'}
                      </span>
                      <span className="block text-[11px] text-muted">Last: {formatDateTime(row.last)}</span>
                    </div>
                    <span
                      className={`shrink-0 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        row.count >= 5 ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {row.count}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFailedLogins;
