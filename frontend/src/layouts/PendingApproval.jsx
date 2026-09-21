import React from 'react';
import './PendingApproval.css';

const PendingApproval = () => {
  return (
    <div className="pending-card">
      <div className="pending-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 8v4l3 3" />
        </svg>
      </div>
      <h2>Account Pending Approval</h2>
      <p>
        Your account has been created successfully, but it is waiting for an Administrator to assign your role. 
        You will not be able to view any project data until you are approved.
      </p>
    </div>
  );
};

export default PendingApproval;
