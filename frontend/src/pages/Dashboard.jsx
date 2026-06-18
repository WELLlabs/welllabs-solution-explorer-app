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
        {user?.role !== 'Pending' && (
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
              className={`tab-btn ${activeTab === 'interventions' ? 'active' : ''}`}
              onClick={() => navigate('/interventions')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Interventions
            </button>

            <button 
              className={`tab-btn ${activeTab === 'floodriskmap' ? 'active' : ''}`}
              onClick={() => navigate('/floodriskmap')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                <line x1="8" y1="2" x2="8" y2="18" />
                <line x1="16" y1="6" x2="16" y2="22" />
              </svg>
              Flood Risk Map
            </button>

            <button 
              className={`tab-btn ${activeTab === 'datalayers' ? 'active' : ''}`}
              onClick={() => navigate('/datalayers')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 2 7 12 12 22 7 12 2" />
                <polyline points="2 17 12 22 22 17" />
                <polyline points="2 12 12 17 22 12" />
              </svg>
              Data Layers
            </button>

            {SHOW_PLATFORM_TAB && (
              <button 
                className={`tab-btn ${activeTab === 'platform' ? 'active' : ''}`}
                onClick={() => navigate('/platform')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Platform
              </button>
            )}

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

        {/* 2. DASHBOARD VIEW (Analytics Component) */}
        {user?.role !== 'Pending' && activeTab === 'dashboard' && (
          <div className="analytics-view-section animate-fade-in">
            <Analytics />
          </div>
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

        {/* 5. FLOOD RISK MAP VIEW */}
        {user?.role !== 'Pending' && activeTab === 'floodriskmap' && (
          <FloodRiskMap />
        )}

        {/* 6. DATA LAYERS VIEW */}
        {user?.role !== 'Pending' && activeTab === 'datalayers' && (
          <DataLayersView />
        )}

        {/* 7. PLATFORM VIEW */}
        {SHOW_PLATFORM_TAB && user?.role !== 'Pending' && activeTab === 'platform' && (
          <div className="platform-section animate-fade-in">
            <div className="platform-projects-container">
              <div className="projects-grid">
                {/* Row 1: 3 Visible Projects */}
                <div className="project-card animate-fade-in">
                  <div className="project-card-header">
                    <h4 className="project-card-title">Project 1</h4>
                  </div>
                  <div className="project-card-body"></div>
                </div>
                <div className="project-card animate-fade-in">
                  <div className="project-card-header">
                    <h4 className="project-card-title">Project 2</h4>
                  </div>
                  <div className="project-card-body"></div>
                </div>
                <div className="project-card animate-fade-in">
                  <div className="project-card-header">
                    <h4 className="project-card-title">Project 3</h4>
                  </div>
                  <div className="project-card-body"></div>
                </div>

                {/* Row 2: 3 Blurred or Visible Projects depending on auth */}
                <div className={`project-card animate-fade-in ${!user ? 'blurred-card' : ''}`}>
                  <div className="project-card-header">
                    <h4 className="project-card-title">Project 4</h4>
                  </div>
                  <div className="project-card-body"></div>
                </div>
                <div className={`project-card animate-fade-in ${!user ? 'blurred-card' : ''}`}>
                  <div className="project-card-header">
                    <h4 className="project-card-title">Project 5</h4>
                  </div>
                  <div className="project-card-body"></div>
                </div>
                <div className={`project-card animate-fade-in ${!user ? 'blurred-card' : ''}`}>
                  <div className="project-card-header">
                    <h4 className="project-card-title">Project 6</h4>
                  </div>
                  <div className="project-card-body"></div>
                </div>
              </div>

              {/* Login Wall UI */}
              {!user ? (
                <div className="login-overlay-box glassmorphic">
                  <p>
                    You are viewing the public version of Solution Explorer. 
                    Please login to unlock and view details for all projects.
                  </p>
                  <button 
                    onClick={() => navigate('/login')} 
                    className="login-redirect-button"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                      <polyline points="10 17 15 12 10 7" />
                      <line x1="15" y1="12" x2="3" y2="12" />
                    </svg>
                    Login to Unlock More Projects
                  </button>
                </div>
              ) : (
                <div className="unlocked-badge">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  All Projects Unlocked
                </div>
              )}
            </div>
          </div>
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