import React, { useState, useEffect } from 'react';
import './CaseStudies.css';

const CASE_STUDIES = [
  {
    id: 'singapore',
    city: 'Singapore',
    emoji: '🌊',
    color: '#0ea5e9',
    colorLight: '#e0f2fe',
    programme: 'ABC Waters Programme',
    project: 'Bishan-Ang Mo Kio Park Restoration',
    tags: ['Stormwater Management', 'River Restoration', 'Urban Park'],
    heroStats: [
      { value: '48%', label: 'Flood-prone area reduced' },
      { value: '22–63%', label: 'Peak runoff reduction' },
      { value: '30 min', label: 'Peak discharge delay' },
      { value: '60+', label: 'Projects completed' },
    ],
    challenge: {
      title: 'The Challenge',
      text: 'Before: The Kallang River was confined to a 2.7 km concrete canal that ran to the southern edges of the park. The river was heavily used as a concrete drainage channel, separating two residential areas and prone to flooding during storms. The area was unsafe for public access.',
    },
    solution: {
      title: 'The Solution & Transformation',
      text: 'After: The concrete canal was converted into a naturalized 3.2 km meandering river with gentle slopes, wetland cells, and riparian vegetation. The adjacent parkland now doubles as a conveyance channel during high water events. The project was completed in 2012 and covers 62 hectares.',
    },
    keyData: [
      { label: 'Project duration', value: 'Design (2007–2010) + Construction (2009–2012)' },
      { label: 'Total cost', value: 'SGD 76 million (approx. $57 million USD)' },
      { label: 'River length transformed', value: '3.2 km (from 2.7 km concrete channel)' },
      { label: 'Park area', value: '62 hectares' },
      { label: 'Annual visitors', value: 'Over 3 million' },
      { label: 'Designer', value: 'Atelier Dreiseitl (Herbert Dreiseitl, lead designer)' },
    ],
    outcomeColumns: ['Metric', 'Target / Design', 'Verified Result'],
    outcomes: [
      { col1: 'Flood-prone urban area reduction', col2: 'Reduce flood risk', col3: '48% (56→29 ha, 2010–2019)' },
      { col1: 'Peak runoff reduction', col2: '22–63% by feature type', col3: 'Measured: 22–63%' },
      { col1: 'Peak discharge delay', col2: 'Design target', col3: 'Measured: 30 minutes' },
      { col1: 'Biodiversity', col2: 'Ecological restoration', col3: 'Native species return, otter population established' },
      { col1: 'ABC Waters projects', col2: 'Multiple projects', col3: '60+ completed within 10+ years' },
    ],
    sources: [
      { text: 'National Library Board Singapore (2023): Bishan-Ang Mo Kio Park official documentation' },
      { text: "Herbert Dreiseitl (2022): 'Blue-Green-Sponges in Urbanization' — Living Architecture Monitor" },
      { text: 'Urban Nature Atlas (2021): Case study documentation on Kallang River restoration' },
      { text: 'Henning Larsen Architects: Project documentation — Bishan-Ang Mo Kio Park and Kallang River' },
      { text: "Singapore's National University (2020): 'From Trash to Treasure: Kallang River Restoration'" },
    ],
    sourceLink: 'https://una.city/nbs/singapore/bishan-ang-mo-kio-park-kallang-river-restoration',
    images: [
      { src: '/images/SingaporeImage.png', caption: 'Bishan-Ang Mo Kio Park — naturalized river with restored floodplain, Singapore' },
    ],
  },
  {
    id: 'copenhagen',
    city: 'Copenhagen',
    emoji: '⛈️',
    color: '#8b5cf6',
    colorLight: '#ede9fe',
    programme: 'Cloudburst Management Plan',
    project: 'Tåsinge Plads & Climate Quarter Østerbro',
    tags: ['Extreme Events', 'Blue-Green Spaces', 'Cloudburst Resilience'],
    heroStats: [
      { value: '€800M', label: '2011 cloudburst damage' },
      { value: '€1.5B', label: 'Total plan investment' },
      { value: '€200M+', label: 'Savings vs pipe approach' },
      { value: '300', label: 'Projects over 20 years' },
    ],
    challenge: {
      title: 'The Challenge',
      text: "Before: Tåsinge Plads was a plain grass area and parking space (described as 'the dullest place on earth' by residents). The 2011 cloudburst caused €800 million in damage, with hospital flooding and 90,644 insurance claims. Traditional grey infrastructure could not handle extreme rainfall.",
    },
    solution: {
      title: 'The Solution & Transformation',
      text: 'After: Tåsinge Plads was transformed into a green oasis with sunken plaza design. The plaza collects and stores 1.8 million litres of stormwater from 10,500 m² (rooftops + roads). During dry periods, it functions as a recreational space with flowerbeds, seating, and community gathering areas. Designed by GHB Landscape Architects & City of Copenhagen.',
    },
    keyData: [
      { label: '2011 cloudburst damage', value: '€800 million (6 billion Danish kroner)' },
      { label: 'Insurance claims', value: '90,644' },
      { label: 'Rainfall event', value: '150 mm in less than 2 hours (1-in-1,000-year event)' },
      { label: 'Tåsinge Plads area serviced', value: '10,500 m² (7,500 m² roads + 3,000 m² rooftops)' },
      { label: 'Storage capacity', value: '1.8 million litres' },
      { label: 'Plan timeframe', value: '20 years (2012–2032), 300 projects across 8 catchment areas' },
      { label: 'Full cost of Cloudburst Plan', value: '€1.5 billion' },
    ],
    outcomeColumns: ['Metric', 'Value', 'Status'],
    outcomes: [
      { col1: 'Cost-benefit vs. grey infrastructure', col2: '€200+ million savings', col3: 'Verified (cost analysis, 2012)' },
      { col1: 'Stormwater detention capacity', col2: '1.8 million litres (Tåsinge alone)', col3: 'Operational (completed 2014)' },
      { col1: 'Flood damage reduction', col2: '70%+ for extreme events', col3: 'Modeled (100-year projection)' },
      { col1: 'Urban space quality', col2: '3 major plazas transformed', col3: 'Completed (2014–2017)' },
      { col1: 'Community space usage', col2: 'Cafes, recreation, gatherings', col3: 'Active (documented 2023)' },
    ],
    sources: [
      { text: 'City of Copenhagen (2012): Cloudburst Management Plan official documentation' },
      { text: "Weave News (2023): 'How Copenhagen's Most Devastating Rain Storm Inspired Climate Adaptation'" },
      { text: "Living Architecture Monitor (2023): 'Østerbro Klimakvarter — First Climate Adaptation Neighborhood'" },
      { text: "Centre for Liveable Cities Singapore (2019): 'Cloudburst Solutions in Copenhagen' — comparative study" },
      { text: "State of Green (2023): 'Copenhagen's First Climate Resilient Neighbourhood'" },
      { text: 'EU Climate Adaptation Platform: Case study documentation on Tåsinge Plads' },
    ],
    sourceLink: 'https://dac.dk/en/magazine/places/tasinge-plads-a-pioneering-project-for-the-climate-14',
    images: [
      { src: '/images/CopenhagenImage1.webp', caption: 'Tåsinge Plads — sunken plaza storing 1.8 million litres of stormwater' },
      { src: '/images/CopenhagenImage2.webp', caption: 'Copenhagen Climate Quarter — bioswales and blue-green street redesign' },
    ],
  },
  {
    id: 'rotterdam',
    city: 'Rotterdam',
    emoji: '🌊',
    color: '#10b981',
    colorLight: '#d1fae5',
    programme: 'Room for the River',
    project: 'Nijmegen Waal River Widening',
    tags: ['River Widening', 'Dike Relocation', 'Secondary Channel'],
    heroStats: [
      { value: '€2.3B', label: 'Total investment' },
      { value: '30+', label: 'Locations on 4 rivers' },
      { value: '16,000 m³/s', label: 'Discharge capacity' },
      { value: '2023', label: 'Saved from worst flooding' },
    ],
    challenge: {
      title: 'The Challenge',
      text: 'Before: Nijmegen sat at a bottleneck on the River Waal with constricted channel creating high flood risk. In 1993 and 1995, floods nearly breached dikes, forcing 200,000–250,000 evacuations. Climate projections (2000) showed future rainfall would exceed dike capacity. The city needed fundamental redesign.',
    },
    solution: {
      title: 'The Solution & Transformation',
      text: "After: Dike relocated 350 metres inland + excavated secondary channel (4 km long, 150–200 m wide). This widened the floodplain and created new urban island for recreation. Project completed 2015. Doubled the river's discharge capacity at that location, turning a danger into urban waterfront opportunity.",
    },
    keyData: [
      { label: 'Dike relocation', value: '350 metres inland from original position' },
      { label: 'Secondary channel length', value: '4 km' },
      { label: 'Secondary channel width', value: '150–200 metres' },
      { label: 'Excavated material', value: 'Nearly 5 million cubic metres of sand' },
      { label: 'Project cost', value: '€351 million (I-Lent consortium phase)' },
      { label: 'Total programme investment', value: '€2.3 billion (30+ locations, 4 rivers)' },
      { label: 'Construction dates', value: '2012–2015 (Nijmegen phase)' },
      { label: 'Designers', value: 'Royal Haskoning, I-Lent Consortium, City of Nijmegen' },
    ],
    outcomeColumns: ['Metric', 'Target', 'Verified Result'],
    outcomes: [
      { col1: 'Discharge capacity increase', col2: '16,000 m³/sec (1:1,250 year flood)', col3: 'Doubled at Nijmegen bottleneck' },
      { col1: 'River rise reduction', col2: 'Reduce flood levels upstream', col3: 'Measured: Significant reduction' },
      { col1: 'Urban development', col2: 'New island + parks + housing', col3: 'Completed: River park operational' },
      { col1: 'New bridges', col2: '3 bridges connecting Lent–Nijmegen', col3: 'Operational' },
      { col1: '2023 extreme rainfall event', col2: 'Test of system', col3: 'Saved country from worst flooding' },
      { col1: 'Program adoption', col2: '30+ locations nationwide', col3: 'Expanded beyond 2015; ongoing' },
    ],
    sources: [
      { text: "Dutch Water Sector (2015): 'Room for the River programme officially commissioned at Nijmegen'" },
      { text: "Scientific American (2024): 'How the Dutch Make Room for the River'" },
      { text: "Environment & Society Portal (2021): 'Metamorphosis of a Waterway: The City of Nijmegen'" },
      { text: 'Royal Haskoning: Project documentation — Room for the River Nijmegen' },
      { text: 'Rijkswaterstaat (Netherlands): Room for the River official programme documentation' },
      { text: 'Resilient Watersheds Toolbox: Natural Water Retention Measures case study' },
      { text: "PRX World (2016): 'Why Holland is Making Room for Water' — multimedia documentation" },
    ],
    sourceLink: 'https://www.dutchwatersector.com/news/biggest-icon-project-of-room-for-the-river-programme-officially-commissioned-at-nijmegen-the',
    images: [
      { src: '/images/RotterdamImages1.jpg', caption: 'Nijmegen — dike relocated 350m inland, new secondary channel excavated' },
      { src: '/images/RotterdamImages2.jpg', caption: 'Room for the River — new urban island and river park created at Lent' },
    ],
  },
];

const CaseStudies = ({ highlightedCaseTitle, clearHighlight }) => {
  const [activeId, setActiveId] = useState('singapore');

  useEffect(() => {
    if (highlightedCaseTitle) {
      const matched = CASE_STUDIES.find(cs =>
        cs.city.toLowerCase() === highlightedCaseTitle.toLowerCase() ||
        highlightedCaseTitle.toLowerCase().includes(cs.id) ||
        cs.programme.toLowerCase().includes(highlightedCaseTitle.toLowerCase())
      );
      if (matched) {
        setActiveId(matched.id);
        setTimeout(() => {
          document.getElementById('cs-top')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 200);
      }
      if (clearHighlight) clearHighlight();
    }
  }, [highlightedCaseTitle, clearHighlight]);

  const active = CASE_STUDIES.find(cs => cs.id === activeId);

  return (
    <div className="cs-page animate-fade-in" id="cs-top">

      {/* Page Header */}
      <div className="cs-page-header">
        <h2 className="cs-page-title">Global Case Studies</h2>
        <p className="cs-page-subtitle">
          Three cities. Three flood crises solved. One proven strategy: Blue-Green-Grey infrastructure.
        </p>
      </div>

      {/* City Tab Switcher */}
      <div className="cs-tab-bar">
        {CASE_STUDIES.map(cs => (
          <button
            key={cs.id}
            className={`cs-tab ${activeId === cs.id ? 'cs-tab-active' : ''}`}
            style={activeId === cs.id ? { borderBottomColor: cs.color, color: cs.color } : {}}
            onClick={() => setActiveId(cs.id)}
          >
            <span className="cs-tab-emoji">{cs.emoji}</span>
            <span>{cs.city}</span>
          </button>
        ))}
      </div>

      {/* Active Case Study Document */}
      {active && (
        <div className="cs-document animate-fade-in" key={active.id}>

          {/* Document Hero */}
          <div className="cs-doc-hero" style={{ borderLeftColor: active.color, background: active.colorLight }}>
            <div className="cs-doc-hero-top">
              <span className="cs-doc-emoji">{active.emoji}</span>
              <div>
                <div className="cs-doc-programme" style={{ color: active.color }}>{active.programme}</div>
                <h2 className="cs-doc-city">{active.city}: {active.programme}</h2>
                <div className="cs-doc-project">📍 {active.project}</div>
              </div>
            </div>

            <div className="cs-doc-tags">
              {active.tags.map((tag, i) => (
                <span key={i} className="cs-doc-tag" style={{ background: active.color + '18', color: active.color }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Hero Stats Row */}
            <div className="cs-hero-stats">
              {active.heroStats.map((s, i) => (
                <div key={i} className="cs-hero-stat">
                  <div className="cs-hero-stat-val" style={{ color: active.color }}>{s.value}</div>
                  <div className="cs-hero-stat-label">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Challenge + Solution */}
          <div className="cs-two-col">
            <div className="cs-section cs-challenge">
              <div className="cs-section-icon">⚠️</div>
              <h3 className="cs-section-title">{active.challenge.title}</h3>
              <p className="cs-section-text">{active.challenge.text}</p>
            </div>
            <div className="cs-section cs-solution">
              <div className="cs-section-icon">✅</div>
              <h3 className="cs-section-title">{active.solution.title}</h3>
              <p className="cs-section-text">{active.solution.text}</p>
            </div>
          </div>

          {/* Image Gallery */}
          {active.images && active.images.length > 0 && (
            <div className={`cs-image-gallery cs-gallery-${active.images.length}`}>
              {active.images.map((img, i) => (
                <figure key={i} className="cs-gallery-figure">
                  <img
                    src={img.src}
                    alt={img.caption}
                    className="cs-gallery-img"
                  />
                  <figcaption className="cs-gallery-caption">{img.caption}</figcaption>
                </figure>
              ))}
            </div>
          )}

          {/* Key Project Data */}
          <div className="cs-full-section">
            <h3 className="cs-section-title cs-with-icon">🏗️ Key Project Data</h3>
            <div className="cs-key-data-grid">
              {active.keyData.map((item, i) => (
                <div key={i} className="cs-key-data-item">
                  <div className="cs-key-data-label">{item.label}</div>
                  <div className="cs-key-data-value">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Measured Outcomes Table */}
          <div className="cs-full-section">
            <h3 className="cs-section-title cs-with-icon">📊 Measured Outcomes</h3>
            <div className="cs-table-wrap">
              <table className="cs-outcomes-table">
                <thead>
                  <tr>
                    {active.outcomeColumns.map((col, i) => (
                      <th key={i} style={i === 2 ? { color: active.color } : {}}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {active.outcomes.map((row, i) => (
                    <tr key={i}>
                      <td><strong>{row.col1}</strong></td>
                      <td>{row.col2}</td>
                      <td className="cs-outcome-result" style={{ color: active.color }}>{row.col3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>


          {/* Sources & References */}
          <div className="cs-full-section cs-sources-section">
            <h3 className="cs-section-title cs-with-icon">📚 Sources & References</h3>
            <ul className="cs-sources-list">
              {active.sources.map((src, i) => (
                <li key={i}>{src.text}</li>
              ))}
            </ul>
            <a
              href={active.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="cs-source-link"
              style={{ background: active.color }}
            >
              View Primary Source →
            </a>
          </div>

        </div>
      )}
    </div>
  );
};

export default CaseStudies;
