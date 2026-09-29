import React, { useEffect, useState } from 'react';
import api from '@/utils/api';
import { thClass, tdClass, inputClass, cardClass, Spinner } from '@/components/AdminUi';
import { formatDateTime } from '@/utils/adminHelpers';

const ACTION_LABELS = {
  'user.update': 'Edited user',
  'user.delete': 'Deleted user',
  'user.suspend': 'Suspended user',
  'user.activate': 'Reactivated user',
  'user.reset_link': 'Created reset link',
  'user.invite_link': 'Created invite link',
  'user.force_logout': 'Forced logout',
  'user.invite': 'Invited user',
  'layer.import': 'Bulk import',
  'layer.add_record': 'Added record',
};

const TYPE_STYLES = {
  user: 'bg-sky-50 text-sky-700 border-sky-200',
  layer: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const formatValue = (v) => {
  if (v === null || v === undefined || v === '') return '—';
  if (typeof v === 'object') return JSON.stringify(v);
  return String(v);
};

const Changes = ({ changes }) => {
  if (!changes || typeof changes !== 'object' || Object.keys(changes).length === 0) return <span className="text-slate-400">—</span>;
  return (
    <ul className="space-y-0.5 text-xs">
      {Object.entries(changes).map(([key, val]) => (
        <li key={key} className="break-words">
          <span className="font-semibold text-ink">{key}:</span>{' '}
          {val && typeof val === 'object' && 'from' in val && 'to' in val ? (
            <>
              <span className="text-red-700 line-through">{formatValue(val.from)}</span>
              {' → '}
              <span className="text-emerald-700">{formatValue(val.to)}</span>
            </>
          ) : (
            <span className="text-muted">{formatValue(val)}</span>
          )}
        </li>
      ))}
    </ul>
  );
};

const AdminAuditLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [targetType, setTargetType] = useState('');
  const [action, setAction] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setQuery(q.trim()), 300);
    return () => clearTimeout(timer);
  }, [q]);

  useEffect(() => {
    let cancelled = false;
    api
      .get('/admin/audit', { params: { targetType: targetType || undefined, action: action || undefined, q: query || undefined } })
      .then(({ data }) => {
        if (!cancelled) {
          setLogs(data);
          setError('');
        }
      })
      .catch(() => !cancelled && setError('Could not load the audit trail'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [targetType, action, query]);

  const actionOptions = Object.entries(ACTION_LABELS).filter(([key]) => !targetType || key.startsWith(`${targetType}.`));

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-[28px] font-bold text-heading mb-2 tracking-[-0.5px]">Audit Trail</h2>
        <p className="text-muted text-[15px]">Every change an admin makes to users and data layers.</p>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <input
          type="search"
          placeholder="Search admin or target…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className={`${inputClass} w-64`}
        />
        <select
          value={targetType}
          onChange={(e) => {
            setTargetType(e.target.value);
            setAction('');
          }}
          className={`${inputClass} cursor-pointer`}
          aria-label="Type"
        >
          <option value="">All types</option>
          <option value="user">Users</option>
          <option value="layer">Data layers</option>
        </select>
        <select value={action} onChange={(e) => setAction(e.target.value)} className={`${inputClass} cursor-pointer`} aria-label="Action">
          <option value="">All actions</option>
          {actionOptions.map(([key, label]) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <div className={`${cardClass} overflow-x-auto`}>
        {loading ? (
          <Spinner label="Loading audit trail..." />
        ) : error ? (
          <p className="text-center py-[60px] text-red-700">{error}</p>
        ) : (
          <table className="w-full border-collapse min-w-[900px]">
            <thead className="bg-section border-b border-border">
              <tr>
                <th className={thClass}>When</th>
                <th className={thClass}>Admin</th>
                <th className={thClass}>Action</th>
                <th className={thClass}>Target</th>
                <th className={thClass}>Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td colSpan="5" className={`${tdClass} text-center !py-[60px] text-slate-400`}>
                    No admin activity recorded yet
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-50/60 align-top">
                    <td className={`${tdClass} text-muted whitespace-nowrap align-top`}>{formatDateTime(log.createdAt)}</td>
                    <td className={`${tdClass} align-top`}>
                      <span className="text-ink">{log.adminEmail}</span>
                      {log.ip && <span className="block text-[11px] text-muted font-mono">{log.ip}</span>}
                    </td>
                    <td className={`${tdClass} align-top whitespace-nowrap`}>
                      <span className={`inline-block px-2 py-0.5 rounded-full text-[10.5px] font-semibold border mr-2 ${TYPE_STYLES[log.targetType] || ''}`}>
                        {log.targetType}
                      </span>
                      {ACTION_LABELS[log.action] || log.action}
                    </td>
                    <td className={`${tdClass} align-top text-ink`}>{log.targetLabel || log.targetId || '—'}</td>
                    <td className={`${tdClass} align-top max-w-[420px]`}>
                      <Changes changes={log.changes} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminAuditLog;
