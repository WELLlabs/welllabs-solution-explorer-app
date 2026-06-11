import React, { useState, useEffect } from 'react';
import api from '../config/api';
import './Analytics.css';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [overview, setOverview] = useState(null);
  const [corporationData, setCorporationData] = useState([]);
  const [wardData, setWardData] = useState([]);
  
  // Interactive States
  const [activeChartMetric, setActiveChartMetric] = useState('both'); // 'both', 'projects', 'wells'
  const [wardSearch, setWardSearch] = useState('');
  const [hoveredBar, setHoveredBar] = useState(null); // { type, index, value }
  const [hoveredSlice, setHoveredSlice] = useState(null);

  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);
        const apiBase = 'http://localhost:5000/api/analytics';

        // Fetch all three endpoints in parallel
        const [overviewRes, corpRes, wardRes] = await Promise.all([
          axios.get(`${apiBase}/overview`),
          axios.get(`${apiBase}/corporation`),
          axios.get(`${apiBase}/ward`)
        ]);

        setOverview(overviewRes.data);
        setCorporationData(corpRes.data);
        setWardData(wardRes.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load dashboard metrics. Ensure the backend server is running.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalyticsData();
  }, []);

  if (loading) {
    return (
      <div className="analytics-loading animate-pulse">
        <div className="analytics-spinner"></div>
        <p>Analyzing and aggregating hydrological data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analytics-error">
        <div className="error-icon">⚠️</div>
        <h3>Analysis Offline</h3>
        <p>{error}</p>
      </div>
    );
  }

  // --- Calculations for Donut Charts ---
  // Status breakdown
  const statusColors = {
    active: '#3b82f6',
    completed: '#10b981',
    ongoing: '#f59e0b',
    unknown: '#6b7280'
  };

  const projectStatusData = overview?.projectStatusBreakdown || [];
  const totalProjCount = projectStatusData.reduce((acc, curr) => acc + curr.count, 0) || 1;

  // Well types breakdown
  const wellTypeColors = {
    'open well': '#06b6d4',
    'recharge well': '#10b981',
    'filter borewell': '#f59e0b',
    'open and recharge well': '#6366f1',
    'borewell': '#ec4899',
    'unknown': '#94a3b8'
  };

  const wellTypeData = overview?.wellTypeBreakdown || [];
  const totalWellCount = wellTypeData.reduce((acc, curr) => acc + curr.count, 0) || 1;

  // --- SVG Donut Helper ---
  const renderDonutChart = (data, total, colors, hoverKey) => {
    let accumulatedPercent = 0;
    const radius = 50;
    const strokeWidth = 14;
    const circumference = 2 * Math.PI * radius;

    return (
      <div className="donut-chart-wrapper">
        <svg viewBox="0 0 140 140" className="donut-svg">
          <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#1e293b" strokeWidth={strokeWidth} />
          {data.map((item, idx) => {
            const key = item.status || item.type || 'unknown';
            const val = item.count;
            const percent = val / total;
            const strokeLength = percent * circumference;
            const strokeOffset = circumference - strokeLength + (accumulatedPercent * circumference);
            accumulatedPercent -= percent;
            
            const color = colors[key.toLowerCase()] || colors['unknown'];
            const isHovered = hoveredSlice === `${hoverKey}-${idx}`;

            return (
              <circle
                key={idx}
                cx="70"
                cy="70"
                r={radius}
                fill="transparent"
                stroke={color}
                strokeWidth={isHovered ? strokeWidth + 3 : strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                transform="rotate(-90 70 70)"
                className="donut-segment"
                onMouseEnter={() => setHoveredSlice(`${hoverKey}-${idx}`)}
                onMouseLeave={() => setHoveredSlice(null)}
                style={{
                  transition: 'all 0.3s ease',
                  cursor: 'pointer',
                  filter: isHovered ? `drop-shadow(0 0 8px ${color})` : 'none'
                }}
              />
            );
          })}
          <g className="donut-center-text">
            <text x="70" y="68" textAnchor="middle" className="donut-num">
              {total}
            </text>
            <text x="70" y="85" textAnchor="middle" className="donut-lbl">
              TOTAL
            </text>
          </g>
        </svg>

        <div className="donut-legend">
          {data.map((item, idx) => {
            const key = item.status || item.type || 'unknown';
            const val = item.count;
            const percentage = ((val / total) * 100).toFixed(1);
            const color = colors[key.toLowerCase()] || colors['unknown'];
            const isHovered = hoveredSlice === `${hoverKey}-${idx}`;

            return (
              <div 
                key={idx} 
                className={`legend-item ${isHovered ? 'active' : ''}`}
                onMouseEnter={() => setHoveredSlice(`${hoverKey}-${idx}`)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <span className="legend-dot" style={{ backgroundColor: color }}></span>
                <span className="legend-name">{key.toUpperCase()}</span>
                <span className="legend-val">{val} ({percentage}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // --- Filtering & Sorting Wards ---
  const filteredWards = wardData.filter(ward => 
    ward.wardName.toLowerCase().includes(wardSearch.toLowerCase())
  ).sort((a, b) => (b.projectsCount + b.wellsCount) - (a.projectsCount + a.wellsCount));

  // Find max value in corporation data for scaling bar charts
  const maxCorpVal = Math.max(
    ...corporationData.map(c => Math.max(c.projectsCount, c.wellsCount)),
    10
  );

  return (
    <div className="custom-analytics-container">
      {/* 1. TOP STATS CARDS */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card glassmorphic glow-blue">
          <div className="kpi-icon-wrapper blue">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L17.5 14.8" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Rainwater & Lake Projects</span>
            <h3 className="kpi-value">{overview?.totalProjects || 0}</h3>
            <span className="kpi-subtext">Mapped assets in Bangalore</span>
          </div>
        </div>

        <div className="kpi-card glassmorphic glow-emerald">
          <div className="kpi-icon-wrapper emerald">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Monitored Ground Wells</span>
            <h3 className="kpi-value">{overview?.totalWells || 0}</h3>
            <span className="kpi-subtext">Active telemetry and surveys</span>
          </div>
        </div>

        <div className="kpi-card glassmorphic glow-purple">
          <div className="kpi-icon-wrapper purple">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div className="kpi-info">
            <span className="kpi-label">Active GBA Regions</span>
            <h3 className="kpi-value">{corporationData.length}</h3>
            <span className="kpi-subtext">Zones with project clusters</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN CHARTS GRID */}
      <div className="charts-main-layout">
        
        {/* LEFT COLUMN: GBA CORPORATION BAR CHART */}
        <div className="chart-card glassmorphic corporation-chart-card">
          <div className="chart-card-header">
            <div>
              <h3>Hydrological Assets by GBA Region</h3>
              <p>Comparing projects and wells across regional corporations</p>
            </div>
            <div className="metric-toggle-group">
              <button 
                className={`toggle-btn ${activeChartMetric === 'both' ? 'active' : ''}`}
                onClick={() => setActiveChartMetric('both')}
              >
                Both
              </button>
              <button 
                className={`toggle-btn ${activeChartMetric === 'projects' ? 'active' : ''}`}
                onClick={() => setActiveChartMetric('projects')}
              >
                Projects
              </button>
              <button 
                className={`toggle-btn ${activeChartMetric === 'wells' ? 'active' : ''}`}
                onClick={() => setActiveChartMetric('wells')}
              >
                Wells
              </button>
            </div>
          </div>

          <div className="bar-chart-body">
            {corporationData.map((corp, index) => {
              const projWidth = `${(corp.projectsCount / maxCorpVal) * 85}%`;
              const wellWidth = `${(corp.wellsCount / maxCorpVal) * 85}%`;

              return (
                <div key={index} className="bar-row">
                  <div className="bar-label">{corp.corporation}</div>
                  <div className="bar-track-wrapper">
                    {/* Projects Bar */}
                    {(activeChartMetric === 'both' || activeChartMetric === 'projects') && (
                      <div className="bar-container">
                        <div 
                          className="bar bar-project" 
                          style={{ width: projWidth }}
                          onMouseEnter={() => setHoveredBar({ type: 'projects', index, val: corp.projectsCount })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <span className="bar-val-popup">{corp.projectsCount}</span>
                        </div>
                      </div>
                    )}

                    {/* Wells Bar */}
                    {(activeChartMetric === 'both' || activeChartMetric === 'wells') && (
                      <div className="bar-container">
                        <div 
                          className="bar bar-well" 
                          style={{ width: wellWidth }}
                          onMouseEnter={() => setHoveredBar({ type: 'wells', index, val: corp.wellsCount })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <span className="bar-val-popup">{corp.wellsCount}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* X-Axis Scale Indicator */}
            <div className="chart-scale-line">
              <div className="scale-lbl">0</div>
              <div className="scale-lbl">25%</div>
              <div className="scale-lbl">50%</div>
              <div className="scale-lbl">75%</div>
              <div className="scale-lbl">100%</div>
            </div>
            
            {/* Tooltip display */}
            <div className="bar-tooltip-zone">
              {hoveredBar ? (
                <div className="active-tooltip animate-fade-in">
                  <span className={`indicator-dot ${hoveredBar.type}`}></span>
                  <strong>{hoveredBar.type === 'projects' ? 'Projects' : 'Wells'}: </strong>
                  <span>{hoveredBar.val} units in this corporation</span>
                </div>
              ) : (
                <p className="tooltip-helper-text">*Hover over any bar to view the exact count</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DISTRIBUTION DONUTS */}
        <div className="donut-charts-column">
          <div className="chart-card glassmorphic">
            <h3>Project Status Distribution</h3>
            {renderDonutChart(projectStatusData, totalProjCount, statusColors, 'status')}
          </div>

          <div className="chart-card glassmorphic">
            <h3>Well Type Distribution</h3>
            {renderDonutChart(wellTypeData, totalWellCount, wellTypeColors, 'well')}
          </div>
        </div>

      </div>

      {/* 3. DETAILED WARD TABLE */}
      <div className="chart-card glassmorphic ward-data-card">
        <div className="chart-card-header table-header">
          <div>
            <h3>Detailed Ward Analytics</h3>
            <p>Aggregated assets count across wards in Bangalore</p>
          </div>
          <div className="table-search-box">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Search by Ward Name..." 
              value={wardSearch}
              onChange={(e) => setWardSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="table-wrapper">
          <table className="analytics-table">
            <thead>
              <tr>
                <th>Ward Name</th>
                <th>Projects Count</th>
                <th>Wells Count</th>
                <th>Total Assets</th>
                <th>Ward Load share</th>
              </tr>
            </thead>
            <tbody>
              {filteredWards.length === 0 ? (
                <tr>
                  <td colSpan="5" className="empty-table-state">
                    No wards matching "{wardSearch}" found.
                  </td>
                </tr>
              ) : (
                filteredWards.map((ward, idx) => {
                  const total = ward.projectsCount + ward.wellsCount;
                  const maxTotal = Math.max(...wardData.map(w => w.projectsCount + w.wellsCount), 1);
                  const loadSharePercent = (total / maxTotal) * 100;

                  return (
                    <tr key={idx}>
                      <td className="ward-name-cell">{ward.wardName}</td>
                      <td>
                        <span className="badge-count proj">{ward.projectsCount}</span>
                      </td>
                      <td>
                        <span className="badge-count well">{ward.wellsCount}</span>
                      </td>
                      <td>
                        <strong>{total}</strong>
                      </td>
                      <td>
                        <div className="load-bar-wrapper">
                          <div className="load-bar-fill" style={{ width: `${loadSharePercent}%` }}></div>
                          <span className="load-val">{((total / (overview?.totalProjects + overview?.totalWells)) * 100).toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
