import React from 'react';

const PendingApproval = () => {
  return (
    <div className="bg-white rounded-3xl px-10 py-[60px] text-center shadow-[0_4px_16px_-1px_rgba(0,0,0,0.05)] border border-border-light max-w-[600px] mx-auto my-[60px]">
      <div className="w-20 h-20 bg-tuscan-sun/18 rounded-[60px] flex items-center justify-center mx-auto mb-6 text-tuscan-sun animate-pending-pulse">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-heading mb-3">Account Pending Approval</h2>
      <p className="text-muted leading-[1.6]">
        Your account has been created successfully, but it is waiting for an Administrator to assign your role. 
        You will not be able to view any project data until you are approved.
      </p>
    </div>
  );
};

export default PendingApproval;
