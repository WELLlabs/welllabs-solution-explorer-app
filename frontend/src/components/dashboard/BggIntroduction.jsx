import React from 'react';
import './BggIntroduction.css';

const BggIntroduction = ({ onNavigateToCase, onSetActiveTab }) => {
  const shockingNews = [
    {
      id: 'singapore',
      title: 'Singapore: ABC Waters Programme',
      description: "Reducing flood risk systematically. Facing limited reservoir space, Singapore converted concrete canals into natural floodplains, reducing flood-prone areas by 48%.",
      highlightText: 'ABC Waters Programme',
      targetCaseTitle: 'Singapore: ABC Waters Programme',
      metrics: [
        { value: '48%', label: 'Risk Area Reduced' },
        { value: '22-63%', label: 'Runoff Reduction' },
        { value: '30 min', label: 'Discharge Delay' },
        { value: '60+', label: 'Projects Built' }
      ]
    },
    {
      id: 'copenhagen',
      title: 'Copenhagen: Cloudburst Plan',
      description: 'Designing for extreme events. Following an €800M damage storm in 2011, Copenhagen redesigned streets and plazas to absorb and store stormwater, saving €200M+ over pipes.',
      highlightText: 'Cloudburst Plan',
      targetCaseTitle: 'Copenhagen: Cloudburst Plan',
      metrics: [
        { value: '€800M', label: 'Storm Damage' },
        { value: '€1.5B', label: 'Total Investment' },
        { value: '€200M+', label: 'Estimated Savings' },
        { value: '300', label: 'Projects Planned' }
      ]
    },
    {
      id: 'rotterdam',
      title: 'Rotterdam: Room for the River',
      description: 'Redesigning rivers for resilience. Relocating dikes inland and lowering floodplains allowed the Rhine to swell safely from 12,000 to 16,000 m³/sec capacity without disaster.',
      highlightText: 'Room for the River',
      targetCaseTitle: 'Rotterdam: Room for the River',
      metrics: [
        { value: '€2.3B', label: 'Total Investment' },
        { value: '30+', label: 'Locations on 4 Rivers' },
        { value: '16K m³/s', label: 'Discharge Capacity' },
        { value: '2023', label: 'Saved from Flood' }
      ]
    }
  ];

  const bangaloreStats = [
    { value: '1,400 mm', label: 'rainfall in 2022 (vs 970 mm avg)' },
    { value: '5 of 7', label: 'Years since 2015 had excess rainfall' },
    { value: '131.6 mm', label: 'in 12 hours (2022)' },
    { value: '↑30%', label: 'Increase in extreme rainfall events' }
  ];

  const interventions = [
    { icon: '💧', name: 'Recharge wells', desc: 'Infiltrate stormwater to restore groundwater' },
    { icon: '🌸', name: 'Bioswales', desc: 'Filter and slow stormwater flow' },
    { icon: '🌳', name: 'Urban forests', desc: 'Intercept rain, cool the city' },
    { icon: '🌊', name: 'Lake restoration', desc: 'Rejuvenate water bodies as recharge zones' }
  ];

  return (
    <div className="bgg-intro-container animate-fade-in">
      {/* Hero Header Section */}
      <div className="home-hero-section">
        <h1 className="home-hero-title">Bangalore is flooding. Every monsoon season.</h1>
        <p className="home-hero-subtitle">
          In 2022, the city received 1,400 mm of rainfall—50% above normal. 131.6 mm fell in just 12 hours. 
          Inadequate drainage, encroached water bodies, and rapid urbanization are pushing Bangalore toward a water crisis.
        </p>

        {/* Stats Grid */}
        <div className="home-stats-grid">
          {bangaloreStats.map((stat, idx) => (
            <div key={idx} className="home-stat-card">
              <div className="home-stat-value">{stat.value}</div>
              <div className="home-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform Overview */}
      <div className="platform-overview-section glassmorphic">
        <div className="overview-header-row">
          <div className="overview-intro-text">
            <h2 className="section-title">Three cities. Three flood crises solved.</h2>
            <p className="section-subtitle">
              One proven strategy: <strong>Blue-Green-Grey infrastructure</strong>. This platform brings their peer-reviewed case studies, 
              design models, and cost-benefit data to Bangalore.
            </p>
          </div>
        </div>

        {/* Separated Platform Features Grid */}
        <div className="platform-features-grid">
          <div className="feature-card">
            <div className="feature-icon">🔍</div>
            <h3>Automated Suitability</h3>
            <p>Analyze optimal locations for BGG interventions using gap analysis and flood risk maps.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🧮</div>
            <h3>Design Calculator</h3>
            <p>Estimate site-specific construction costs and run hydrological simulation designs.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Real-Time Tracking</h3>
            <p>Track live water table levels, ward-wise flood impacts, and local telemetry dashboards.</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🤝</div>
            <h3>Collaborative Network</h3>
            <p>Connect government bodies, researchers, field implementers, and CSR funding partners.</p>
          </div>
        </div>
      </div>

      {/* What is this platform? Section */}
      <div className="what-is-platform-section glassmorphic">
        <div className="platform-content-split">
          <div className="platform-text-block">
            <h2 className="section-title">What is Solutions Explorer?</h2>
            <p className="platform-paragraph">
              A data-driven decision support system for designing, implementing, and tracking blue-green-grey interventions at city scale.
            </p>
            <p className="platform-paragraph">
              Get flood risk maps, automated BGG designs, cost estimates, and real-time dashboards showing impact across your city.
            </p>
            <p className="platform-paragraph">
              Connect government, CSR partners, implementers, researchers, and donors around a shared vision for urban water resilience.
            </p>
          </div>
          <div className="platform-graphic-block">
            <div className="large-map-icon">🗺️</div>
          </div>
        </div>
      </div>

      {/* What is BGG? Section */}
      <div className="what-is-bgg-section glassmorphic">
        <h2 className="section-title">What is BGG?</h2>
        <p className="section-subtitle">
          Blue-Green-Grey combines natural green spaces with grey infrastructure to solve urban flooding.
        </p>

        {/* Separated BGG Definition Pills */}
        <div className="bgg-definition-pills">
          <div className="bgg-pill blue">
            <span className="pill-dot"></span>
            <strong>Blue</strong>
            <span className="pill-separator">—</span>
            <span>Water bodies and wetlands</span>
          </div>

          <div className="bgg-pill green">
            <span className="pill-dot"></span>
            <strong>Green</strong>
            <span className="pill-separator">—</span>
            <span>Vegetation and permeable surfaces</span>
          </div>

          <div className="bgg-pill grey">
            <span className="pill-dot"></span>
            <strong>Grey</strong>
            <span className="pill-separator">—</span>
            <span>Engineered stormwater systems working together</span>
          </div>
        </div>

        <div className="interventions-preview-grid">
          {interventions.map((item, idx) => (
            <div key={idx} className="intervention-preview-card">
              <div className="intervention-preview-icon">{item.icon}</div>
              <h4>{item.name}</h4>
              <p>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Shocking News / Global Case Studies Section */}
      <div className="shocking-news-section">
        <div className="section-header-center">
          <h2 className="section-title">How cities around the world solved flooding</h2>
          <p className="section-subtitle">
            Click any case study to expand.
          </p>
        </div>

        <div className="news-cards-grid">
          {shockingNews.map((news) => (
            <div key={news.id} className="news-card glassmorphic">
              <div className="news-badge">GLOBAL CASE</div>
              <h3 className="news-title">{news.title}</h3>
              <p className="news-desc">{news.description}</p>
              
              {/* 2x2 Metrics Grid in News Card */}
              <div className="news-card-metrics-grid">
                {news.metrics.map((m, mIdx) => (
                  <div key={mIdx} className="news-card-metric">
                    <span className="metric-value-compact">{m.value}</span>
                    <span className="metric-label-compact">{m.label}</span>
                  </div>
                ))}
              </div>

              <div className="news-footer">
                <span className="target-case-label">{news.highlightText}</span>
                <button 
                  className="read-more-btn"
                  onClick={() => onNavigateToCase(news.targetCaseTitle)}
                >
                  Read More
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '6px' }}>
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="cta-banner-section glassmorphic">
        <h3>Ready to build BGG in Bangalore?</h3>
        <p>
          Use gap analysis maps to identify where high-risk flood areas lack interventions — and invest where you'll save the most lives. 
          Together, we can transform Bangalore's flood crisis into a resilient, climate-adapted city.
        </p>
        <button className="cta-btn" onClick={() => onSetActiveTab('floodriskmap')}>
          Learn More
        </button>
      </div>
    </div>
  );
};

export default BggIntroduction;
