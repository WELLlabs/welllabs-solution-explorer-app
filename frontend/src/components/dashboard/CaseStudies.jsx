import React, { useState, useEffect } from 'react';

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
    <div className="flex flex-col gap-8 animate-[fadeInUp_0.4s_ease_both]" id="cs-top">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Page Header */}
      <div className="border-b-1.5 border-slate-200 pb-5 text-left">
        <h2 className="text-[26px] font-extrabold text-slate-900 m-0 mb-1.5 tracking-tight">Global Case Studies</h2>
        <p className="text-[15px] text-slate-500 m-0 leading-relaxed">
          Three cities. Three flood crises solved. One proven strategy: Blue-Green-Grey infrastructure.
        </p>
      </div>

      {/* City Tab Switcher */}
      <div className="flex gap-1 border-b-2 border-slate-200 pb-0">
        {CASE_STUDIES.map(cs => (
          <button
            key={cs.id}
            className={`flex items-center gap-2 px-6 py-3 bg-transparent border-none border-b-3 -mb-[2px] text-[15px] font-semibold transition-all duration-200 cursor-pointer rounded-t-lg ${activeId === cs.id ? 'bg-slate-50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50/50'}`}
            style={activeId === cs.id ? { borderBottomColor: cs.color, color: cs.color } : {}}
            onClick={() => setActiveId(cs.id)}
          >
            <span className="text-lg">{cs.emoji}</span>
            <span>{cs.city}</span>
          </button>
        ))}
      </div>

      {/* Active Case Study Document */}
      {active && (
        <div className="flex flex-col gap-7 animate-[fadeInUp_0.4s_ease_both]" key={active.id}>

          {/* Document Hero */}
          <div className="border-l-5 rounded-2xl p-8 flex flex-col gap-5 text-left" style={{ borderLeftColor: active.color, background: active.colorLight }}>
            <div className="flex items-center gap-5 md:flex-row flex-col text-left md:items-center items-start">
              <span className="text-[48px] leading-none shrink-0">{active.emoji}</span>
              <div>
                <div className="text-[13px] font-bold tracking-wider uppercase mb-1" style={{ color: active.color }}>{active.programme}</div>
                <h2 className="text-2xl font-extrabold text-slate-900 m-0 mb-1.5 tracking-tight">{active.city}: {active.programme}</h2>
                <div className="text-sm text-slate-500 font-medium">📍 {active.project}</div>
              </div>
            </div>

            <div className="flex gap-2 flex-wrap">
              {active.tags.map((tag, i) => (
                <span key={i} className="px-3 py-1 rounded-[20px] text-[12.5px] font-semibold" style={{ background: active.color + '18', color: active.color }}>
                  {tag}
                </span>
              ))}
            </div>

            {/* Hero Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-black/7 pt-5">
              {active.heroStats.map((s, i) => (
                <div key={i} className="flex flex-col gap-1 text-left">
                  <div className="text-[26px] font-extrabold leading-tight" style={{ color: active.color }}>{s.value}</div>
                  <div className="text-xs text-slate-500 font-medium leading-normal">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Challenge + Solution */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col gap-2.5 text-left shadow-sm border-t-4 border-t-amber-500">
              <div className="text-[22px]">⚠️</div>
              <h3 className="text-base font-bold text-slate-900 m-0">{active.challenge.title}</h3>
              <p className="text-[14.5px] text-slate-600 leading-relaxed m-0">{active.challenge.text}</p>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl p-7 flex flex-col gap-2.5 text-left shadow-sm border-t-4 border-t-emerald-500">
              <div className="text-[22px]">✅</div>
              <h3 className="text-base font-bold text-slate-900 m-0">{active.solution.title}</h3>
              <p className="text-[14.5px] text-slate-600 leading-relaxed m-0">{active.solution.text}</p>
            </div>
          </div>

          {/* Image Gallery */}
          {active.images && active.images.length > 0 && (
            <div className={`grid gap-4 rounded-2xl overflow-hidden ${active.images.length === 2 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
              {active.images.map((img, i) => (
                <figure key={i} className="m-0 flex flex-col gap-2 rounded-xl overflow-hidden border border-slate-200 group text-left">
                  <img
                    src={img.src}
                    alt={img.caption}
                    className="w-full h-auto block transition-transform duration-400 group-hover:scale-[1.02]"
                  />
                  <figcaption className="text-[12.5px] text-slate-500 px-3.5 py-2.5 bg-slate-50 leading-relaxed italic">{img.caption}</figcaption>
                </figure>
              ))}
            </div>
          )}

          {/* Key Project Data */}
          <div className="bg-white border border-slate-200 rounded-2xl p-7 md:px-8 text-left shadow-sm">
            <h3 className="text-base md:text-[17px] font-bold text-slate-900 m-0 mb-4">🏗️ Key Project Data</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {active.keyData.map((item, i) => (
                <div key={i} className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-1 text-left">
                  <div className="text-[11.5px] font-bold text-slate-400 uppercase tracking-wider">{item.label}</div>
                  <div className="text-sm font-semibold text-slate-900 leading-snug">{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Measured Outcomes Table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-7 md:px-8 text-left shadow-sm">
            <h3 className="text-base md:text-[17px] font-bold text-slate-900 m-0 mb-4">📊 Measured Outcomes</h3>
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full border-collapse text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    {active.outcomeColumns.map((col, i) => (
                      <th key={i} className="px-4 py-3 text-left text-[12.5px] font-bold text-slate-500 uppercase tracking-wider" style={i === 2 ? { color: active.color } : {}}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {active.outcomes.map((row, i) => (
                    <tr key={i} className="border-b border-slate-100 hover:bg-slate-50/50 last:border-none">
                      <td className="px-4 py-3.5 text-slate-700 leading-relaxed text-left"><strong>{row.col1}</strong></td>
                      <td className="px-4 py-3.5 text-slate-700 leading-relaxed text-left">{row.col2}</td>
                      <td className="px-4 py-3.5 leading-relaxed text-left font-bold" style={{ color: active.color }}>{row.col3}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sources & References */}
          <div className="bg-white border border-slate-200 rounded-2xl p-7 md:px-8 flex flex-col gap-4 text-left shadow-sm">
            <h3 className="text-base md:text-[17px] font-bold text-slate-900 m-0 mb-4">📚 Sources & References</h3>
            <ul className="list-none p-0 m-0 flex flex-col gap-2 text-left">
              {active.sources.map((src, i) => (
                <li key={i} className="text-[13.5px] text-slate-600 leading-relaxed p-2.5 bg-slate-50 rounded-lg border-l-3 border-slate-200">{src.text}</li>
              ))}
            </ul>
            <a
              href={active.sourceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg text-white text-[13.5px] font-semibold hover:opacity-85 transition-opacity self-start no-underline"
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
