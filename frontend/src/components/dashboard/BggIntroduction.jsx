import React from 'react';
import './BggIntroduction.css';

const BggIntroduction = ({ onNavigateToCase, onSetActiveTab }) => {
  const keyTerms = [
    {
      term: 'Sponge City',
      definition: 'Urban design that absorbs, stores and gradually releases rainwater to reduce flooding.'
    },
    {
      term: 'Rajakaluve',
      definition: "Bengaluru's traditional storm-water drain network connecting lakes, many of which are encroached."
    },
    {
      term: 'Ecosystem Services',
      definition: 'Benefits people obtain from natural systems — clean air, flood regulation, and cooling.'
    },
    {
      term: 'Green Corridor',
      definition: 'Linked parks and planted streets that allow biodiversity movement across the city.'
    },
    {
      term: 'Nature-Based Solutions (NbS)',
      definition: 'Cost-effective approaches using ecosystems to address urban climate challenges.'
    },
    {
      term: 'Urban Heat Island',
      definition: 'Cities are significantly warmer than surrounding rural areas due to hard surfaces and activity.'
    }
  ];

  const shockingNews = [
    {
      id: 'lake-rejuvenation',
      title: '79% of Bengaluru\'s Lakes & Wetlands Lost since 1960',
      description: 'Bengaluru was once celebrated as the "City of Lakes" with an intricate interconnected system. Today, rapid concrete encroachment has swallowed 79% of these wetlands, leaving the city defenseless against heavy monsoons and causing massive run-off issues.',
      highlightText: 'Somasundarapalya Lake Rejuvenation',
      targetCaseTitle: 'Somasundarapalya Lake Rejuvenation'
    },
    {
      id: 'wetland-management',
      title: 'Outer Ring Road Submerged in Raw Sewage Flow',
      description: 'A single heavy downpour turned Bangalore\'s multi-billion dollar tech corridor into a stagnant river of sewage-laden stormwater. Encroachments on traditional Rajakaluves forced sewage to flow back into streets, underscoring the absolute necessity of Constructed Wetlands.',
      highlightText: 'Jakkur Lake Co-Management Model',
      targetCaseTitle: 'Jakkur Lake Wetland Co-Management'
    },
    {
      id: 'aquifer-recharge',
      title: 'Groundwater Depleted: Borewells Reaching 1,000+ Feet',
      description: 'As the city\'s deep aquifers dry up completely, traditional well diggers (Mannu Vaddars) are partnering with scientists to revive heritage open wells, showing that shallow aquifer corridors are the most resilient key to Bengaluru\'s future water security.',
      highlightText: 'Cubbon Park Heritage Wells Project',
      targetCaseTitle: 'Cubbon Park Shallow Aquifer Corridor'
    }
  ];

  return (
    <div className="bgg-intro-container animate-fade-in">
      {/* Top Banner mimicking the screenshot */}
      <div className="bgg-screenshot-header">
        <div className="bgg-banner-title">
          BGG Resources Information System — Bengaluru
        </div>
        <div className="bgg-banner-partners">
          BBMP · BDA · KSPCB
        </div>
      </div>

      {/* Main Pillars */}
      <div className="bgg-pillars-grid">
        <div className="pillar-card">
          <div className="pillar-icon-dot blue"></div>
          <h3>What is BGG?</h3>
          <p>
            Blue-Green Growth (BGG) refers to urban infrastructure that uses water bodies, vegetation, and natural systems to deliver ecological and social benefits in cities like Bengaluru.
          </p>
        </div>

        <div className="pillar-card">
          <div className="pillar-icon-dot green"></div>
          <h3>Why Bengaluru?</h3>
          <p>
            Rapid urbanisation has replaced over 79% of Bengaluru's lakes and wetlands since 1960, increasing flood vulnerability and urban heat. BGG interventions help restore this lost resilience.
          </p>
        </div>

        <div className="pillar-card">
          <div className="pillar-icon-dot purple"></div>
          <h3>Stakeholders</h3>
          <p>
            BBMP, BDA, KSPCB, Lake Development Authority, Bruhat Bengaluru, CSR-funded NGOs and citizen groups all participate in planning and implementing BGG interventions.
          </p>
        </div>
      </div>

      {/* Shocking News / Stunning Lines Section */}
      <div className="shocking-news-section">
        <h2 className="section-title">Critical Ecological Flashpoints</h2>
        <p className="section-subtitle">
          Bengaluru is at a crossroads. Below are the key flooding and water crises affecting our municipal zones. Click <strong>Read More</strong> to inspect the specific scientific interventions restoring these assets.
        </p>

        <div className="news-cards-grid">
          {shockingNews.map((news) => (
            <div key={news.id} className="news-card glassmorphic">
              <div className="news-badge">ALERT</div>
              <h3 className="news-title">{news.title}</h3>
              <p className="news-desc">{news.description}</p>
              
              <div className="news-footer">
                <span className="target-case-label">Case Study: {news.highlightText}</span>
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

      {/* Key Terms Section */}
      <div className="key-terms-section">
        <h2 className="section-title">Key Terms</h2>
        <div className="terms-grid">
          {keyTerms.map((t, idx) => (
            <div key={idx} className="term-card">
              <div className="term-name">{t.term}</div>
              <div className="term-desc">{t.definition}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BggIntroduction;
