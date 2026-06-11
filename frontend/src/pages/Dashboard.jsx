import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

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
  
  // Custom Workspace Tabs System (Route-based)
  const { activeTab: pathTab } = useParams();
  const activeTab = pathTab || 'home';
  const navigate = useNavigate();

  const setActiveTab = (tabName) => {
    navigate(`/${tabName}`);
  };
  
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
      const res = await axios.get('http://localhost:5000/api/auth/users');
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
      await axios.put(`http://localhost:5000/api/auth/users/${userId}/role`, 
        { role: newRole }
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
    setActiveTab('casestudy');
  };

  if (authLoading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner"></div>
        <p>Loading application session...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return (
    <div className="dashboard-wrapper">
      {/* 1. Header component */}
      <Header user={user} onLogout={logout} />

      <main className="dashboard-main">
        {/* PENDING VIEW */}
        {user.role === 'Pending' && (
          <PendingApproval />
        )}

        {/* WORKSPACE NAVIGATION TABS */}
        {user.role !== 'Pending' && (
          <div className="dashboard-navigation-tabs">
            <button 
              className={`tab-btn ${activeTab === 'home' ? 'active' : ''}`}
              onClick={() => setActiveTab('home')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Home
            </button>

            <button 
              className={`tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveTab('dashboard')}
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
              onClick={() => setActiveTab('casestudy')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              Case Study
            </button>

            <button 
              className={`tab-btn ${activeTab === 'interventions' ? 'active' : ''}`}
              onClick={() => setActiveTab('interventions')}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 8v4l3 3" />
                <circle cx="12" cy="12" r="10" />
              </svg>
              Interventions
            </button>

            <button 
              className={`tab-btn ${activeTab === 'floodriskmap' ? 'active' : ''}`}
              onClick={() => setActiveTab('floodriskmap')}
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
              onClick={() => setActiveTab('datalayers')}
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
                onClick={() => setActiveTab('platform')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Platform
              </button>
            )}

            {/* Admin Exclusive User Management */}
            {user.role === 'Admin' && (
              <button 
                className={`tab-btn ${activeTab === 'usermanagement' ? 'active' : ''}`}
                onClick={() => setActiveTab('usermanagement')}
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
        {user.role !== 'Pending' && activeTab === 'home' && (
          <BggIntroduction 
            onNavigateToCase={handleNavigateToCase} 
            onSetActiveTab={setActiveTab} 
          />
        )}

        {/* 2. DASHBOARD VIEW (Analytics Component) */}
        {user.role !== 'Pending' && activeTab === 'dashboard' && (
          <div className="analytics-view-section animate-fade-in">
            <Analytics />
          </div>
        )}

        {/* 3. CASE STUDY VIEW */}
        {user.role !== 'Pending' && activeTab === 'casestudy' && (
          <CaseStudies 
            highlightedCaseTitle={highlightedCaseTitle} 
            clearHighlight={() => setHighlightedCaseTitle(null)} 
          />
        )}

        {/* 4. INTERVENTIONS VIEW */}
        {user.role !== 'Pending' && activeTab === 'interventions' && (
          <Interventions />
        )}

        {/* 5. FLOOD RISK MAP VIEW */}
        {user.role !== 'Pending' && activeTab === 'floodriskmap' && (
          <FloodRiskMap />
        )}

        {/* 6. DATA LAYERS VIEW */}
        {user.role !== 'Pending' && activeTab === 'datalayers' && (
          <div className="data-layers-section animate-fade-in">
            <div className="data-layers-header-row">
              <div>
                <h2>Google Earth Engine (GEE) Applications</h2>
                <p className="tab-description-subtitle">Access live GIS satellite maps and spatial telemetry dashboards compiled by WELL Labs.</p>
              </div>
            </div>

            <div className="gee-links-portal-grid">
              {[
                {
                  name: "Urban Water Explorer",
                  url: "https://gcp-welllabs.projects.earthengine.app/view/urban-water",
                  desc: "Analyze municipal water stress indices, surface runoff risks, and active lake restoration monitoring datasets across urban watersheds.",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 21h18M3 10h18M5 10V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v5M10 21V16a2 2 0 0 1 4 0v5" />
                    </svg>
                  ),
                  badge: "URBAN METRICS",
                  colorTheme: "blue"
                },
                {
                  name: "Solutions Explorer Map",
                  url: "https://gcp-welllabs.projects.earthengine.app/view/solutionsexplorer",
                  desc: "Unified interactive spatial viewer illustrating localized recharge wells, parklands, geological corridors, and citizen science telemetry.",
                  icon: (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                  ),
                  badge: "CORE EXPLORER",
                  colorTheme: "indigo"
                }
              ].map((app, index) => (
                <div key={index} className={`gee-portal-card glassmorphic theme-${app.colorTheme}`}>
                  <div className="gee-card-top">
                    <span className="gee-portal-badge">{app.badge}</span>
                    <div className="gee-portal-icon">{app.icon}</div>
                  </div>
                  <h3>{app.name}</h3>
                  <p className="gee-portal-desc">{app.desc}</p>
                  <div className="gee-portal-url-box">
                    <span className="gee-url-label">APP URL</span>
                    <code className="gee-url-text">{app.url}</code>
                  </div>
                  <a 
                    href={app.url} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="gee-launch-btn"
                  >
                    Launch GEE Application
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '8px' }}>
                      <line x1="7" y1="17" x2="17" y2="7" />
                      <polyline points="7 7 17 7 17 17" />
                    </svg>
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 7. PLATFORM VIEW */}
        {SHOW_PLATFORM_TAB && user.role !== 'Pending' && activeTab === 'platform' && (
          <div className="platform-section animate-fade-in">
            <div className="platform-hero glassmorphic">
              <h3>Solution Explorer Security & Architecture</h3>
              <p>
                The platform utilizes a secure JWT-token based permission gateway to enforce strict role-based access control (RBAC). 
                Project data contains 19 highly confidential columns ranging from budget figures, DPR documents, and stakeholder IDs to physical attributes.
              </p>
            </div>

            {/* Architectural Flow Graphic */}
            <div className="pipeline-visual-header">JWT Field-Level Authorization Pipeline</div>
            <div className="pipeline-visual">
              <div className="pipeline-node">
                <strong>React App</strong>
                <span>Sends Authorization Header</span>
              </div>
              <div className="pipeline-arrow">➔</div>
              <div className="pipeline-node">
                <strong>JWT Middleware</strong>
                <span>Decodes token & role specs</span>
              </div>
              <div className="pipeline-arrow">➔</div>
              <div className="pipeline-node">
                <strong>Mongo Lock</strong>
                <span>Retrieves database record</span>
              </div>
              <div className="pipeline-arrow">➔</div>
              <div className="pipeline-node">
                <strong>Security Filter</strong>
                <span>Filters keys against FIELD_PERMISSIONS</span>
              </div>
              <div className="pipeline-arrow">➔</div>
              <div className="pipeline-node">
                <strong>Client Render</strong>
                <span>Strict field layout loading</span>
              </div>
            </div>

            {/* Dynamic Permission Simulator Matrix */}
            <div className="permission-simulator-container glassmorphic">
              <div className="simulator-header">
                <div>
                  <h4>Interactive Permission Matrix Simulator</h4>
                  <p>Select different user roles to dynamically simulate and visualize field-level locks and permitted values.</p>
                </div>

                <div className="simulator-role-picker">
                  {['WELL Labs1', 'Consultant', 'GBA', 'Donor', 'Admin'].map((role) => (
                    <button 
                      key={role}
                      className={`sim-role-btn ${simulatedRole === role ? 'active' : ''}`}
                      onClick={() => setSimulatedRole(role)}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              <div className="simulator-body">
                <div className="sim-role-specs">
                  💡 Currently simulating: <strong>{simulatedRole} Profile</strong>
                  <span className="sim-spec-badge">
                    {simulatedRole === 'Admin' ? 'All' : '19'} Columns Authorized
                  </span>
                </div>

                <div className="simulator-fields-grid">
                  {[
                    'Name of the Project', 'Location', 'Ward No', 'GBA Corporation', 
                    'Surface Area', 'Implementation Start Date', 'Implementation Completion Date', 
                    'Proposed By', 'Proposal Date', 'Other Stakeholders', 'Project Assets', 
                    'Project Consultant', 'DPR', 'Diagrams', 'Cost', 'Impact', 'Donor Name', 
                    'Donor Asset', 'Donor Support'
                  ].map((field, fIdx) => {
                    // Check permission
                    const isPermitted = simulatedRole === 'Admin' || FIELD_PERMISSIONS[simulatedRole]?.includes(field);
                    
                    return (
                      <div key={fIdx} className={`sim-field-row ${isPermitted ? 'permitted' : 'restricted'}`}>
                        <div className="sim-field-meta">
                          <span className="sim-lock-icon">{isPermitted ? '🔓' : '🔒'}</span>
                          <strong className="sim-field-name">{field}</strong>
                        </div>
                        <div className="sim-field-value-preview">
                          {isPermitted ? (
                            <span className="preview-text">Example permitted content for {field.toLowerCase()}...</span>
                          ) : (
                            <span className="preview-blurred">RESTRICTED_FIELD_ACCESS_DENIED_PROTECTED</span>
                          )}
                        </div>
                        <span className={`sim-status-tag ${isPermitted ? 'yes' : 'no'}`}>
                          {isPermitted ? 'PERMITTED' : 'HIDDEN'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8. ADMIN USER MANAGEMENT VIEW */}
        {user.role === 'Admin' && activeTab === 'usermanagement' && (
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