import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import axios from 'axios';
import './Dashboard.css';
import Analytics from './Analytics';

// The Permission Configuration based on the Spreadsheet
export const FIELD_PERMISSIONS = {
  'Admin': ['ALL_FIELDS'],
  'WELL Labs1': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'WELL Labs2': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'Consultant': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'GBA': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'Donor': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support']
};

const Dashboard = () => {
  const { user, logout } = useContext(AuthContext);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  
  // Metabase & Tab Integration States
  const [activeTab, setActiveTab] = useState('main'); // 'main' or 'analytics'
  const [metabaseUrl, setMetabaseUrl] = useState(() => localStorage.getItem('metabaseUrl') || '');
  const [tempUrl, setTempUrl] = useState(() => localStorage.getItem('metabaseUrl') || '');
  const [activeGuideTab, setActiveGuideTab] = useState('sync'); // 'sync' or 'secure'


  useEffect(() => {
    if (user && user.role === 'Admin') {
      fetchUsers();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchUsers = async () => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      const res = await axios.get('http://localhost:5000/api/auth/users', {
        headers: { Authorization: `Bearer ${storedUser.token}` }
      });
      setAllUsers(res.data);
    } catch (error) {
      console.error('Error fetching users', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingUserId(userId);
    try {
      const storedUser = JSON.parse(localStorage.getItem('user'));
      await axios.put(`http://localhost:5000/api/auth/users/${userId}/role`, 
        { role: newRole },
        { headers: { Authorization: `Bearer ${storedUser.token}` } }
      );
      await fetchUsers();
    } catch (error) {
      console.error('Error updating role', error);
      alert('Failed to update role');
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleSaveMetabaseUrl = (e) => {
    e.preventDefault();
    if (!tempUrl.trim()) return;
    
    let cleanUrl = tempUrl.trim();
    // Simple validation helper to make sure it includes http/https or iframe tags
    if (cleanUrl.startsWith('<iframe') && cleanUrl.includes('src="')) {
      // Extract URL from iframe src attribute if user pasted full iframe tag
      const match = cleanUrl.match(/src="([^"]+)"/);
      if (match && match[1]) {
        cleanUrl = match[1];
      }
    }
    
    localStorage.setItem('metabaseUrl', cleanUrl);
    setMetabaseUrl(cleanUrl);
  };

  const handleClearMetabaseUrl = () => {
    if (window.confirm("Are you sure you want to disconnect/reset the Metabase Embed URL?")) {
      localStorage.removeItem('metabaseUrl');
      setMetabaseUrl('');
      setTempUrl('');
    }
  };


  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="dashboard-wrapper">
      {/* Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <h1 className="logo-text">Solution Explorer</h1>
              <p className="logo-subtitle">Dashboard</p>
            </div>
          </div>
          
          <div className="user-section">
            <div className="user-info">
              <span className="user-greeting">Welcome,</span>
              <strong className="user-name">{user.name}</strong>
              <div className={`role-badge role-${user.role.toLowerCase().replace(' ', '-')}`}>
                {user.role}
              </div>
            </div>
            <button onClick={logout} className="logout-button">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="dashboard-main">
        {/* PENDING VIEW */}
        {user.role === 'Pending' && (
          <div className="pending-card">
            <div className="pending-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
                <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h2>Account Pending Approval</h2>
            <p>Your account has been created successfully, but it is waiting for an Administrator to assign your role. You will not be able to view any project data until you are approved.</p>
          </div>
        )}

        {/* WORKSPACE NAVIGATION TABS */}
        {user.role !== 'Pending' && (
          <div className="dashboard-navigation-tabs">
            <button 
              className={`tab-btn ${activeTab === 'main' ? 'active' : ''}`}
              onClick={() => setActiveTab('main')}
            >
              {user.role === 'Admin' ? (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  User Management
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="3" width="7" height="9" />
                    <rect x="14" y="3" width="7" height="5" />
                    <rect x="14" y="12" width="7" height="9" />
                    <rect x="3" y="16" width="7" height="5" />
                  </svg>
                  Permitted Fields
                </>
              )}
            </button>
            
            <button 
              className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
              Interactive Analytics
            </button>
          </div>
        )}

        {/* ADMIN USER WORKSPACE */}
        {user.role === 'Admin' && activeTab === 'main' && (
          <div className="admin-section animate-fade-in">
            <div className="section-header">
              <div>
                <h2>User Management</h2>
                <p>Manage user roles and permissions for the platform</p>
              </div>
              <div className="stats-card">
                <span className="stats-label">Total Users</span>
                <span className="stats-number">{allUsers.length}</span>
              </div>
            </div>

            <div className="users-table-container">
              {loading ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading users...</p>
                </div>
              ) : (
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allUsers.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="empty-state">
                          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                            <circle cx="9" cy="7" r="4" />
                            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                          </svg>
                          <p>No other users registered yet</p>
                        </td>
                      </tr>
                    ) : (
                      allUsers.map((u) => (
                        <tr key={u._id}>
                          <td>
                            <div className="user-cell">
                              <div className="user-avatar">
                                {u.name.charAt(0).toUpperCase()}
                              </div>
                              <span className="user-name-cell">{u.name}</span>
                            </div>
                          </td>
                          <td className="email-cell">{u.email}</td>
                          <td>
                            <div className={`role-badge role-${u.role.toLowerCase().replace(' ', '-')}`}>
                              {u.role}
                            </div>
                          </td>
                          <td>
                            <select 
                              value={u.role}
                              onChange={(e) => handleRoleChange(u._id, e.target.value)}
                              disabled={updatingUserId === u._id}
                              className="role-select"
                            >
                              <option value="Pending">Pending</option>
                              <option value="WELL Labs1">WELL Labs1</option>
                              <option value="WELL Labs2">WELL Labs2</option>
                              <option value="Consultant">Consultant</option>
                              <option value="GBA">GBA</option>
                              <option value="Donor">Donor</option>
                            </select>
                            {updatingUserId === u._id && <div className="inline-spinner"></div>}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* STANDARD USER WORKSPACE */}
        {user.role !== 'Admin' && user.role !== 'Pending' && activeTab === 'main' && (
          <div className="user-view-section animate-fade-in">
            <div className="section-header">
              <div>
                <h2>Project Data Dashboard</h2>
                <p>Viewing fields based on your role permissions: <strong>{user.role}</strong></p>
              </div>
              <div className="permission-summary">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="11" width="18" height="11" rx="2" strokeWidth="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeWidth="2"/>
                </svg>
                <span>{FIELD_PERMISSIONS[user.role]?.length || 0} fields accessible</span>
              </div>
            </div>

            <div className="fields-grid">
              {FIELD_PERMISSIONS[user.role]?.map((field, index) => (
                <div key={index} className="field-card">
                  <div className="field-header">
                    <div className="field-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" strokeWidth="1.5"/>
                        <polyline points="14 2 14 8 20 8" strokeWidth="1.5"/>
                      </svg>
                    </div>
                    <h3>{field}</h3>
                  </div>
                  <div className="field-value">
                    <span className="sample-badge">Sample Data</span>
                    <p>Example content for {field.toLowerCase()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INTERACTIVE ANALYTICS VIEW */}
        {user.role !== 'Pending' && activeTab === 'analytics' && (
          <div className="analytics-view-section animate-fade-in">
            <Analytics />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;