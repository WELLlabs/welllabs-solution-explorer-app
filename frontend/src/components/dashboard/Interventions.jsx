import React, { useState } from 'react';
import './Interventions.css';

const INTERVENTIONS_DATA = [
  {
    year: '2026',
    location: 'Silk Board Junction & HSR Layout Sector 6',
    status: 'Active Monitoring',
    statusClass: 'active',
    floodingDetails: 'A record-breaking 150mm rainfall in 24 hours caused massive stormwater runoff. Water accumulated up to 4 feet on streets due to extensive concrete paving and blocked Rajakaluve drain networks.',
    bggSolution: 'Reactivated the Sector 6 retention wetland, cleared Rajakaluve blockages, and deployed real-time IoT-based water level sensors to provide early warning alerts to municipal engineers.',
    impactStats: {
      loadReduction: '35%',
      warningTime: '45 mins',
      wellsRecharged: '28 Wells'
    },
    colorTheme: 'red'
  },
  {
    year: '2025',
    location: 'Mahadevapura IT Corridor & Bellandur Basin',
    status: 'Completed Bypass',
    statusClass: 'completed',
    floodingDetails: 'Monsoon flooding submerged critical commercial basement grids, halting tech operations for 48 hours. Industrial runoff mixed with raw sewage, causing severe environmental contamination.',
    bggSolution: 'Constructed three upstream sewage-filtering wetlands (2.5 MLD capacity total) and routed dedicated bypass channels to redirect peak flow away from office basements.',
    impactStats: {
      loadReduction: '48%',
      warningTime: 'N/A',
      wellsRecharged: '12 Wells'
    },
    colorTheme: 'orange'
  },
  {
    year: '2024',
    location: 'Jakkur Lake Catchment & Yelahanka Zones',
    status: 'Completed Well Recharge',
    statusClass: 'completed',
    floodingDetails: 'Severe waterlogging in residential layouts while the deep borewells were simultaneously running dry at depths of 1,000+ feet due to groundwater over-extraction.',
    bggSolution: 'Collaborated with traditional well-diggers (Mannu Vaddars) to construct 42 shallow recharge wells and integrated sand-carbon filtration pits to safely channel street runoff into the soil.',
    impactStats: {
      loadReduction: '24%',
      warningTime: 'N/A',
      wellsRecharged: '42 Wells'
    },
    colorTheme: 'purple'
  },
  {
    year: '2023',
    location: 'Bommanahalli Residential Sector',
    status: 'Completed Desilting',
    statusClass: 'completed',
    floodingDetails: 'Siltation had reduced local retention lakes\' volume by 45%, forcing lake water to overflow back into residential streets during minor showers.',
    bggSolution: 'Desilted 80,000 cubic meters of mud from the lake beds, established legal vegetation buffers, and constructed sediment traps at primary inflow gates.',
    impactStats: {
      loadReduction: '30%',
      warningTime: 'N/A',
      wellsRecharged: '15 Wells'
    },
    colorTheme: 'blue'
  },
  {
    year: '2022',
    location: 'Sarjapur Road Wards & Outer Ring Road',
    status: 'Completed Swales',
    statusClass: 'completed',
    floodingDetails: 'Rapid road asphalt paving created high-velocity runoff sheets that flooded commercial properties and eroded road edges.',
    bggSolution: 'Excavated 1.2 kilometers of bioswales, planted native reeds to slow down water velocity, and laid porous concrete sidewalks to maximize soil infiltration.',
    impactStats: {
      loadReduction: '52%',
      warningTime: 'N/A',
      wellsRecharged: '8 Wells'
    },
    colorTheme: 'indigo'
  }
];

const Interventions = () => {
  const [selectedYear, setSelectedYear] = useState('2026');

  const activeData = INTERVENTIONS_DATA.find(item => item.year === selectedYear) || INTERVENTIONS_DATA[0];

  return (
    <div className="interventions-container animate-fade-in">
      <div className="section-header-compact">
        <h2>Municipal BGG Interventions Timeline</h2>
        <p>Explore year-wise flooding incidents across Bangalore and the specific Blue-Green Growth (BGG) solutions deployed to restore hydrological resilience.</p>
      </div>

      <div className="interventions-workspace">
        {/* Left pane: Interactive timeline tree */}
        <div className="timeline-tree-pane">
          <div className="timeline-line"></div>
          {INTERVENTIONS_DATA.map((item) => {
            const isSelected = item.year === selectedYear;
            return (
              <div 
                key={item.year}
                className={`timeline-node-wrapper ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedYear(item.year)}
              >
                <div className={`timeline-dot theme-${item.colorTheme}`}>
                  <span className="dot-inner"></span>
                </div>
                <div className="timeline-node-card">
                  <span className="node-year">{item.year}</span>
                  <strong className="node-location">{item.location}</strong>
                  <span className={`node-status ${item.statusClass}`}>{item.status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right pane: Expanded detail visualization */}
        <div className="timeline-details-pane">
          <div className={`details-card glassmorphic theme-${activeData.colorTheme}`}>
            <div className="details-header">
              <div className="details-badge-year">{activeData.year}</div>
              <div>
                <h3>{activeData.location}</h3>
                <span className={`details-status-pill ${activeData.statusClass}`}>{activeData.status}</span>
              </div>
            </div>

            <div className="details-body">
              <div className="info-block">
                <h4>⚠️ Flooding Impact Details</h4>
                <p>{activeData.floodingDetails}</p>
              </div>

              <div className="info-block">
                <h4>🌱 BGG Intervention & Scientific Solution</h4>
                <p>{activeData.bggSolution}</p>
              </div>

              <div className="impact-metrics-row">
                <div className="metric-box">
                  <span className="metric-val">{activeData.impactStats.loadReduction}</span>
                  <span className="metric-lbl">Drainage Load Reduced</span>
                </div>
                <div className="metric-box">
                  <span className="metric-val">{activeData.impactStats.wellsRecharged}</span>
                  <span className="metric-lbl">Local Wells Restored</span>
                </div>
                {activeData.impactStats.warningTime !== 'N/A' && (
                  <div className="metric-box">
                    <span className="metric-val">{activeData.impactStats.warningTime}</span>
                    <span className="metric-lbl">Early Warning Buffer</span>
                  </div>
                )}
              </div>
            </div>

            <div className="details-visual-mock">
              <div className="visual-title">Infiltration & Flow Simulation</div>
              <div className="visual-graphic">
                <div className="graphic-label">Surface Layer (Road / Concrete)</div>
                <div className="graphic-bar concrete">
                  <span className="flow-arrow blocked">➔ Runoff Sheet Flow (Choked)</span>
                </div>
                
                <div className="graphic-label">BGG Soil Layer (Wetland / Bioswale)</div>
                <div className="graphic-bar bio-soil">
                  <span className="flow-arrow descending">▼ Soil Infiltration Flow (Recharging)</span>
                </div>
                
                <div className="graphic-label">Shallow Water Table</div>
                <div className="water-table-display">
                  <div className="water-level-wave" style={{ height: activeData.year === '2026' ? '60%' : '45%' }}></div>
                  <span className="water-table-text">Target Aquifer Level: +2.4m</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Interventions;
