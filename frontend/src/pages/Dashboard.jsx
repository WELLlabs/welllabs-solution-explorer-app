import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import api from '../config/api';
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

  // Set this to true to unhide the Platform tab in the future
  const SHOW_PLATFORM_TAB = false;
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  
  // Custom Workspace Tabs System
  const [activeTab, setActiveTab] = useState('home'); // 'home', 'dashboard', 'casestudy', 'datalayers', 'platform', 'usermanagement'
  


  // Case Study States
  const [activeCaseFilter, setActiveCaseFilter] = useState('all'); // 'all', 'lake', 'well', 'wetland'
  const [activeVideoUrl, setActiveVideoUrl] = useState(null); // String of video Title if modal is open

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



  if (!user) {
    return <Navigate to="/login" />;
  }

  // --- Hydrology Case Studies Dataset ---
  const CASE_STUDIES = [
    {
      title: "Somasundarapalya Lake Rejuvenation",
      type: "lake",
      tags: ["Wetland", "Lake Rejuvenation", "Shallow Aquifer"],
      summary: "Restoration of a highly degraded urban lake in Bangalore South. Implemented an active constructed wetland filter to process municipal runoff, raising local ground water table by 2.4 meters over 18 months.",
      videoMockTitle: "Constructed Wetland Hydrology - Somasundarapalya Lake",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Premium Mock URL
      pdfLink: "#",
      stats: { area: "16 Acres", rechargeRate: "1.2 MLD", localWells: "48 Wells" }
    },
    {
      title: "Jakkur Lake Wetland Co-Management",
      type: "wetland",
      tags: ["Wetland", "Sewage Treatment", "Community Model"],
      summary: "A world-renowned case of integrating community action with science. The co-management model routes treated sewage through natural wetlands before entering the main body, ensuring stable lake health and recharging open wells.",
      videoMockTitle: "Jakkur Lake Ecological Co-Management Case Study Document",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      pdfLink: "#",
      stats: { area: "160 Acres", rechargeRate: "8.5 MLD", localWells: "120 Wells" }
    },
    {
      title: "Cubbon Park Shallow Aquifer Corridor",
      type: "well",
      tags: ["Well Recharge", "Heritage Wells", "Rainwater Harvesting"],
      summary: "Reactivating historic heritage open wells across Cubbon Park. Working with traditional well-diggers (Mannu Vaddars), we constructed shallow recharge shafts that divert millions of liters of storm runoff into aquifers annually.",
      videoMockTitle: "Cubbon Park Groundwater Corridor Re-charge Operation",
      videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
      pdfLink: "#",
      stats: { area: "300 Acres", rechargeRate: "3.8 MLD", localWells: "7 Heritage Wells" }
    }
  ];

  // --- Earth Engine Simulated Datasets by Zone ---
  const ZONE_DETAILS = {
    'Mahadevapura': {
      projects: 14,
      wells: 104,
      runoffCo: '0.78 (High Risk)',
      depth: '38m (Moderate)',
      soilMoisture: '28% (Dry)',
      geeCode: `// GEE Script: Mahadevapura Runoff & Soil Saturation
var region = ee.FeatureCollection('FAO/GAUL/2015/level2')
  .filter(ee.Filter.eq('ADM2_NAME', 'Bangalore'));
var s2 = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterBounds(region)
  .filterDate('2026-01-01', '2026-05-01');
var ndvi = s2.median().normalizedDifference(['B8', 'B4']);
Map.addLayer(ndvi.clip(region), {min: 0, max: 0.8, palette: ['brown', 'yellow', 'green']}, 'NDVI');`
    },
    'Yelahanka': {
      projects: 9,
      wells: 72,
      runoffCo: '0.45 (Moderate)',
      depth: '22m (Healthy)',
      soilMoisture: '42% (Optimal)',
      geeCode: `// GEE Script: Yelahanka Recharge Saturation Analysis
var grace = ee.ImageCollection('NASA/GRACE/MASS_GRID/LAND')
  .filterDate('2025-01-01', '2026-01-01').median();
var lwe = grace.select('lwe_thickness_csr');
Map.addLayer(lwe, {min: -15, max: 15, palette: ['red', 'white', 'blue']}, 'GRACE LWE');`
    },
    'Bommanahalli': {
      projects: 11,
      wells: 95,
      runoffCo: '0.86 (Critical)',
      depth: '54m (Critical Depletion)',
      soilMoisture: '18% (Arid)',
      geeCode: `// GEE Script: Bommanahalli Aquifer Drawdown Analysis
var smap = ee.ImageCollection('NASA_USDA/HSL/SMAP10KM_soil_moisture')
  .filterDate('2026-03-01', '2026-05-01').median();
var ssm = smap.select('ssm');
Map.addLayer(ssm, {min: 0, max: 25, palette: ['orange', 'yellow', 'cyan']}, 'Soil Moisture');`
    },
    'RR Nagar': {
      projects: 8,
      wells: 63,
      runoffCo: '0.52 (Moderate)',
      depth: '30m (Stable)',
      soilMoisture: '36% (Stable)',
      geeCode: `// GEE Script: Rajarajeshwari Nagar Hydrology Map
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(region).filter(ee.Filter.eq('instrumentMode', 'IW'));
Map.addLayer(s1.median(), {min: -25, max: 0}, 'Radar Backscatter');`
    }
  };

  // --- Dynamic Map Simulation Color Helpers ---
  const getMapOverlayColor = (zoneName) => {
    if (geeLayer === 'groundwater') {
      // Saturation - Blue gradient
      if (zoneName === 'Yelahanka') return 'rgba(59, 130, 246, 0.75)'; // Healthy
      if (zoneName === 'RR Nagar') return 'rgba(59, 130, 246, 0.55)'; // Stable
      if (zoneName === 'Mahadevapura') return 'rgba(59, 130, 246, 0.4)'; // Modest
      return 'rgba(239, 68, 68, 0.6)'; // Critical Red (Bommanahalli)
    } else if (geeLayer === 'runoff') {
      // Runoff Risk - Orange/Red gradient
      if (zoneName === 'Bommanahalli') return 'rgba(239, 68, 68, 0.75)'; // Critical
      if (zoneName === 'Mahadevapura') return 'rgba(249, 115, 22, 0.7)'; // High
      if (zoneName === 'RR Nagar') return 'rgba(249, 115, 22, 0.45)'; // Moderate
      return 'rgba(16, 185, 129, 0.5)'; // Low Risk Green (Yelahanka)
    } else {
      // Soil Moisture - Emerald/Green gradient
      if (zoneName === 'Yelahanka') return 'rgba(16, 185, 129, 0.75)'; // Optimal
      if (zoneName === 'RR Nagar') return 'rgba(16, 185, 129, 0.55)'; // Stable
      if (zoneName === 'Mahadevapura') return 'rgba(234, 179, 8, 0.5)'; // Dry Yellow
      return 'rgba(239, 68, 68, 0.6)'; // Arid Red (Bommanahalli)
    }
  };

  return (
    <div className="dashboard-wrapper">
      {/* Dynamic Navigation Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="logo-section">
            <div className="logo-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <h1 className="logo-text">Solution Explorer</h1>
              <p className="logo-subtitle">WELL Labs & Citizen Hydrology Hub</p>
            </div>
          </div>
          
          <div className="user-section">
            <div className="user-info">
              <span className="user-greeting">Logged in as:</span>
              <strong className="user-name">{user.name}</strong>
              <div className={`role-badge role-${user.role.toLowerCase().replace(' ', '-')}`}>
                {user.role}
              </div>
            </div>
            <button onClick={logout} className="logout-button">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4l3 3" />
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
          <div className="home-section animate-fade-in">
            {/* Hero Section */}
            <div className="home-hero-card glassmorphic">
              <div className="hero-content-inner">
                <span className="hero-super-title">Citizen Science & Action</span>
                <h2>Empowering Water Resilience across Bangalore</h2>
                <p>
                  Solution Explorer bridges state-of-the-art hydrological research with urban planning and community-led restoration. Together, we analyze water stress, recharge shallow aquifers, and restore our lakes.
                </p>
                <div className="hero-cta-buttons">
                  <button className="primary-cta-btn" onClick={() => setActiveTab('dashboard')}>
                    Explore Hydrology Dashboard
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: '8px' }}>
                      <line x1="5" y1="12" x2="19" y2="12" strokeLinecap="round" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </button>
                  <button className="secondary-cta-btn" onClick={() => setActiveTab('datalayers')}>
                    View GIS Satellite Layers
                  </button>
                </div>
              </div>
              <div className="hero-graphic">
                {/* SVG Water Cycle Illustration */}
                <svg viewBox="0 0 200 200" className="floating-svg">
                  <defs>
                    <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#f8fafc" />
                      <stop offset="100%" stopColor="#94a3b8" />
                    </linearGradient>
                    <linearGradient id="waterGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#4f46e5" />
                    </linearGradient>
                  </defs>
                  {/* Aquifers */}
                  <rect x="20" y="140" width="160" height="40" rx="10" fill="url(#waterGrad)" opacity="0.15" />
                  <path d="M20 150 Q 50 145, 100 155 T 180 150" stroke="#6366f1" strokeWidth="2" fill="none" strokeDasharray="4 4" />
                  {/* Rain drops */}
                  <circle cx="80" cy="80" r="2" fill="#3b82f6" opacity="0.7" />
                  <circle cx="100" cy="90" r="2" fill="#3b82f6" opacity="0.7" />
                  <circle cx="120" cy="85" r="2" fill="#3b82f6" opacity="0.7" />
                  <circle cx="90" cy="105" r="2" fill="#3b82f6" opacity="0.7" />
                  <circle cx="110" cy="110" r="2" fill="#3b82f6" opacity="0.7" />
                  {/* Cloud */}
                  <path d="M120 70 a 20 20 0 0 0 -30 -10 a 25 25 0 0 0 -40 10 a 20 20 0 0 0 5 40 h 65 a 20 20 0 0 0 0 -40 z" fill="url(#cloudGrad)" />
                  {/* Infiltration Arrow */}
                  <path d="M100 120 L 100 145" stroke="#10b981" strokeWidth="3" fill="none" strokeLinecap="round"/>
                  <polyline points="95 138 100 145 105 138" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" />
                  <text x="100" y="170" textAnchor="middle" fill="#4f46e5" fontSize="10" fontWeight="bold">RECHARGE AQUIFER</text>
                </svg>
              </div>
            </div>

            {/* Split Story Board Section */}
            <div className="home-grid">
              <div className="about-card solution-explorer-about glassmorphic">
                <div className="about-header-icon blue">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="2" y1="12" x2="22" y2="12" />
                    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                  </svg>
                </div>
                <h3>About Solution Explorer</h3>
                <p>
                  The Solution Explorer is a state-of-the-art GIS and data platform designed to catalog municipal assets, rainfall metrics, and ground-water wellness.
                </p>
                <ul className="about-bullets">
                  <li>
                    <strong>Granular Asset Cataloging:</strong> Monitors groundwater levels, open wells, and lake assets across municipal zones.
                  </li>
                  <li>
                    <strong>Spatial Analysis:</strong> Integrates remote sensing layers and Google Earth Engine models for runoff and infiltration.
                  </li>
                  <li>
                    <strong>Role-Based Insight Portal:</strong> Delivers secure data profiles tailored to consultants, municipal commissioners, and civic organizations.
                  </li>
                </ul>
              </div>

              <div className="about-card welllabs-about glassmorphic">
                <div className="about-header-icon emerald">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </div>
                <h3>About WELL Labs</h3>
                <p>
                  Water, Environment, Land and Livelihoods Labs (WELL Labs) is a premier research institute dedicated to co-creating sustainable solutions for land and water management.
                </p>
                <div className="welllabs-stats-grid">
                  <div className="w-stat-card">
                    <strong>15+</strong>
                    <span>Lakes Restored</span>
                  </div>
                  <div className="w-stat-card">
                    <strong>1,200+</strong>
                    <span>Recharge Wells</span>
                  </div>
                  <div className="w-stat-card">
                    <strong>45+</strong>
                    <span>Institutional Allies</span>
                  </div>
                </div>
                <p className="welllabs-text-small">
                  We collaborate with government bodies (like the GBA), civic groups, and local research partners to compile field observations and translate satellite models into real urban hydrology intervention protocols.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* 2. DASHBOARD VIEW (Analytics Component) */}
        {user.role !== 'Pending' && activeTab === 'dashboard' && (
          <div className="analytics-view-section animate-fade-in">
            <Analytics />
          </div>
        )}

        {/* 3. CASE STUDY VIEW */}
        {user.role !== 'Pending' && activeTab === 'casestudy' && (
          <div className="case-studies-section animate-fade-in">
            <div className="section-header-compact">
              <h2>Hydrological Restoration Case Studies</h2>
              <p>Review real-world applications of wetland management, shallow aquifer recharges, and citizen hydrology across Bangalore.</p>
              
              {/* Category Filter Pills */}
              <div className="case-filter-group">
                <button className={`filter-pill ${activeCaseFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveCaseFilter('all')}>All</button>
                <button className={`filter-pill ${activeCaseFilter === 'lake' ? 'active' : ''}`} onClick={() => setActiveCaseFilter('lake')}>Lake Restoration</button>
                <button className={`filter-pill ${activeCaseFilter === 'wetland' ? 'active' : ''}`} onClick={() => setActiveCaseFilter('wetland')}>Constructed Wetlands</button>
                <button className={`filter-pill ${activeCaseFilter === 'well' ? 'active' : ''}`} onClick={() => setActiveCaseFilter('well')}>Well Recharge</button>
              </div>
            </div>

            <div className="case-studies-grid">
              {CASE_STUDIES.filter(cs => activeCaseFilter === 'all' || cs.type === activeCaseFilter).map((cs, idx) => (
                <div key={idx} className="case-study-card glassmorphic">
                  <div className="case-card-header">
                    <span className={`case-type-badge ${cs.type}`}>{cs.type.toUpperCase()}</span>
                    <h3>{cs.title}</h3>
                  </div>
                  <p className="case-summary">{cs.summary}</p>
                  
                  <div className="case-stats-panel">
                    <div className="c-stat">
                      <span className="c-label">Impact Zone:</span>
                      <strong className="c-val">{cs.stats.area}</strong>
                    </div>
                    <div className="c-stat">
                      <span className="c-label">Recharge Rate:</span>
                      <strong className="c-val">{cs.stats.rechargeRate}</strong>
                    </div>
                    <div className="c-stat">
                      <span className="c-label">Telemetry Nodes:</span>
                      <strong className="c-val">{cs.stats.localWells}</strong>
                    </div>
                  </div>

                  <div className="case-tags-panel">
                    {cs.tags.map((tag, tIdx) => (
                      <span key={tIdx} className="case-tag">#{tag}</span>
                    ))}
                  </div>

                  <div className="case-actions">
                    <button className="play-video-btn" onClick={() => setActiveVideoUrl(cs.videoMockTitle)}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polygon points="5 3 19 12 5 21 5 3" fill="currentColor"/>
                      </svg>
                      Watch Case Video
                    </button>
                    <a href={cs.pdfLink} className="brief-download-btn" onClick={(e) => { e.preventDefault(); alert(`Technical brief for "${cs.title}" requested. Starting PDF download sequence.`); }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Technical Brief (PDF)
                    </a>
                  </div>
                </div>
              ))}
            </div>

            {/* Video Modal Player */}
            {activeVideoUrl && (
              <div className="video-modal-overlay animate-fade-in">
                <div className="video-modal-card glassmorphic">
                  <div className="v-modal-header">
                    <h4>{activeVideoUrl}</h4>
                    <button className="close-modal-btn" onClick={() => setActiveVideoUrl(null)}>
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  </div>
                  <div className="video-player-container">
                    <div className="simulated-player-backdrop">
                      <div className="v-spinner"></div>
                      <span className="v-loading-text">Buffering Satellite Imagery & Site Footage...</span>
                      {/* Controls Bar Mock */}
                      <div className="simulated-controls">
                        <div className="c-play-btn">❚❚</div>
                        <div className="c-progress-track">
                          <div className="c-progress-fill" style={{ width: '42%' }}></div>
                        </div>
                        <span className="c-time">02:14 / 05:30</span>
                        <span className="c-hd-badge">LIVE 1080P</span>
                      </div>
                    </div>
                  </div>
                  <div className="v-modal-footer">
                    <p>💡 <em>This simulated video documentation uses multi-temporal drone maps, groundwater level timeseries, and interviews with community stewards to document ecological restoration impacts.</em></p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. DATA LAYERS VIEW */}
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

        {/* 5. PLATFORM VIEW */}
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
                    {simulatedRole === 'Admin' ? 'All' : (simulatedRole === 'WELL Labs1' || simulatedRole === 'WELL Labs2' || simulatedRole === 'Consultant' || simulatedRole === 'GBA' || simulatedRole === 'Donor') ? '19' : '0'} Columns Authorized
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

        {/* 6. ADMIN USER MANAGEMENT VIEW */}
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