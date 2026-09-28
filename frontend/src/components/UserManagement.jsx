import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/utils/api';
import { PERSONAS } from '@/utils/roleFieldsConfig';

const ROLE_STYLES = {
  Admin: 'bg-purple-50 text-purple-700 border-purple-200',
  Pending: 'bg-amber-50 text-amber-800 border-amber-200',
  'WELL Labs1': 'bg-turf-green/10 text-turf-green border-turf-green/25',
  'WELL Labs2': 'bg-turf-green/10 text-turf-green border-turf-green/25',
  Consultant: 'bg-sky-50 text-sky-700 border-sky-200',
  GBA: 'bg-slate-100 text-slate-700 border-slate-200',
  Funder: 'bg-orange-50 text-orange-700 border-orange-200',
  Citizen: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

const PERSONA_LABELS = {
  govt: 'Govt Official',
  funder: 'Funder',
  designer: 'Designer',
  citizen: 'Citizen',
  admin: 'Admin',
};

const displayRole = (role) => (role === 'Donor' ? 'Funder' : role);

const toText = (value) => (Array.isArray(value) ? value.join(', ') : value || '');

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const thClass = 'px-5 py-4 text-left text-[12px] font-bold text-ink uppercase tracking-[0.5px] whitespace-nowrap';
const tdClass = 'px-5 py-4 border-b border-khaki-beige/20 align-middle text-sm';
const inputClass =
  'w-full px-3 py-2 border border-khaki-beige rounded-lg text-sm text-ink bg-white focus:outline-none focus:border-ocean-deep focus:shadow-[0_0_0_3px_rgba(54,105,169,0.15)]';

const RoleBadge = ({ role }) => (
  <span
    className={`inline-block px-3 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap border ${
      ROLE_STYLES[displayRole(role)] || 'bg-slate-100 text-slate-700 border-slate-200'
    }`}
  >
    {displayRole(role)}
  </span>
);

const regInputClass =
  'w-full px-3.5 py-3 rounded-xl bg-[#f2f4f7] hover:bg-[#ebedf1] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#3669A9]/30 focus:border-[#3669A9] border border-[#A99E8A]/30 transition-all text-sm text-ink';

const Field = ({ label, children, hint }) => (
  <div>
    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 mb-1">{label}</label>
    {children}
    {hint && <p className="text-[10.5px] text-slate-400 mt-1 pl-1">{hint}</p>}
  </div>
);

const EditUserModal = ({ user, onClose, onSaved }) => {
  const persona = PERSONAS[user.persona];
  const isFunder = user.persona === 'funder';
  const userTypeOptions = persona
    ? [...new Set([...(user.userType && !persona.userTypes.includes(user.userType) ? [user.userType] : []), ...persona.userTypes])]
    : null;

  const [form, setForm] = useState(() => ({
    name: user.name || '',
    email: user.email || '',
    userType: user.userType || persona?.userTypes[0] || '',
    organization: user.organization || '',
    cinNumber: user.roleSpecificData?.cinNumber || '',
    phone: user.phone || '',
    address: user.address || '',
    profile: user.profile || '',
    areasOfInterest: toText(user.areasOfInterest),
    focusThemes: toText(user.focusThemes),
    pastProjects: user.pastProjects || '',
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    const { cinNumber, ...rest } = form;
    try {
      const { data } = await api.put(`/auth/users/${user._id}`, {
        ...rest,
        ...(isFunder ? { roleSpecificData: { cinNumber } } : {}),
      });
      onSaved(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not save changes');
      setSaving(false);
    }
  };

  const roleLabel = persona?.label || PERSONA_LABELS[user.persona] || displayRole(user.role);

  return createPortal(
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4" onClick={onClose}>
      <form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[520px] max-h-[90vh] bg-white rounded-[28px] border border-[#C8D7BC]/80 shadow-[0_25px_60px_-15px_rgba(31,42,36,0.35)] flex flex-col overflow-hidden animate-fade-in"
      >
        <div className="px-6 sm:px-8 pt-6 pb-4 border-b border-[#C8D7BC]/40">
          <div className="flex items-center justify-between gap-3">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1F2A24] bg-[#F2C230] px-3 py-1 rounded-full border border-[#F2C230]/80">
              Role: {roleLabel}
            </span>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-slate-700 text-lg leading-none cursor-pointer bg-transparent border-none"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
          <h3 className="text-2xl font-extrabold text-[#1F2A24] tracking-tight mt-4 text-center">
            Edit {roleLabel} details
          </h3>
          {persona?.subtitle && (
            <p className="text-[13px] text-[#6E6455] mt-1.5 leading-relaxed text-center">{persona.subtitle}</p>
          )}
          <div className="flex items-center justify-center gap-2 mt-3 text-xs text-muted">
            <span>Access level:</span>
            <RoleBadge role={user.role} />
          </div>
        </div>

        <div className="px-6 sm:px-8 py-5 overflow-y-auto space-y-4">
          <Field label="Full Name *">
            <input className={regInputClass} value={form.name} onChange={set('name')} required placeholder="e.g. Ramesh Kumar" />
          </Field>
          <Field label="Email Address *">
            <input type="email" className={regInputClass} value={form.email} onChange={set('email')} required />
          </Field>

          <div className="space-y-4 pt-1 border-t border-slate-100">
            <Field label="User Type">
              {userTypeOptions ? (
                <select className={`${regInputClass} cursor-pointer`} value={form.userType} onChange={set('userType')}>
                  {userTypeOptions.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              ) : (
                <input className={regInputClass} value={form.userType} onChange={set('userType')} />
              )}
            </Field>

            <Field label="Name of the Organisation">
              <input
                className={regInputClass}
                value={form.organization}
                onChange={set('organization')}
                placeholder="e.g. Bangalore Climate Foundation"
              />
            </Field>

            {isFunder && (
              <Field
                label="CIN Number (Corporate Identification Number)"
                hint="21-character alphanumeric code issued by Registrar of Companies (ROC)"
              >
                <input
                  className={`${regInputClass} font-mono`}
                  value={form.cinNumber}
                  onChange={(e) => setForm((prev) => ({ ...prev, cinNumber: e.target.value.toUpperCase() }))}
                  placeholder="e.g. U72200KA2020PTC123456"
                />
              </Field>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Phone Number">
                <input type="tel" className={regInputClass} value={form.phone} onChange={set('phone')} placeholder="+91 9876543210" />
              </Field>
              <Field label="Address / Location">
                <input className={regInputClass} value={form.address} onChange={set('address')} placeholder="e.g. Indiranagar, Bengaluru" />
              </Field>
            </div>

            <Field label="Profile / Designation">
              <input className={regInputClass} value={form.profile} onChange={set('profile')} />
            </Field>
            <Field label="Areas of Interest">
              <input className={regInputClass} value={form.areasOfInterest} onChange={set('areasOfInterest')} />
            </Field>
            <Field label="Focus Themes">
              <input className={regInputClass} value={form.focusThemes} onChange={set('focusThemes')} />
            </Field>
            <Field label="Past Projects / Experience">
              <textarea rows={3} className={`${regInputClass} resize-none`} value={form.pastProjects} onChange={set('pastProjects')} />
            </Field>
          </div>
        </div>

        <div className="px-6 sm:px-8 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
          {error && <p className="mr-auto text-sm text-red-700">{error}</p>}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-ink bg-white border border-khaki-beige hover:bg-slate-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-[#3669A9] hover:bg-[#347745] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </div>
      </form>
    </div>,
    document.body
  );
};

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editingUser, setEditingUser] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    api
      .get('/auth/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setError('Could not load users'))
      .finally(() => setLoading(false));
  }, []);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, displayRole(u.role), u.organization, u.userType, u.phone]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [users, search]);

  const closeEditor = useCallback(() => setEditingUser(null), []);

  const handleSaved = (updated) => {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
    setEditingUser(null);
  };

  const handleDelete = async (u) => {
    if (!window.confirm(`Delete ${u.name} (${u.email})? This cannot be undone.`)) return;
    setDeletingId(u._id);
    try {
      await api.delete(`/auth/users/${u._id}`);
      setUsers((prev) => prev.filter((x) => x._id !== u._id));
    } catch (err) {
      alert(err.response?.data?.message || 'Could not delete user');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-6 flex-wrap gap-5 max-md:flex-col">
        <div>
          <h2 className="text-[28px] font-bold text-heading mb-2 tracking-[-0.5px]">User Management</h2>
          <p className="text-muted text-[15px]">View, edit and remove registered users</p>
        </div>
        <div className="bg-ocean-deep px-6 py-4 rounded-2xl text-center shadow-[0_4px_12px_rgba(54,105,169,0.25)]">
          <span className="block text-xs text-white/85 mb-1">Total Users</span>
          <span className="text-[28px] font-bold text-white">{users.length}</span>
        </div>
      </div>

      <input
        type="search"
        placeholder="Search by name, email, role, organization…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className={`${inputClass} mb-4 max-w-md`}
      />

      <div className="bg-white rounded-[20px] border border-border-light shadow-[0_1px_4px_rgba(31,42,36,0.05)] overflow-x-auto">
        {loading ? (
          <div className="text-center py-[60px] px-5">
            <div className="w-10 h-10 border-[3px] border-slate-200 border-t-indigo-500 rounded-full animate-spin mx-auto mb-4" />
            <p>Loading users...</p>
          </div>
        ) : error ? (
          <p className="text-center py-[60px] text-red-700">{error}</p>
        ) : (
          <table className="w-full border-collapse min-w-[900px]">
            <thead className="bg-section border-b border-border">
              <tr>
                <th className={thClass}>User</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Organization</th>
                <th className={thClass}>Phone</th>
                <th className={thClass}>Joined</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" className={`${tdClass} text-center !py-[60px] text-slate-400`}>
                    {users.length === 0 ? 'No other users registered yet' : 'No users match your search'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className="hover:bg-slate-50/60">
                    <td className={tdClass}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 shrink-0 bg-ocean-deep rounded-[10px] flex items-center justify-center text-white font-semibold text-sm">
                          {(u.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-body">{u.name}</span>
                          {u.userId && <span className="text-[11px] text-muted font-mono">{u.userId}</span>}
                        </div>
                      </div>
                    </td>
                    <td className={`${tdClass} text-muted`}>{u.email}</td>
                    <td className={tdClass}>
                      <RoleBadge role={u.role} />
                    </td>
                    <td className={`${tdClass} text-muted`}>
                      {PERSONA_LABELS[u.persona] || u.persona || '—'}
                      {u.userType && <span className="block text-[11px]">{u.userType}</span>}
                    </td>
                    <td className={`${tdClass} text-muted`}>{u.organization || '—'}</td>
                    <td className={`${tdClass} text-muted whitespace-nowrap`}>{u.phone || '—'}</td>
                    <td className={`${tdClass} text-muted whitespace-nowrap`}>{formatDate(u.createdAt)}</td>
                    <td className={`${tdClass} text-right whitespace-nowrap`}>
                      <button
                        type="button"
                        onClick={() => setEditingUser(u)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-ocean-deep border border-ocean-deep/40 hover:bg-ocean-deep hover:text-white cursor-pointer bg-white transition-colors"
                      >
                        Edit
                      </button>
                      {u.role !== 'Admin' && (
                        <button
                          type="button"
                          onClick={() => handleDelete(u)}
                          disabled={deletingId === u._id}
                          className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-700 border border-red-200 hover:bg-red-600 hover:text-white cursor-pointer bg-white transition-colors disabled:opacity-60"
                        >
                          {deletingId === u._id ? 'Deleting…' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {editingUser && (
        <EditUserModal user={editingUser} onClose={closeEditor} onSaved={handleSaved} />
      )}
    </div>
  );
};

export default UserManagement;
