import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import api from '../config/api';

// Styling
import './Dashboard.css';

// Layout Components
import Header from '../components/layout/Header';
import PendingApproval from '../components/layout/PendingApproval';

// Tab Components
import BggIntroduction from '../components/dashboard/BggIntroduction';
import Analytics from './Analytics';
import CaseStudies from '../components/dashboard/CaseStudies';
import Interventions from '../components/dashboard/Interventions';
import FloodRiskMap from '../components/dashboard/FloodRiskMap';
import DataLayersView from '../components/dashboard/DataLayersView';
import NewProjectsView from '../components/dashboard/NewProjectsView';

// Export FIELD_PERMISSIONS to keep references intact
export const FIELD_PERMISSIONS = {
  'Admin': ['ALL_FIELDS'],
  'WELL Labs1': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'WELL Labs2': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'Consultant': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'GBA': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support'],
  'Donor': ['Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 'Donor Asset', 'Donor Support']
};

const Dashboard = () => {
  const { user, loading: authLoading, logout } = useContext(AuthContext);

  const SHOW_PLATFORM_TAB = true;
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  
  // Custom Workspace Tabs System driven by URL path name
  const { activeTab: urlActiveTab } = useParams();
  const navigate = useNavigate();
  const activeTab = urlActiveTab || 'home';
  
  // Shocking news linking state
  const [highlightedCaseTitle, setHighlightedCaseTitle] = useState(null);

  // Platform Permission Matrix Simulator State
  const [simulatedRole, setSimulatedRole] = useState(user?.role || 'WELL Labs1');

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
      const res = await api.get('/auth/users', {
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
      await api.put(`/auth/users/${userId}/role`, 
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

  const handleNavigateToCase = (title) => {
    setHighlightedCaseTitle(title);
    navigate('/casestudy');
  };

  if (authLoading) {
    return (
      <div className="dashboard-loading-wrapper" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading session...</p>
        </div>
      </div>
    );
  }

  // No longer redirecting unauthenticated users to login

  return (
    <div className="dashboard-wrapper">
      {/* 1. Header component */}
      <Header user={user} onLogout={logout} />

      <main className="dashboard-main">
        {/* PENDING VIEW */}
        {user?.role === 'Pending' && (
          <PendingApproval />
        )}

        {/* WORKSPACE NAVIGATION TABS */}
        {user?.role !== 'Pending' && activeTab !== 'interventions' && activeTab !== 'newprojects' && (
          <div className="dashboard-navigation-tabs">
            <button 
              className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => navigate('/home')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Home
            </button>

            <button 
              className={`tab-btn ${activeTab === 'casestudy' ? 'active' : ''}`}
              onClick={() => navigate('/casestudy')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Case Study
            </button>

            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="9" />
                <rect x="14" y="3" width="7" height="5" />
                <rect x="14" y="12" width="7" height="9" />
                <rect x="3" y="16" width="7" height="5" />
              </svg>
              Dashboard
            </button>

            {/* Admin Exclusive User Management */}
            {user?.role === 'Admin' && (
              <button 
                className={`tab-btn ${activeTab === 'usermanagement' ? 'active' : ''}`}
                onClick={() => navigate('/usermanagement')}
                style={{ marginLeft: 'auto', borderLeft: '1px solid #e2e8f0', paddingLeft: '20px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                User Management
              </button>
            )}
          </div>
        )}

        {/* 1. HOME VIEW */}
        {user?.role !== 'Pending' && activeTab === 'home' && (
          <BggIntroduction 
            onNavigateToCase={handleNavigateToCase} 
            onSetActiveTab={(tab) => navigate('/' + tab)} 
          />
        )}

        {/* 2. DASHBOARD VIEW (consists of DataLayersView as the main map interface) */}
        {user?.role !== 'Pending' && activeTab === 'dashboard' && (
          <DataLayersView />
        )}

        {/* 3. CASE STUDY VIEW */}
        {user?.role !== 'Pending' && activeTab === 'casestudy' && (
          <CaseStudies 
            highlightedCaseTitle={highlightedCaseTitle} 
            clearHighlight={() => setHighlightedCaseTitle(null)} 
          />
        )}

        {/* 4. INTERVENTIONS VIEW */}
        {user?.role !== 'Pending' && activeTab === 'interventions' && (
          <Interventions />
        )}

        {/* 5. NEW PROJECTS VIEW */}
        {user?.role !== 'Pending' && activeTab === 'newprojects' && (
          <NewProjectsView />
        )}

        {/* 8. ADMIN USER MANAGEMENT VIEW */}
        {user?.role === 'Admin' && activeTab === 'usermanagement' && (
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
      </main>
    </div>
  );
};

export default Dashboard;