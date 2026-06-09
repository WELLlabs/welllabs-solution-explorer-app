import React, { useState } from 'react';
import './FloodRiskMap.css';

const RISK_ZONES = [
  {
    id: 'koramangala',
    name: 'Koramangala Zone',
    riskLevel: 'high',
    riskClass: 'High Risk',
    details: 'Heavy drainage blockages due to dense commercial layouts. Under extreme monsoons, storm runoff from higher elevation wards aggregates here, flooding Sectors 3 and 4.',
    activeInterventions: 18,
    wardsCount: 8,
    coords: { cx: 100, cy: 115, r: 24 },
    labelCoords: { x: 100, y: 115 }
  },
  {
    id: 'hsr-layout',
    name: 'HSR Layout Zone',
    riskLevel: 'medium',
    riskClass: 'Medium Risk',
    details: 'Low-lying sectors (specifically Sector 6) are prone to lake overflow backflows. Desilting of local channels is completed, but retention ponds require active monitoring.',
    activeInterventions: 12,
    wardsCount: 6,
    coords: { cx: 135, cy: 95, r: 22 },
    labelCoords: { x: 135, y: 95 }
  },
  {
    id: 'rajajinagar',
    name: 'Rajajinagar Zone',
    riskLevel: 'low',
    riskClass: 'Low Risk',
    details: 'Benefiting from stable natural elevation, stormwater drains operate efficiently with minimal waterlogging hotspots. Main activities focus on routine catch-pit maintenance.',
    activeInterventions: 6,
    wardsCount: 5,
    coords: { cx: 65, cy: 75, r: 20 },
    labelCoords: { x: 65, y: 75 }
  },
  {
    id: 'outer-ring-road',
    name: 'Outer Ring Road (ORR) Corridor',
    riskLevel: 'high',
    riskClass: 'High Risk',
    details: 'Highly urbanized concrete zone with low soil permeability. Heavy rainfall creates massive runoff sheets that flood commercial tech parks and underground basement power grids.',
    activeInterventions: 22,
    wardsCount: 12,
    coords: { cx: 160, cy: 130, r: 18 },
    labelCoords: { x: 160, y: 130 }
  }
];

const WATER_BODIES = [
  { name: 'Bellandur Lake', cx: 145, cy: 115, r: 5 },
  { name: 'Somasundarapalya Lake', cx: 102, cy: 132, r: 4 },
  { name: 'Jakkur Lake', cx: 112, cy: 45, r: 5 }
];

const FloodRiskMap = () => {
  const [activeSubTab, setActiveSubTab] = useState('all'); // 'all', 'high', 'medium', 'zones', 'waterlogging'
  const [selectedZone, setSelectedZone] = useState(RISK_ZONES[0]);

  const handleZoneClick = (zone) => {
    setSelectedZone(zone);
  };

  const isZoneFiltered = (zone) => {
    if (activeSubTab === 'all') return true;
    if (activeSubTab === 'high' && zone.riskLevel === 'high') return true;
    if (activeSubTab === 'medium' && zone.riskLevel === 'medium') return true;
    if (activeSubTab === 'zones') return true; // Show all zones
    return false;
  };

  return (
    <div className="flood-risk-map-container animate-fade-in">
      {/* Sub navigation mimicking the mockup */}
      <div className="risk-sub-navigation">
        <button 
          className={`sub-nav-btn ${activeSubTab === 'all' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('all'); }}
        >
          All risk levels
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === 'high' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('high'); }}
        >
          High risk
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === 'medium' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('medium'); }}
        >
          Medium risk
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === 'zones' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('zones'); }}
        >
          Flood zones
        </button>
        <button 
          className={`sub-nav-btn ${activeSubTab === 'waterlogging' ? 'active' : ''}`}
          onClick={() => { setActiveSubTab('waterlogging'); }}
        >
          Waterlogging
        </button>
      </div>

      <div className="risk-map-workspace">
        {/* Left Map Panel */}
        <div className="map-view-card glassmorphic">
          <div className="map-card-header">
            <h4>Bengaluru flood risk map</h4>
            <span className="last-updated">Last updated Jan 2025</span>
          </div>

          <div className="interactive-map-wrapper">
            <svg viewBox="0 0 240 180" className="risk-svg-map">
              {/* Outer boundary polygon from screenshot (light green shading) */}
              <polygon 
                points="80,20 140,25 180,50 200,80 185,120 160,150 110,165 70,145 50,110 45,70 55,40" 
                className="bangalore-outer-poly"
              />

              {/* Water Bodies (Blue Circles) */}
              {activeSubTab === 'waterlogging' || activeSubTab === 'all' ? (
                WATER_BODIES.map((lake, idx) => (
                  <circle 
                    key={idx}
                    cx={lake.cx}
                    cy={lake.cy}
                    r={lake.r}
                    className="lake-node"
                    title={lake.name}
                  />
                ))
              ) : null}

              {/* Risk Zones Group */}
              {RISK_ZONES.map((zone) => {
                const visible = isZoneFiltered(zone);
                const isSelected = selectedZone?.id === zone.id;
                
                return (
                  <g 
                    key={zone.id} 
                    className={`map-zone-group ${visible ? 'visible' : 'dimmed'} ${isSelected ? 'selected' : ''}`}
                    onClick={() => visible && handleZoneClick(zone)}
                  >
                    <circle 
                      cx={zone.coords.cx}
                      cy={zone.coords.cy}
                      r={zone.coords.r}
                      className={`zone-circle ${zone.riskLevel}`}
                    />
                    <text 
                      x={zone.labelCoords.x} 
                      y={zone.labelCoords.y}
                      className="zone-svg-label"
                      textAnchor="middle"
                    >
                      {zone.id === 'outer-ring-road' ? 'ORR' : zone.name.split(' ')[0]}
                    </text>
                  </g>
                );
              })}

              {/* Compass Indicator */}
              <g transform="translate(210, 30)" className="compass-rose">
                <line x1="0" y1="-12" x2="0" y2="12" stroke="#64748b" strokeWidth="1" />
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#64748b" strokeWidth="1" />
                <polygon points="0,-12 -3,-3 3,-3" fill="#ef4444" />
                <text x="0" y="-16" textAnchor="middle" className="compass-n">N</text>
              </g>
            </svg>
          </div>
        </div>

        {/* Right Info Panel */}
        <div className="risk-details-pane">
          {selectedZone ? (
            <div className={`risk-detail-card glassmorphic ${selectedZone.riskLevel}`}>
              <div className="risk-detail-header">
                <h3>{selectedZone.name}</h3>
                <span className={`risk-badge-pill ${selectedZone.riskLevel}`}>
                  {selectedZone.riskClass}
                </span>
              </div>

              <div className="risk-detail-body">
                <p className="risk-desc-text">{selectedZone.details}</p>
                
                <div className="risk-detail-stats">
                  <div className="stat-entry">
                    <span className="label">Wards Affected:</span>
                    <strong className="value">{selectedZone.wardsCount} Wards</strong>
                  </div>
                  <div className="stat-entry">
                    <span className="label">BGG Interventions:</span>
                    <strong className="value">{selectedZone.activeInterventions} Sites</strong>
                  </div>
                </div>

                <div className="risk-strategy-block">
                  <h5>🛡️ Risk Management Strategy</h5>
                  <ul className="strategy-bullets">
                    {selectedZone.riskLevel === 'high' ? (
                      <>
                        <li>Enforcement of 30m buffer zones around buffer water bodies.</li>
                        <li>Expansion of storm canals and Rajakaluve desilting.</li>
                        <li>Real-time telemetry integration for emergency sluice gates.</li>
                      </>
                    ) : selectedZone.riskLevel === 'medium' ? (
                      <>
                        <li>Deploying roadside bioswales to catch road runoffs.</li>
                        <li>Adding shallow filtration shafts on sidewalk sidewalks.</li>
                        <li>Community co-management and silt traps at inflows.</li>
                      </>
                    ) : (
                      <>
                        <li>Bi-annual drain desilting prior to monsoon seasons.</li>
                        <li>Adding tree trenches to absorb local sidewalk sheetflows.</li>
                      </>
                    )}
                  </ul>
                </div>
              </div>
            </div>
          ) : (
            <div className="select-zone-prompt glassmorphic">
              <p>Click on any risk zone or water body on the map to review localized risk details and management strategies.</p>
            </div>
          )}
        </div>
      </div>

      {/* Risk Metrics Cards Panel matching the screenshot */}
      <div className="risk-metrics-row">
        <div className="metric-kpi-card high-risk">
          <span className="kpi-num">42</span>
          <span className="kpi-label">High risk wards</span>
        </div>

        <div className="metric-kpi-card medium-risk">
          <span className="kpi-num">71</span>
          <span className="kpi-label">Medium risk wards</span>
        </div>

        <div className="metric-kpi-card active-interventions">
          <span className="kpi-num">247</span>
          <span className="kpi-label">Active interventions</span>
        </div>
      </div>
    </div>
  );
};

export default FloodRiskMap;
