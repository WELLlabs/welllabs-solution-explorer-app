import React, { useState, useEffect } from 'react';
import api from '../config/api';

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

  // EFFECT: Fetching Projects and Wells data metrics from the backend API
  useEffect(() => {
    const fetchAnalyticsData = async () => {
      try {
        setLoading(true);

        // Fetch overview counts, corporation aggregates, and ward lists in parallel
        // This includes total counts for Projects (rainwater/lake assets) and Wells (groundwater telemetry)
        const [overviewRes, corpRes, wardRes] = await Promise.all([
          api.get('/analytics/overview'),
          api.get('/analytics/corporation'),
          api.get('/analytics/ward')
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4 text-slate-500 animate-pulse">
        <div className="w-12 h-12 border-4 border-slate-200 border-t-blue-500 rounded-full animate-spin"></div>
        <p className="text-sm font-semibold">Analyzing and aggregating hydrological data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center border border-red-200 bg-red-50/30 rounded-2xl max-w-[480px] mx-auto my-10">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-xl font-bold text-red-500 mb-2">Analysis Offline</h3>
        <p className="text-slate-500 text-sm">{error}</p>
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
      <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center justify-around gap-6 py-2">
        <svg viewBox="0 0 140 140" className="w-[130px] h-[130px] shrink-0">
          <circle cx="70" cy="70" r={radius} fill="transparent" stroke="#f1f5f9" strokeWidth={strokeWidth} />
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
          <g className="fill-slate-900">
            <text x="70" y="68" textAnchor="middle" className="text-[22px] font-extrabold fill-slate-900">
              {total}
            </text>
            <text x="70" y="85" textAnchor="middle" className="text-[8px] font-bold fill-slate-400 tracking-wider">
              TOTAL
            </text>
          </g>
        </svg>

        <div className="flex flex-col gap-1.5 grow w-full">
          {data.map((item, idx) => {
            const key = item.status || item.type || 'unknown';
            const val = item.count;
            const percentage = ((val / total) * 100).toFixed(1);
            const color = colors[key.toLowerCase()] || colors['unknown'];
            const isHovered = hoveredSlice === `${hoverKey}-${idx}`;

            return (
              <div 
                key={idx} 
                className={`flex items-center gap-2.5 text-xs text-slate-600 px-2.5 py-1.5 rounded-lg transition-all duration-200 font-semibold cursor-pointer ${isHovered ? 'bg-slate-100/80 text-slate-900' : 'hover:bg-slate-50 hover:text-slate-900'}`}
                onMouseEnter={() => setHoveredSlice(`${hoverKey}-${idx}`)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <span className="w-2 h-2 rounded-[3px] shrink-0" style={{ backgroundColor: color }}></span>
                <span className="font-bold capitalize">{key}</span>
                <span className="ml-auto text-[11px] text-slate-400 font-bold">{val} ({percentage}%)</span>
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
    <div className="w-full max-w-[1280px] mx-auto py-2 pb-8 flex flex-col gap-6 text-left">
      {/* 1. TOP STATS CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-blue-50/40 hover:bg-blue-50/60 border border-blue-100/70 rounded-2xl p-6 flex items-center gap-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7L12 12L22 7L12 2Z" />
              <path d="M2 17L12 22L22 17" />
              <path d="M2 12L17.5 14.8" />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Rainwater & Lake Projects</span>
            <h3 className="text-4xl font-extrabold text-slate-900 leading-none tracking-tight">{overview?.totalProjects || 0}</h3>
            <span className="text-[11px] text-slate-400 font-semibold">Mapped assets in Bangalore</span>
          </div>
        </div>

        <div className="bg-emerald-50/40 hover:bg-emerald-50/60 border border-emerald-100/70 rounded-2xl p-6 flex items-center gap-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 8v8" />
              <path d="M8 12h8" />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Monitored Ground Wells</span>
            <h3 className="text-4xl font-extrabold text-slate-900 leading-none tracking-tight">{overview?.totalWells || 0}</h3>
            <span className="text-[11px] text-slate-400 font-semibold">Active telemetry and surveys</span>
          </div>
        </div>

        <div className="bg-purple-50/40 hover:bg-purple-50/60 border border-purple-100/70 rounded-2xl p-6 flex items-center gap-5 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-sm">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-purple-500/10 text-purple-500 border border-purple-500/20 shadow-[inset_0_2px_4px_rgba(255,255,255,0.4)]">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            </svg>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-slate-500 font-bold tracking-wider uppercase">Active GBA Regions</span>
            <h3 className="text-4xl font-extrabold text-slate-900 leading-none tracking-tight">{corporationData.length}</h3>
            <span className="text-[11px] text-slate-400 font-semibold">Zones with project clusters</span>
          </div>
        </div>
      </div>

      {/* 2. MAIN CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* LEFT COLUMN: GBA CORPORATION BAR CHART */}
        <div className="lg:col-span-3 bg-sky-50/30 border border-sky-100/60 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 tracking-tight">Hydrological Assets by GBA Region</h3>
              <p className="text-xs text-slate-500 font-semibold">Comparing projects and wells across regional corporations</p>
            </div>
            <div className="flex bg-slate-200/60 border border-slate-300/40 rounded-xl p-1 shrink-0">
              <button 
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ${activeChartMetric === 'both' ? 'text-slate-900 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                onClick={() => setActiveChartMetric('both')}
              >
                Both
              </button>
              <button 
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ${activeChartMetric === 'projects' ? 'text-slate-900 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                onClick={() => setActiveChartMetric('projects')}
              >
                Projects
              </button>
              <button 
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg cursor-pointer transition-all duration-200 ${activeChartMetric === 'wells' ? 'text-slate-900 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}
                onClick={() => setActiveChartMetric('wells')}
              >
                Wells
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-4 py-2">
            {corporationData.map((corp, index) => {
              const projWidth = `${(corp.projectsCount / maxCorpVal) * 85}%`;
              const wellWidth = `${(corp.wellsCount / maxCorpVal) * 85}%`;

              return (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-[140px_1fr] items-center gap-4">
                  <div className="text-xs font-bold text-slate-600 truncate">{corp.corporation}</div>
                  <div className="flex flex-col gap-2 w-full">
                    {/* Projects Bar */}
                    {(activeChartMetric === 'both' || activeChartMetric === 'projects') && (
                      <div className="w-full h-3 bg-slate-200/50 rounded-full relative overflow-visible">
                        <div 
                          className="group h-full rounded-full relative cursor-pointer transition-all duration-500 bg-gradient-to-r from-blue-500 to-blue-400 hover:brightness-105 shadow-sm hover:shadow"
                          style={{ width: projWidth }}
                          onMouseEnter={() => setHoveredBar({ type: 'projects', index, val: corp.projectsCount })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <span className="absolute right-0 -top-7 translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-0.5 transition-all duration-200 z-10">
                            {corp.projectsCount}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Wells Bar */}
                    {(activeChartMetric === 'both' || activeChartMetric === 'wells') && (
                      <div className="w-full h-3 bg-slate-200/50 rounded-full relative overflow-visible">
                        <div 
                          className="group h-full rounded-full relative cursor-pointer transition-all duration-500 bg-gradient-to-r from-emerald-500 to-emerald-400 hover:brightness-105 shadow-sm hover:shadow"
                          style={{ width: wellWidth }}
                          onMouseEnter={() => setHoveredBar({ type: 'wells', index, val: corp.wellsCount })}
                          onMouseLeave={() => setHoveredBar(null)}
                        >
                          <span className="absolute right-0 -top-7 translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-2 py-0.5 rounded shadow-md opacity-0 pointer-events-none group-hover:opacity-100 group-hover:-translate-y-0.5 transition-all duration-200 z-10">
                            {corp.wellsCount}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {/* X-Axis Scale Indicator */}
            <div className="flex justify-between ml-0 sm:ml-[156px] border-t border-dashed border-slate-200 pt-2">
              <div className="text-[10px] text-slate-400 font-bold">0</div>
              <div className="text-[10px] text-slate-400 font-bold">25%</div>
              <div className="text-[10px] text-slate-400 font-bold">50%</div>
              <div className="text-[10px] text-slate-400 font-bold">75%</div>
              <div className="text-[10px] text-slate-400 font-bold">100%</div>
            </div>
            
            {/* Tooltip display */}
            <div className="min-height-[38px] flex items-center justify-center border-t border-slate-100 pt-3">
              {hoveredBar ? (
                <div className="flex items-center gap-2 bg-white border border-slate-200 px-4 py-1.5 rounded-full text-xs text-slate-600 shadow-sm transition-all duration-300">
                  <span className={`w-2 h-2 rounded-full ${hoveredBar.type === 'projects' ? 'bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]' : 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'}`}></span>
                  <strong>{hoveredBar.type === 'projects' ? 'Projects' : 'Wells'}: </strong>
                  <span>{hoveredBar.val} units in this corporation</span>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 italic font-semibold">*Hover over any bar to view the exact count</p>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: DISTRIBUTION DONUTS */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-indigo-50/20 border border-indigo-100/60 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Project Status Distribution</h3>
            {renderDonutChart(projectStatusData, totalProjCount, statusColors, 'status')}
          </div>

          <div className="bg-teal-50/20 border border-teal-100/60 rounded-2xl p-6 flex flex-col gap-5 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Well Type Distribution</h3>
            {renderDonutChart(wellTypeData, totalWellCount, wellTypeColors, 'well')}
          </div>
        </div>

      </div>

      {/* 3. DETAILED WARD TABLE */}
      <div className="bg-zinc-50/50 border border-zinc-200/80 rounded-2xl p-6 flex flex-col gap-5 shadow-sm mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 tracking-tight">Detailed Ward Analytics</h3>
            <p className="text-xs text-slate-500 font-semibold">Aggregated assets count across wards in Bangalore</p>
          </div>
          <div className="flex items-center bg-white border border-slate-300 rounded-xl px-3.5 py-2 gap-2.5 w-full sm:w-[280px] focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/12 transition-all">
            <svg className="text-slate-400" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input 
              type="text" 
              placeholder="Search by Ward Name..." 
              value={wardSearch}
              onChange={(e) => setWardSearch(e.target.value)}
              className="bg-transparent border-none text-slate-900 text-sm font-semibold outline-none w-full placeholder-slate-400"
            />
          </div>
        </div>

        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="bg-slate-50 px-4 py-3 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider">Ward Name</th>
                <th className="bg-slate-50 px-4 py-3 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider">Projects Count</th>
                <th className="bg-slate-50 px-4 py-3 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider">Wells Count</th>
                <th className="bg-slate-50 px-4 py-3 text-[10px] font-bold text-slate-500 border-b border-slate-200 uppercase tracking-wider">Total Assets</th>
              </tr>
            </thead>
            <tbody>
              {filteredWards.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center py-10 text-slate-400 italic">
                    No wards matching "{wardSearch}" found.
                  </td>
                </tr>
              ) : (
                filteredWards.map((ward, idx) => {
                  const total = ward.projectsCount + ward.wellsCount;

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 text-xs text-slate-900 font-bold border-b border-slate-100">{ward.wardName}</td>
                      <td className="px-4 py-3 text-xs border-b border-slate-100">
                        <span className="inline-block px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/12 text-xs font-bold">{ward.projectsCount}</span>
                      </td>
                      <td className="px-4 py-3 text-xs border-b border-slate-100">
                        <span className="inline-block px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/12 text-xs font-bold">{ward.wellsCount}</span>
                      </td>
                      <td className="px-4 py-3 text-xs border-b border-slate-100 font-extrabold text-slate-800">
                        {total}
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