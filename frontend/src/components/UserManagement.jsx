import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import api from '@/utils/api';
import { PERSONAS } from '@/utils/roleFieldsConfig';
import {
  thClass,
  tdClass,
  inputClass,
  cardClass,
  primaryBtn,
  secondaryBtn,
  Spinner,
  Modal,
  CopyLinkBox,
} from '@/components/AdminUi';
import { formatDateTime, passwordLink } from '@/utils/adminHelpers';

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

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  suspended: 'bg-red-50 text-red-700 border-red-200',
  invited: 'bg-sky-50 text-sky-700 border-sky-200',
};

const PERSONA_LABELS = {
  govt: 'Govt Official',
  funder: 'Funder',
  designer: 'Designer',
  citizen: 'Citizen',
  admin: 'Admin',
};

const LAST_LOGIN_FILTERS = [
  { id: '', label: 'Any time' },
  { id: '7', label: 'Last 7 days' },
  { id: '30', label: 'Last 30 days' },
  { id: 'inactive30', label: 'Not in 30+ days' },
  { id: 'never', label: 'Never logged in' },
];

const DAY_MS = 24 * 3600 * 1000;

const displayRole = (role) => (role === 'Donor' ? 'Funder' : role);

const statusOf = (u) => u.status || 'active';

const toText = (value) => (Array.isArray(value) ? value.join(', ') : value || '');

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

const RoleBadge = ({ role }) => (
  <span
    className={`inline-block px-3 py-1 rounded-full text-[11.5px] font-semibold whitespace-nowrap border ${
      ROLE_STYLES[displayRole(role)] || 'bg-slate-100 text-slate-700 border-slate-200'
    }`}
  >
    {displayRole(role)}
  </span>
);

const StatusBadge = ({ status }) => (
  <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize border ${STATUS_STYLES[status]}`}>
    {status}
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

const Section = ({ title, description, children }) => (
  <div className="py-4 border-b border-slate-100 last:border-b-0 first:pt-0">
    <h4 className="text-sm font-bold text-ink">{title}</h4>
    {description && <p className="text-xs text-muted mt-0.5 mb-3">{description}</p>}
    {children}
  </div>
);

const ManageUserModal = ({ user, onClose, onChanged, onDeleted }) => {
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [reason, setReason] = useState('');
  const [link, setLink] = useState(null);
  const status = statusOf(user);
  const isAdmin = user.role === 'Admin';

  const run = async (key, fn) => {
    setBusy(key);
    setError('');
    setMessage('');
    try {
      await fn();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setBusy('');
    }
  };

  const suspend = () =>
    run('suspend', async () => {
      const { data } = await api.post(`/admin/users/${user._id}/suspend`, { reason });
      onChanged(data);
      setReason('');
    });

  const activate = () =>
    run('activate', async () => {
      const { data } = await api.post(`/admin/users/${user._id}/activate`);
      onChanged(data);
    });

  const createLink = () =>
    run('link', async () => {
      const { data } = await api.post(`/admin/users/${user._id}/reset-link`);
      setLink(data);
    });

  const forceLogout = () =>
    run('logout', async () => {
      const { data } = await api.post(`/admin/users/${user._id}/force-logout`);
      setMessage(data.message);
    });

  const remove = () => {
    if (!window.confirm(`Delete ${user.name} (${user.email})? This cannot be undone. Consider suspending instead.`)) return;
    run('delete', async () => {
      await api.delete(`/auth/users/${user._id}`);
      onDeleted(user._id);
    });
  };

  return (
    <Modal title={`Manage ${user.name}`} onClose={onClose}>
      <div className="flex items-center gap-2 mb-4 text-xs text-muted flex-wrap">
        <span>{user.email}</span>
        <RoleBadge role={user.role} />
        <StatusBadge status={status} />
      </div>

      {error && <p className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
      {message && <p className="mb-3 text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{message}</p>}

      {!isAdmin && (
        <Section
          title="Account status"
          description={
            status === 'suspended'
              ? `Suspended ${formatDateTime(user.suspendedAt)}${user.suspendedReason ? ` — “${user.suspendedReason}”` : ''}. The user cannot sign in.`
              : 'Suspending blocks sign-in and ends all sessions, but keeps the account and its data.'
          }
        >
          {status === 'suspended' ? (
            <button type="button" onClick={activate} disabled={!!busy} className={primaryBtn}>
              {busy === 'activate' ? 'Reactivating…' : 'Reactivate account'}
            </button>
          ) : (
            <div className="flex gap-2">
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason (optional, visible to admins)"
                maxLength={300}
                className={`${inputClass} flex-1`}
              />
              <button
                type="button"
                onClick={suspend}
                disabled={!!busy}
                className="px-4 py-2 rounded-lg text-sm font-bold text-white bg-amber-600 hover:bg-amber-700 cursor-pointer disabled:opacity-60"
              >
                {busy === 'suspend' ? 'Suspending…' : 'Suspend'}
              </button>
            </div>
          )}
        </Section>
      )}

      <Section
        title={status === 'invited' ? 'Invite link' : 'Password reset'}
        description={
          status === 'invited'
            ? 'This user has not set a password yet. Generate a fresh invite link and send it to them.'
            : 'Generate a one-time link and send it to the user. Setting a new password signs them out everywhere.'
        }
      >
        {link ? (
          <CopyLinkBox
            url={passwordLink(link.token)}
            expiresAt={link.expiresAt}
            note="Send this to the user by email or chat. Any older link stops working."
          />
        ) : (
          <button type="button" onClick={createLink} disabled={!!busy} className={secondaryBtn}>
            {busy === 'link' ? 'Generating…' : status === 'invited' ? 'Generate invite link' : 'Generate reset link'}
          </button>
        )}
      </Section>

      {!isAdmin && (
        <Section title="Sessions" description={`Last login: ${formatDateTime(user.lastLoginAt)}. Sign the user out on every device.`}>
          <button type="button" onClick={forceLogout} disabled={!!busy} className={secondaryBtn}>
            {busy === 'logout' ? 'Signing out…' : 'Force logout'}
          </button>
        </Section>
      )}

      {!isAdmin && (
        <Section title="Delete account" description="Permanently removes the user. This cannot be undone.">
          <button
            type="button"
            onClick={remove}
            disabled={!!busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold text-red-700 border border-red-200 hover:bg-red-600 hover:text-white cursor-pointer bg-white transition-colors disabled:opacity-60"
          >
            {busy === 'delete' ? 'Deleting…' : 'Delete user'}
          </button>
        </Section>
      )}
    </Modal>
  );
};

const INVITE_PERSONAS = ['govt', 'funder', 'designer', 'citizen'];

const InviteUserModal = ({ onClose, onInvited }) => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    persona: 'funder',
    userType: PERSONAS.funder.userTypes[0],
    organization: '',
    phone: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  const set = (key) => (e) => setForm((prev) => ({ ...prev, [key]: e.target.value }));
  const setPersona = (e) => {
    const persona = e.target.value;
    setForm((prev) => ({ ...prev, persona, userType: PERSONAS[persona]?.userTypes[0] || '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { data } = await api.post('/admin/users/invite', form);
      setResult(data);
      onInvited(data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not invite user');
    } finally {
      setSaving(false);
    }
  };

  if (result) {
    return (
      <Modal title="Invite created" onClose={onClose} footer={<button type="button" onClick={onClose} className={primaryBtn}>Done</button>}>
        <p className="text-sm text-ink mb-3">
          Send this link to <strong>{result.user.email}</strong>. They will choose a password and can then sign in as{' '}
          {PERSONAS[result.user.persona]?.label || result.user.persona}.
        </p>
        <CopyLinkBox url={passwordLink(result.token)} expiresAt={result.expiresAt} />
      </Modal>
    );
  }

  return (
    <Modal
      title="Invite a new user"
      onClose={onClose}
      footer={
        <>
          {error && <p className="mr-auto text-sm text-red-700">{error}</p>}
          <button type="button" onClick={onClose} className={secondaryBtn}>
            Cancel
          </button>
          <button type="submit" form="invite-form" disabled={saving} className={primaryBtn}>
            {saving ? 'Creating…' : 'Create invite link'}
          </button>
        </>
      }
    >
      <form id="invite-form" onSubmit={handleSubmit} className="space-y-4">
        <Field label="Full Name *">
          <input className={regInputClass} value={form.name} onChange={set('name')} required />
        </Field>
        <Field label="Email Address *">
          <input type="email" className={regInputClass} value={form.email} onChange={set('email')} required />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Role *">
            <select className={`${regInputClass} cursor-pointer`} value={form.persona} onChange={setPersona}>
              {INVITE_PERSONAS.map((p) => (
                <option key={p} value={p}>
                  {PERSONAS[p]?.label || PERSONA_LABELS[p]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="User Type">
            <select className={`${regInputClass} cursor-pointer`} value={form.userType} onChange={set('userType')}>
              {(PERSONAS[form.persona]?.userTypes || []).map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Name of the Organisation">
          <input className={regInputClass} value={form.organization} onChange={set('organization')} />
        </Field>
        <Field label="Phone Number">
          <input type="tel" className={regInputClass} value={form.phone} onChange={set('phone')} />
        </Field>
      </form>
    </Modal>
  );
};

const StatCard = ({ label, value, className }) => (
  <div className={`px-5 py-3 rounded-2xl text-center min-w-[110px] ${className}`}>
    <span className="block text-xs opacity-85 mb-0.5">{label}</span>
    <span className="text-2xl font-bold">{value}</span>
  </div>
);

const EMPTY_FILTERS = { role: '', status: '', joinedFrom: '', joinedTo: '', lastLogin: '' };

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [editingUser, setEditingUser] = useState(null);
  const [managingUser, setManagingUser] = useState(null);
  const [inviting, setInviting] = useState(false);
  const [now] = useState(() => Date.now());

  useEffect(() => {
    api
      .get('/auth/users')
      .then(({ data }) => setUsers(data))
      .catch(() => setError('Could not load users'))
      .finally(() => setLoading(false));
  }, []);

  const roles = useMemo(() => [...new Set(users.map((u) => displayRole(u.role)))].sort(), [users]);

  const counts = useMemo(() => {
    const c = { active: 0, suspended: 0, invited: 0 };
    users.forEach((u) => {
      c[statusOf(u)] += 1;
    });
    return c;
  }, [users]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    const from = filters.joinedFrom ? new Date(filters.joinedFrom).getTime() : null;
    const to = filters.joinedTo ? new Date(filters.joinedTo).getTime() + DAY_MS : null;

    return users.filter((u) => {
      if (filters.role && displayRole(u.role) !== filters.role) return false;
      if (filters.status && statusOf(u) !== filters.status) return false;

      const joined = u.createdAt ? new Date(u.createdAt).getTime() : null;
      if (from && (!joined || joined < from)) return false;
      if (to && (!joined || joined >= to)) return false;

      const last = u.lastLoginAt ? new Date(u.lastLoginAt).getTime() : null;
      if (filters.lastLogin === 'never' && last) return false;
      if (filters.lastLogin === 'inactive30' && last && now - last < 30 * DAY_MS) return false;
      if (['7', '30'].includes(filters.lastLogin) && (!last || now - last > Number(filters.lastLogin) * DAY_MS)) return false;

      if (!q) return true;
      return [u.name, u.email, displayRole(u.role), u.organization, u.userType, u.phone, u.userId]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [users, search, filters, now]);

  const hasFilters = search || Object.values(filters).some(Boolean);
  const setFilter = (key) => (e) => setFilters((prev) => ({ ...prev, [key]: e.target.value }));

  const closeEditor = useCallback(() => setEditingUser(null), []);
  const closeManager = useCallback(() => setManagingUser(null), []);
  const closeInvite = useCallback(() => setInviting(false), []);

  const mergeUser = (updated) => {
    setUsers((prev) => prev.map((u) => (u._id === updated._id ? { ...u, ...updated } : u)));
  };

  const handleSaved = (updated) => {
    mergeUser(updated);
    setEditingUser(null);
  };

  const handleChanged = (updated) => {
    mergeUser(updated);
    setManagingUser((prev) => (prev ? { ...prev, ...updated } : prev));
  };

  const handleDeleted = (id) => {
    setUsers((prev) => prev.filter((u) => u._id !== id));
    setManagingUser(null);
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6 flex-wrap gap-5 max-md:flex-col">
        <div>
          <h2 className="text-[28px] font-bold text-heading mb-2 tracking-[-0.5px]">User Management</h2>
          <p className="text-muted text-[15px]">View, edit, suspend and invite users</p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <StatCard label="Total" value={users.length} className="bg-ocean-deep text-white shadow-[0_4px_12px_rgba(54,105,169,0.25)]" />
          <StatCard label="Active" value={counts.active} className="bg-emerald-50 text-emerald-800 border border-emerald-200" />
          <StatCard label="Suspended" value={counts.suspended} className="bg-red-50 text-red-800 border border-red-200" />
          <StatCard label="Invited" value={counts.invited} className="bg-sky-50 text-sky-800 border border-sky-200" />
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 mb-4">
        <input
          type="search"
          placeholder="Search name, email, organisation…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`${inputClass} w-64`}
        />
        <select value={filters.role} onChange={setFilter('role')} className={`${inputClass} cursor-pointer`} aria-label="Role">
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select value={filters.status} onChange={setFilter('status')} className={`${inputClass} cursor-pointer`} aria-label="Status">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
          <option value="invited">Invited</option>
        </select>
        <label className="flex flex-col text-[11px] font-semibold text-muted gap-1">
          Joined from
          <input type="date" value={filters.joinedFrom} onChange={setFilter('joinedFrom')} className={inputClass} />
        </label>
        <label className="flex flex-col text-[11px] font-semibold text-muted gap-1">
          Joined to
          <input type="date" value={filters.joinedTo} onChange={setFilter('joinedTo')} className={inputClass} />
        </label>
        <select value={filters.lastLogin} onChange={setFilter('lastLogin')} className={`${inputClass} cursor-pointer`} aria-label="Last login">
          {LAST_LOGIN_FILTERS.map((f) => (
            <option key={f.id} value={f.id}>
              {f.id ? f.label : 'Last login: any'}
            </option>
          ))}
        </select>
        {hasFilters && (
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setFilters(EMPTY_FILTERS);
            }}
            className="text-sm font-semibold text-ocean-deep hover:underline bg-transparent cursor-pointer px-1 py-2"
          >
            Clear
          </button>
        )}
        <button type="button" onClick={() => setInviting(true)} className={`${primaryBtn} ml-auto`}>
          + Invite user
        </button>
      </div>

      <div className={`${cardClass} overflow-x-auto`}>
        {loading ? (
          <Spinner label="Loading users..." />
        ) : error ? (
          <p className="text-center py-[60px] text-red-700">{error}</p>
        ) : (
          <table className="w-full border-collapse min-w-[1000px]">
            <thead className="bg-section border-b border-border">
              <tr>
                <th className={thClass}>User</th>
                <th className={thClass}>Email</th>
                <th className={thClass}>Role</th>
                <th className={thClass}>Status</th>
                <th className={thClass}>Type</th>
                <th className={thClass}>Organization</th>
                <th className={thClass}>Joined</th>
                <th className={thClass}>Last login</th>
                <th className={`${thClass} text-right`}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="9" className={`${tdClass} text-center !py-[60px] text-slate-400`}>
                    {users.length === 0 ? 'No other users registered yet' : 'No users match these filters'}
                  </td>
                </tr>
              ) : (
                filteredUsers.map((u) => (
                  <tr key={u._id} className={`hover:bg-slate-50/60 ${statusOf(u) === 'suspended' ? 'opacity-70' : ''}`}>
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
                    <td className={tdClass}>
                      <StatusBadge status={statusOf(u)} />
                    </td>
                    <td className={`${tdClass} text-muted`}>
                      {PERSONA_LABELS[u.persona] || u.persona || '—'}
                      {u.userType && <span className="block text-[11px]">{u.userType}</span>}
                    </td>
                    <td className={`${tdClass} text-muted`}>{u.organization || '—'}</td>
                    <td className={`${tdClass} text-muted whitespace-nowrap`}>{formatDate(u.createdAt)}</td>
                    <td className={`${tdClass} text-muted whitespace-nowrap`}>{u.lastLoginAt ? formatDate(u.lastLoginAt) : 'Never'}</td>
                    <td className={`${tdClass} text-right whitespace-nowrap`}>
                      <button
                        type="button"
                        onClick={() => setEditingUser(u)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold text-ocean-deep border border-ocean-deep/40 hover:bg-ocean-deep hover:text-white cursor-pointer bg-white transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => setManagingUser(u)}
                        className="ml-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-ink border border-khaki-beige hover:bg-slate-100 cursor-pointer bg-white transition-colors"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {editingUser && <EditUserModal user={editingUser} onClose={closeEditor} onSaved={handleSaved} />}
      {managingUser && (
        <ManageUserModal user={managingUser} onClose={closeManager} onChanged={handleChanged} onDeleted={handleDeleted} />
      )}
      {inviting && <InviteUserModal onClose={closeInvite} onInvited={(u) => setUsers((prev) => [u, ...prev])} />}
    </div>
  );
};

export default UserManagement;
