import React, { useState } from 'react';
import './Interventions.css';

const K100_STATS = [
  { value: '9.6 km', label: 'Pilot Stretch', desc: 'Desilted & restored channel', icon: '🛣️' },
  { value: '32 km²', label: 'Catchment Area', desc: 'Stormwater catchment basin', icon: '🗺️' },
  { value: '~₹175 cr', label: 'Project Cost', desc: 'Coordinated funding budget', icon: '💰' },
  { value: '15', label: 'Agencies', desc: 'Government bodies aligned', icon: '🏢' },
  { value: '135 → 5 MLD', label: 'Sewage Inflow', desc: 'Over 96% sewage diverted', icon: '💧' }
];

const K100_TIMELINE_DATA = [
  {
    yearKey: '1885-1983',
    phase: 'Origins',
    title: 'A king’s canal, slowly buried',
    status: 'Historical Origins',
    statusClass: 'historical',
    colorTheme: 'red',
    bullets: [
      'Part of Kempegowda’s historic rajakaluve network linking the city’s lakes and carrying monsoon overflow.',
      'Survey maps from 1885, 1948 and 1983 trace the canal being steadily channelised as the city grew.',
      'Maintenance lapsed; it became an open sewer and garbage dump, severed from civic life.'
    ],
    graphicId: 'origins'
  },
  {
    yearKey: '2021',
    phase: 'Conception & Pilot',
    title: 'The plan, the coalition, the mock-up',
    status: 'Planning & Design',
    statusClass: 'planning',
    colorTheme: 'orange',
    bullets: [
      'BBMP commissions the ~₹175 crore K100 Citizens’ Waterway pilot; Mod Foundation leads the design concept.',
      'Model adopted from Seoul’s Cheonggyecheon stream restoration — uncover the water rather than slab over it.',
      'A coalition of ~15 government agencies is assembled; household and catchment surveys begin.',
      'A ~300 m demonstration stretch is built opposite Shanthinagar bus station to prove the design.'
    ],
    graphicId: 'conception'
  },
  {
    yearKey: '2022-2023',
    phase: 'Desilt & Divert',
    title: 'Taking sewage out of storm-water',
    status: 'Active Engineering',
    statusClass: 'active',
    colorTheme: 'blue',
    bullets: [
      'Contaminated silt removed to restore gravity flow and carrying capacity.',
      'BWSSB lays a trunk sewer from Chickpet metro to NGV and diverts ~110 MLD of sewage (pipes 900–2400 mm).',
      'Culverts and bridges redesigned to widen flow; native stone edges and indigenous planting introduced as a bio-filter.',
      'The mid-2023 completion target slips — managing sewage inflow proves the hardest problem.'
    ],
    graphicId: 'desilt'
  },
  {
    yearKey: '2024',
    phase: 'Clean-Water Works',
    title: 'Closing the last sewage gaps',
    status: 'Final Pipeline Integration',
    statusClass: 'active',
    colorTheme: 'purple',
    bullets: [
      'Two new works added: a ₹4.42 crore sewer line (Hosur Road–Neelasandra) and a 15 MLD pumping station on KSRTC land.',
      'A 5 MLD sewage treatment plant near KR Market is readied to guarantee dry-weather flow.',
      'BBMP reports sewage inflow cut by ~97%; an Independence Day inauguration is targeted.'
    ],
    graphicId: 'cleanwater'
  },
  {
    yearKey: '2025-2026',
    phase: 'Recognition & Reckoning',
    title: 'A model — and a maintenance test',
    status: 'Completed & Replicating',
    statusClass: 'completed',
    colorTheme: 'green',
    bullets: [
      'Sewage inflow reported down from ~135 MLD to about 5 MLD; recognised by the WRI Prize for Cities and the Creative Bureaucracy Festival.',
      'Most civil work is complete, but reviews flag the real challenge: upkeep — residual sewage, litter and weathering.',
      'Officials walk a 26 km stretch in June 2026; the Greater Bengaluru Authority signals it will route treated water in and replicate the model.'
    ],
    graphicId: 'recognition'
  }
];



const K100_ASSETS = {
  publicRealm: [
    { title: 'Restored channel', desc: '9.6 km of desilted, re-graded waterway with restored gravity flow.', icon: '🌊' },
    { title: 'Walkway & promenade', desc: 'Pedestrian paths along the channel edge — the new public space.', icon: '🚶' },
    { title: 'Bridges & culverts', desc: 'Redesigned arched crossings that widen flow and let people cross.', icon: '🌉' },
    { title: 'Stone edges & planting', desc: 'Native granite edging and indigenous species as a living bio-filter.', icon: '🌿' },
    { title: 'Seating & park space', desc: 'Plazas, seating and Bengaluru’s first new park in nearly four decades.', icon: '🌳' },
    { title: 'Wayfinding & signage', desc: 'A dedicated identity and signage system for the corridor.', icon: '🪧' },
    { title: 'Lighting', desc: 'New lighting that made the edge feel safe and usable after dark.', icon: '💡' }
  ],
  hydraulicSystem: [
    { title: '5 MLD STP', desc: 'Treatment plant near KR Market supplying clean dry-weather flow.', icon: '⚙️' },
    { title: 'Decentralised treatment', desc: 'On-site wastewater treatment serving the D’Souza Garden settlement.', icon: '🏘️' },
    { title: 'Trunk & interceptor sewers', desc: 'New / rectified lines (Chickpet–NGV; Hosur Rd–Neelasandra) diverting sewage away.', icon: '🚰' },
    { title: 'Pumping stations', desc: 'Intermediate stations, incl. a 15 MLD wastewater pump on KSRTC land.', icon: '⛽' },
    { title: 'Compact substations', desc: 'BESCOM CSS units replacing exposed overhead lines along the corridor.', icon: '⚡' },
    { title: 'Sensor network', desc: 'KSNDMC flood-line and choke-point sensors for risk monitoring.', icon: '📡' },
    { title: 'Demonstration stretch', desc: 'The ~300 m Shanthinagar mock-up that de-risked the full build.', icon: '🧱' }
  ]
};

const Interventions = () => {
  const [selectedPhase, setSelectedPhase] = useState('1885-1983');
  const [selectedAssetTab, setSelectedAssetTab] = useState('publicRealm');

  const activePhase = K100_TIMELINE_DATA.find(item => item.yearKey === selectedPhase) || K100_TIMELINE_DATA[0];



  return (
    <div className="interventions-container animate-fade-in">
      <div className="section-header-compact">
        <h2>K100 Citizens’ Waterway</h2>
        <h3 className="section-subtitle-main">From open sewer to citizens’ waterway</h3>
        <p className="k100-intro-para">
          A 9.6 km pilot project that restores a neglected storm-water drain (rajakaluve) as a working part of Bengaluru’s water ecosystem, and as a vibrant public space. Formerly carrying up to 135 million litres of sewage a day from Majestic bus stand to Bellandur Lake, the drain was desilted, intercepted, and reopened as a stone-edged, planted public waterway.
        </p>
      </div>

      {/* 2. Top KPIs stats grid */}
      <div className="k100-stats-grid">
        {K100_STATS.map((stat, idx) => (
          <div key={idx} className="k100-stat-card glassmorphic">
            <div className="stat-icon-wrapper">{stat.icon}</div>
            <div className="stat-content">
              <div className="stat-value">{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-desc">{stat.desc}</div>
            </div>
          </div>
        ))}
      </div>

      {/* 3. Main Timeline Workspace */}
      <h3 className="timeline-main-heading">Timeline</h3>
      <div className="interventions-workspace">
        {/* Left pane: Interactive timeline tree */}
        <div className="timeline-tree-pane">
          <div className="timeline-line"></div>
          {K100_TIMELINE_DATA.map((item) => {
            const isSelected = item.yearKey === selectedPhase;
            return (
              <div 
                key={item.yearKey}
                className={`timeline-node-wrapper ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedPhase(item.yearKey)}
              >
                <div className={`timeline-dot theme-${item.colorTheme}`}>
                  <span className="dot-inner"></span>
                </div>
                <div className="timeline-node-card">
                  <span className="node-year">{item.yearKey}</span>
                  <div className="node-text-group">
                    <strong className="node-phase">{item.phase}</strong>
                    <span className="node-location">{item.title}</span>
                  </div>
                  <span className={`node-status ${item.statusClass}`}>{item.status}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right pane: Expanded detail visualization */}
        <div className="timeline-details-pane">
          <div className={`details-card glassmorphic theme-${activePhase.colorTheme}`}>
            <div className="details-header">
              <div className="details-badge-year">{activePhase.yearKey}</div>
              <div>
                <h3>{activePhase.title}</h3>
                <span className={`details-status-pill ${activePhase.statusClass}`}>{activePhase.status}</span>
              </div>
            </div>

            <div className="details-body">
              <div className="info-block">
                <h4>🌱 Phase Milestones & Accomplishments</h4>
                <ul className="k100-bullets">
                  {activePhase.bullets.map((bullet, index) => (
                    <li key={index}>{bullet}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Before & After Ecological Transformation */}
      <div className="k100-before-after-section glassmorphic">
        <div className="section-sub-header">
          <h3>🔄 Transformation: Before & After</h3>
          <p>Visual comparisons showing the transition from neglected grey infrastructure to an open ecological waterway corridor.</p>
        </div>

        <div className="ba-comparison-grid">
          {/* Column 1: Channel Structure Restoration */}
          <div className="ba-column-card">
            <h4 className="ba-column-title">Channel Structure Restoration</h4>
            <div className="ba-images-row">
              <div className="ba-img-container">
                <span className="ba-img-badge before">BEFORE</span>
                <img src="/images/channelised_drain.png" alt="Channelised Drain Before" className="ba-comparison-img" />
                <div className="ba-img-caption">The channelised drain — silted, sewage-fed, fenced off from the city.</div>
              </div>
              <div className="ba-img-container">
                <span className="ba-img-badge after">AFTER</span>
                <img src="/images/reopened_channel.png" alt="Reopened Planted Waterway After" className="ba-comparison-img" />
                <div className="ba-img-caption">The reopened channel — native stone edges, planting, a walkable promenade.</div>
              </div>
            </div>
          </div>

          {/* Column 2: Urban Context & Relationship */}
          <div className="ba-column-card">
            <h4 className="ba-column-title">Urban Context & Relationship</h4>
            <div className="ba-images-row">
              <div className="ba-img-container">
                <span className="ba-img-badge before">BEFORE</span>
                <img src="/images/Gray_Infrastructure.png" alt="Grey Infrastructure Before" className="ba-comparison-img" />
                <div className="ba-img-caption">Grey infrastructure: the drain as the city’s back-of-house.</div>
              </div>
              <div className="ba-img-container">
                <span className="ba-img-badge after">AFTER</span>
                <img src="/images/Ecological_corridor.png" alt="Ecological Corridor After" className="ba-comparison-img" />
                <div className="ba-img-caption">Ecological corridor: an open channel people can walk beside.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 5. Dual-Layer Asset Explorer */}
      <div className="k100-assets-section glassmorphic">
        <div className="section-sub-header">
          <h3>📐 K100 System Layer Assets</h3>
          <p>The pilot produced two layers of assets: a visible public realm on top and a hidden hydraulic system keeping the water clean.</p>
        </div>

        <div className="assets-tabs-header">
          <button
            className={`asset-tab-btn ${selectedAssetTab === 'publicRealm' ? 'active' : ''}`}
            onClick={() => setSelectedAssetTab('publicRealm')}
          >
            🌳 Public Realm
          </button>
          <button
            className={`asset-tab-btn ${selectedAssetTab === 'hydraulicSystem' ? 'active' : ''}`}
            onClick={() => setSelectedAssetTab('hydraulicSystem')}
          >
            ⚙️ Hydraulic System
          </button>
        </div>

        <div className="assets-grid animate-fade-in">
          {K100_ASSETS[selectedAssetTab].map((asset, idx) => (
            <div key={idx} className="asset-card">
              <div className="asset-icon">{asset.icon}</div>
              <div className="asset-info">
                <h4>{asset.title}</h4>
                <p>{asset.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Interventions;
