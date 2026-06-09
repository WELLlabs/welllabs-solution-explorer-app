import React, { useState, useEffect } from 'react';
import './CaseStudies.css';

const CASE_STUDIES = [
  {
    id: 'somasundarapalya-lake-rejuvenation',
    title: "Somasundarapalya Lake Rejuvenation",
    type: "lake",
    tags: ["Wetland", "Lake Rejuvenation", "Shallow Aquifer"],
    summary: "Restoration of a highly degraded urban lake in Bangalore South. Implemented an active constructed wetland filter to process municipal runoff, raising local ground water table by 2.4 meters over 18 months.",
    videoMockTitle: "Constructed Wetland Hydrology - Somasundarapalya Lake",
    videoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    pdfLink: "#",
    stats: { area: "16 Acres", rechargeRate: "1.2 MLD", localWells: "48 Wells" }
  },
  {
    id: 'jakkur-lake-wetland-co-management',
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
    id: 'cubbon-park-shallow-aquifer-corridor',
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

const CaseStudies = ({ highlightedCaseTitle, clearHighlight }) => {
  const [activeCaseFilter, setActiveCaseFilter] = useState('all');
  const [activeVideoUrl, setActiveVideoUrl] = useState(null);
  const [localHighlight, setLocalHighlight] = useState(null);

  useEffect(() => {
    if (highlightedCaseTitle) {
      // Find the case study match
      const matchedCase = CASE_STUDIES.find(cs => cs.title.toLowerCase() === highlightedCaseTitle.toLowerCase());
      if (matchedCase) {
        // Set filter to 'all' or the type of the matched case to ensure it is visible
        setActiveCaseFilter('all');
        setLocalHighlight(matchedCase.id);

        setTimeout(() => {
          const element = document.getElementById(matchedCase.id);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            
            // Trigger highlight effect
            element.classList.add('flash-glow-highlight');
            setTimeout(() => {
              element.classList.remove('flash-glow-highlight');
              setLocalHighlight(null);
              clearHighlight(); // Reset parent state
            }, 3000);
          }
        }, 300);
      }
    }
  }, [highlightedCaseTitle, clearHighlight]);

  const handleDownload = (title) => {
    alert(`Technical brief for "${title}" requested. Starting PDF download sequence.`);
  };

  return (
    <div className="case-studies-section animate-fade-in">
      <div className="section-header-compact">
        <h2>Hydrological Restoration Case Studies</h2>
        <p>Review real-world applications of wetland management, shallow aquifer recharges, and citizen hydrology across Bangalore.</p>
        
        {/* Category Filter Pills */}
        <div className="case-filter-group">
          <button 
            className={`filter-pill ${activeCaseFilter === 'all' ? 'active' : ''}`} 
            onClick={() => setActiveCaseFilter('all')}
          >
            All
          </button>
          <button 
            className={`filter-pill ${activeCaseFilter === 'lake' ? 'active' : ''}`} 
            onClick={() => setActiveCaseFilter('lake')}
          >
            Lake Restoration
          </button>
          <button 
            className={`filter-pill ${activeCaseFilter === 'wetland' ? 'active' : ''}`} 
            onClick={() => setActiveCaseFilter('wetland')}
          >
            Constructed Wetlands
          </button>
          <button 
            className={`filter-pill ${activeCaseFilter === 'well' ? 'active' : ''}`} 
            onClick={() => setActiveCaseFilter('well')}
          >
            Well Recharge
          </button>
        </div>
      </div>

      <div className="case-studies-grid">
        {CASE_STUDIES.filter(cs => activeCaseFilter === 'all' || cs.type === activeCaseFilter).map((cs) => {
          const isHighlighted = localHighlight === cs.id;
          return (
            <div 
              key={cs.id} 
              id={cs.id}
              className={`case-study-card glassmorphic ${isHighlighted ? 'force-highlight' : ''}`}
            >
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
                <a 
                  href={cs.pdfLink} 
                  className="brief-download-btn" 
                  onClick={(e) => { e.preventDefault(); handleDownload(cs.title); }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  Technical Brief (PDF)
                </a>
              </div>
            </div>
          );
        })}
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
  );
};

export default CaseStudies;
