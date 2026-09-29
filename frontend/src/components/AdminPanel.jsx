import React from 'react';
import { useSearchParams } from 'react-router-dom';
import UserManagement from '@/components/UserManagement';
import AdminDataImport from '@/components/AdminDataImport';
import AdminAuditLog from '@/components/AdminAuditLog';
import AdminFailedLogins from '@/components/AdminFailedLogins';

const SECTIONS = [
  { id: 'users', label: 'Users', component: UserManagement },
  { id: 'import', label: 'Data Import', component: AdminDataImport },
  { id: 'audit', label: 'Audit Trail', component: AdminAuditLog },
  { id: 'security', label: 'Failed Logins', component: AdminFailedLogins },
];

const AdminPanel = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const active = SECTIONS.find((s) => s.id === searchParams.get('section')) || SECTIONS[0];
  const Section = active.component;

  return (
    <div className="animate-fade-in max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-1 mb-7 border-b border-border-light overflow-x-auto">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSearchParams(s.id === 'users' ? {} : { section: s.id })}
            className={`px-4 py-2.5 text-sm font-semibold whitespace-nowrap border-b-2 -mb-px cursor-pointer bg-transparent transition-colors ${
              s.id === active.id ? 'border-ocean-deep text-ocean-deep' : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>
      <Section />
    </div>
  );
};

export default AdminPanel;
