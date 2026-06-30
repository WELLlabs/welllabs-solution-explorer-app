import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './NewProjectsView.css';

/* ============ helpers ============ */
const cr = v => '₹' + (v / 100).toFixed(2) + ' Cr';
const lk = v => '₹' + v.toFixed(0) + ' L';
const rs = v => v >= 100 ? cr(v) : lk(v);
const m3 = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M m³' : n >= 1e3 ? Math.round(n / 1e3) + 'k m³' : Math.round(n) + ' m³';
const runoff = (P, CN) => {
  const S = 25400 / CN - 254;
  const Ia = 0.2 * S;
  return P <= Ia ? 0 : Math.pow(P - Ia, 2) / (P - Ia + S);
};
const initials = s => s.split(' ').filter(w => /[A-Za-z]/.test(w[0])).slice(0, 2).map(w => w[0]).join('').toUpperCase();

/* ============ implementing agencies ============ */
const AG = {
  welllabs: {
    name: 'WELL Labs',
    type: 'Research institute',
    role: 'Design & science lead',
    blurb: 'Hydrology, water-balance and DPR specialists; co-created the Lake Rejuvenation Framework and the VWBA-aligned monitoring used on this platform.',
    strengths: ['Hydrology', 'Water balance', 'DPR', 'VWBA / M&E'],
    phases: [1, 2, 4],
    known: 'Lake Rejuvenation Framework · Chintamani & Jakkur studies'
  },
  fol: {
    name: 'Friends of Lakes',
    type: 'Citizen group',
    role: 'Restoration & stewardship',
    blurb: 'On-ground restoration and long-running community stewardship of Bengaluru lakes.',
    strengths: ['Restoration', 'Community', 'Long-term O&M'],
    phases: [3, 5],
    known: 'Jakkur Lake restoration'
  },
  malligavad: {
    name: 'Malligavad Foundation',
    type: 'Restoration NGO',
    role: 'Implementation at scale',
    blurb: 'Rapid, CSR-funded restoration — desilting, bunds and natural treatment — led by Anand Malligavad, “the Lake Man of India”.',
    strengths: ['Desilting', 'Earthworks', 'CSR delivery'],
    phases: [3],
    known: 'Kyalasanahalli & dozens of revived lakes'
  },
  biome: {
    name: 'Biome Environmental Trust',
    type: 'Water trust',
    role: 'Recharge & blue-green',
    blurb: 'Groundwater recharge, open wells and rainwater systems — strengthens the blue and green assets.',
    strengths: ['Recharge', 'Open wells', 'Rainwater'],
    phases: [2, 3],
    known: 'Bengaluru recharge & wells programmes'
  },
  unitedway: {
    name: 'United Way Bengaluru',
    type: 'CSR facilitator',
    role: 'Programme & CSR management',
    blurb: 'Manages CSR funds, Schedule-VII compliance and multi-stakeholder coordination, with milestone-linked disbursement and reporting.',
    strengths: ['CSR compliance', 'Fund management', 'Reporting'],
    phases: [1, 2, 3, 4, 5],
    known: 'Lake & water CSR programmes'
  },
  trust: {
    name: 'Lake committee trust',
    type: 'Local trust',
    role: 'Community O&M',
    blurb: 'A residents-and-civic-body trust (a MAPSAS-style model) that holds long-term operation and maintenance after handover.',
    strengths: ['Governance', 'Maintenance', 'Local oversight'],
    phases: [5],
    known: 'MAPSAS-style community management'
  }
};

/* ============ projects list ============ */
const PROJECTS = [
  {
    id: 'kasavanahalli',
    name: 'Kasavanahalli Lake',
    loc: 'Sarjapur Road · East Bengaluru',
    status: 'Design · Phase 2',
    scale: 'M',
    area: 21,
    catchment: 6.5,
    imperv: 62,
    P: 90,
    cnBase: 88,
    cnProj: 80,
    annualVWB: 620000,
    people: 11000,
    recharge: 380000,
    short: 'A 21-ha tech-corridor tank whose lost storage now spills into HSR and Sarjapur streets each monsoon.',
    team: ['welllabs', 'malligavad', 'unitedway', 'trust'],
    alts: ['fol', 'biome'],
    funders: [
      { name: 'Indus Semiconductor Foundation', sector: 'Semiconductors', idx: [0, 1], date: 'Apr 2026' },
      { name: 'Kaveri Mobility CSR', sector: 'Auto / mobility', idx: [2], date: 'May 2026' },
      { name: 'Lumen Cloud Foundation', sector: 'IT services', idx: [5], date: 'Jun 2026' }
    ],
    assets: [
      { n: 'Diagnosis, bathymetry & DPR', t: 'grey', cost: 38, phase: 1, vwb: 0, fn: 'Survey, water balance and the costed Detailed Project Report.' },
      { n: 'Community visioning & committee', t: 'green', cost: 14, phase: 1, vwb: 0, fn: 'Participatory visioning; forms the committee that will run O&M.' },
      { n: 'Sewage diversion & interception', t: 'grey', cost: 62, phase: 3, vwb: 0, enabler: true, fn: 'Stops dry-weather sewage — precondition for every other asset.' },
      { n: 'Desilting & live-storage recovery', t: 'blue', cost: 138, phase: 3, vwb: 210000, fn: 'Recovers ~1 m of depth, restoring flood-buffer storage.' },
      { n: 'Peripheral bund & outlet weir', t: 'grey', cost: 70, phase: 3, vwb: 0, fn: '0.6 m freeboard + weir to pass the design storm safely.' },
      { n: 'Inlet silt trap & forebay', t: 'grey', cost: 28, phase: 3, vwb: 0, fn: 'Drops silt before the main lake — protects recovered storage.' },
      { n: 'Constructed wetland', t: 'green', cost: 40, phase: 3, vwb: 0, cn: .5, fn: 'Polishes inflow; lowers the catchment curve number.' },
      { n: 'Recharge well field', t: 'blue', cost: 22, phase: 3, vwb: 0, cn: .3, fn: 'Sends held stormwater to the aquifer, not the roads.' },
      { n: 'Shoreline buffer & planting', t: 'green', cost: 8, phase: 3, vwb: 0, cn: .2, fn: 'Native edge that stabilises the bank and supports birdlife.' }
    ]
  },
  {
    id: 'doddakannelli',
    name: 'Doddakannelli Lake',
    loc: 'Sarjapur · Wipro corridor',
    status: 'Diagnosis · Phase 1',
    scale: 'S',
    area: 8,
    catchment: 2.2,
    imperv: 55,
    P: 90,
    cnBase: 86,
    cnProj: 78,
    annualVWB: 200000,
    people: 7400,
    recharge: 140000,
    short: 'An 8-ha neighbourhood lake that overflows onto connecting roads in heavy rain.',
    team: ['welllabs', 'fol', 'unitedway', 'trust'],
    alts: ['malligavad', 'biome'],
    funders: [{ name: 'Sarjapur Tech Park CSR', sector: 'Commercial real estate', idx: [0], date: 'Jun 2026' }],
    assets: [
      { n: 'Diagnosis, survey & DPR', t: 'grey', cost: 24, phase: 1, vwb: 0, fn: 'Survey, water balance and DPR for the lake and its catchment.' },
      { n: 'Community visioning & committee', t: 'green', cost: 9, phase: 1, vwb: 0, fn: 'Agreeing the lake’s purpose; forming the O&M committee.' },
      { n: 'Sewage diversion', t: 'grey', cost: 34, phase: 3, vwb: 0, enabler: true, fn: 'Intercepts dry-weather sewage before any desilting starts.' },
      { n: 'Desilting & storage recovery', t: 'blue', cost: 62, phase: 3, vwb: 64000, fn: 'Recovers ~0.8 m of live storage to buffer inflow.' },
      { n: 'Bund & outlet', t: 'grey', cost: 38, phase: 3, vwb: 0, fn: 'Rebuilt bund and controlled outlet for the design storm.' },
      { n: 'Inlet forebay', t: 'grey', cost: 16, phase: 3, vwb: 0, fn: 'Settles silt at the inlet before it reaches the lake.' },
      { n: 'Constructed wetland', t: 'green', cost: 19, phase: 3, vwb: 0, cn: .6, fn: 'Treats inflow and reduces catchment runoff.' },
      { n: 'Recharge wells', t: 'blue', cost: 8, phase: 3, vwb: 0, cn: .4, fn: 'Directs held water into the shallow aquifer.' }
    ]
  },
  {
    id: 'varthur',
    name: 'Varthur Lake — Zone 1',
    loc: 'Varthur · downstream of Bellandur',
    status: 'Diagnosis · Phase 1',
    scale: 'L',
    area: 60,
    catchment: 12,
    imperv: 58,
    P: 90,
    cnBase: 90,
    cnProj: 82,
    annualVWB: 640000,
    people: 20000,
    recharge: 520000,
    short: 'A flood-critical lake at the bottom of the eastern valley; Zone 1 protects thousands of downstream homes.',
    team: ['welllabs', 'malligavad', 'unitedway', 'trust'],
    alts: ['fol', 'biome'],
    funders: [
      { name: 'Bellandur Valley Foundation', sector: 'Banking & finance', idx: [0], date: 'Mar 2026' },
      { name: 'Eastside Community Trust', sector: 'Philanthropy', idx: [1], date: 'May 2026' }
    ],
    assets: [
      { n: 'Diagnosis, bathymetry & DPR', t: 'grey', cost: 70, phase: 1, vwb: 0, fn: 'Full bathymetric & topographic survey and Zone-1 DPR.' },
      { n: 'Multi-village visioning', t: 'green', cost: 28, phase: 1, vwb: 0, fn: 'Consensus-building across communities around the lake.' },
      { n: 'Sewage interception & diversion', t: 'grey', cost: 180, phase: 3, vwb: 0, enabler: true, fn: 'Large-scale interception of dry-weather flows — the enabler.' },
      { n: 'Desilting & storage recovery (Zone 1)', t: 'blue', cost: 300, phase: 3, vwb: 720000, fn: 'Recovers ~1.2 m across 60 ha — biggest flood-buffer gain.' },
      { n: 'Bund rehabilitation & outlet sluice', t: 'grey', cost: 168, phase: 3, vwb: 0, fn: 'Strengthened bund and gated sluice for the design flood.' },
      { n: 'Inlet forebays & silt traps (2)', t: 'grey', cost: 86, phase: 3, vwb: 0, fn: 'Two forebays drop silt before the restored basin.' },
      { n: 'Constructed wetland complex', t: 'green', cost: 96, phase: 3, vwb: 0, cn: .6, fn: 'Treats inflow and reduces catchment runoff.' },
      { n: 'Recharge well field', t: 'blue', cost: 22, phase: 3, vwb: 0, cn: .25, fn: 'Sends held water into the aquifer.' },
      { n: 'Shoreline, buffer & access', t: 'green', cost: 10, phase: 3, vwb: 0, cn: .15, fn: 'Buffer planting and safe public access.' }
    ]
  },
  {
    id: 'halanayakanahalli',
    name: 'Halanayakanahalli Lake',
    loc: 'Sarjapur Road · Carmelaram',
    status: 'Diagnosis · Phase 1',
    scale: 'S',
    area: 12,
    catchment: 3.4,
    imperv: 58,
    P: 90,
    cnBase: 87,
    cnProj: 79,
    annualVWB: 300000,
    people: 8600,
    recharge: 190000,
    short: 'Newly listed. A 12-ha lake on the Sarjapur belt where early funding shapes the design itself.',
    team: ['welllabs', 'fol', 'unitedway'],
    alts: ['malligavad', 'biome', 'trust'],
    funders: [],
    assets: [
      { n: 'Diagnosis, survey & DPR', t: 'grey', cost: 30, phase: 1, vwb: 0, fn: 'Survey, water balance and DPR for the lake and catchment.' },
      { n: 'Community visioning & committee', t: 'green', cost: 10, phase: 1, vwb: 0, fn: 'Agreeing purpose with residents; forming the O&M committee.' },
      { n: 'Sewage diversion', t: 'grey', cost: 44, phase: 3, vwb: 0, enabler: true, fn: 'Intercepts dry-weather sewage — funded first.' },
      { n: 'Desilting & storage recovery', t: 'blue', cost: 92, phase: 3, vwb: 108000, fn: 'Recovers ~0.9 m of live flood storage.' },
      { n: 'Bund & outlet', t: 'grey', cost: 48, phase: 3, vwb: 0, fn: 'Bund and controlled outlet sized to the design storm.' },
      { n: 'Inlet forebay', t: 'grey', cost: 20, phase: 3, vwb: 0, fn: 'Settles incoming silt before the lake.' },
      { n: 'Constructed wetland', t: 'green', cost: 26, phase: 3, vwb: 0, cn: .6, fn: 'Treats inflow and lowers catchment runoff.' },
      { n: 'Recharge wells', t: 'blue', cost: 10, phase: 3, vwb: 0, cn: .4, fn: 'Directs held water into the aquifer.' }
    ]
  },
  {
    id: 'saulkere',
    name: 'Saul Kere',
    loc: 'Bellandur · Outer Ring Road',
    status: 'Diagnosis · Phase 1',
    scale: 'M',
    area: 18,
    catchment: 5.2,
    imperv: 64,
    P: 90,
    cnBase: 89,
    cnProj: 81,
    annualVWB: 480000,
    people: 13200,
    recharge: 300000,
    short: 'Newly listed. An 18-ha ORR lake in a heavily built catchment that backs up onto arterial roads.',
    team: ['welllabs', 'biome', 'unitedway'],
    alts: ['malligavad', 'fol', 'trust'],
    funders: [],
    assets: [
      { n: 'Diagnosis, survey & DPR', t: 'grey', cost: 34, phase: 1, vwb: 0, fn: 'Survey, water balance and DPR.' },
      { n: 'Community visioning & committee', t: 'green', cost: 12, phase: 1, vwb: 0, fn: 'Visioning with residents; forming the O&M committee.' },
      { n: 'Sewage diversion & interception', t: 'grey', cost: 56, phase: 3, vwb: 0, enabler: true, fn: 'Stops dry-weather sewage — the enabling asset.' },
      { n: 'Desilting & storage recovery', t: 'blue', cost: 120, phase: 3, vwb: 180000, fn: 'Recovers ~1 m of live storage across 18 ha.' },
      { n: 'Peripheral bund & outlet weir', t: 'grey', cost: 64, phase: 3, vwb: 0, fn: 'Bund + weir to hold and release the design storm.' },
      { n: 'Inlet silt trap & forebay', t: 'grey', cost: 24, phase: 3, vwb: 0, fn: 'Drops silt before the main lake.' },
      { n: 'Constructed wetland', t: 'green', cost: 36, phase: 3, vwb: 0, cn: .5, fn: 'Polishes inflow; lowers catchment runoff.' },
      { n: 'Recharge well field', t: 'blue', cost: 8, phase: 3, vwb: 0, cn: .3, fn: 'Sends held water to the aquifer.' },
      { n: 'Shoreline buffer & planting', t: 'green', cost: 6, phase: 3, vwb: 0, cn: .2, fn: 'Native buffer along the restored edge.' }
    ]
  }
];

// Preprocess PROJECTS to add totals, percentages, and group types
PROJECTS.forEach(p => {
  p.total = p.assets.reduce((s, a) => s + a.cost, 0);
  p.fundedIdx = new Set(p.funders.flatMap(f => f.idx));
  p.funders.forEach(f => f.amount = f.idx.reduce((s, i) => s + p.assets[i].cost, 0));
  p.committed = [...p.fundedIdx].reduce((s, i) => s + p.assets[i].cost, 0);
  p.committedPct = p.committed / p.total;
  p.enablerIdx = p.assets.findIndex(a => a.enabler);
  p.fullStorage = p.assets.reduce((s, a) => s + (a.vwb || 0), 0);
  p.fullCN = p.assets.reduce((s, a) => s + (a.cn || 0), 0);
  p.group = p.status.includes('Implementation') ? 'Implementation' : p.status.includes('Design') ? 'Design' : 'Diagnosis';
});

/* impact of a set of asset indices (Set or array) */
function impactOf(p, set) {
  const has = i => set.has ? set.has(i) : set.includes(i);
  const idx = p.assets.map((_, i) => i).filter(has);
  const enablerOK = p.enablerIdx < 0 || has(p.enablerIdx);
  const storage = enablerOK ? idx.reduce((s, i) => s + (p.assets[i].vwb || 0), 0) : 0;
  const storageBlocked = !enablerOK ? idx.reduce((s, i) => s + (p.assets[i].vwb || 0), 0) : 0;
  const selCN = idx.reduce((s, i) => s + (p.assets[i].cn || 0), 0);
  const retFrac = p.fullCN ? selCN / p.fullCN : 0;
  const cnEff = p.cnBase - (p.cnBase - p.cnProj) * retFrac;
  const eventRetained = Math.max(0, runoff(p.P, p.cnBase) - runoff(p.P, cnEff)) / 1000 * p.catchment * 1e6;
  const storFrac = p.fullStorage ? storage / p.fullStorage : 0;
  const annual = p.annualVWB * (0.55 * storFrac + 0.45 * retFrac);
  const people = Math.round(p.people * (p.annualVWB ? annual / p.annualVWB : 0));
  return { storage, storageBlocked, eventRetained, annual, people, cnEff, retFrac, enablerOK };
}

const MONTHS = {
  S: ['M0–2', 'M2–4', 'M4–14', 'M14–26', 'M26+'],
  M: ['M0–3', 'M3–6', 'M6–18', 'M18–30', 'M30+'],
  L: ['M0–4', 'M4–8', 'M8–24', 'M24–40', 'M40+']
};

const PHASES = [
  { t: 'Diagnosis & visioning', b: ['Bathymetric & topographic survey', 'Water balance + pollution mapping', 'Participatory visioning with the community'] },
  { t: 'Design', b: ['Detailed Project Report', 'Engineered blue / green / grey assets', 'Costed milestone schedule'] },
  { t: 'Implementation', b: ['Sewage diverted first', 'Desilting + bund + structures', 'Wetland & buffer planted'] },
  { t: 'Monitoring & evaluation', b: ['Water level & quality logged', 'Recharge tracked at borewells', 'Volumetric benefit verified'] },
  { t: 'Operation & governance', b: ['Lake committee runs O&M', 'Inlets kept clear, sewage out', 'Annual assured impact ledger'] }
];

const TABS = [
  ['overview', 'Overview'],
  ['timeline', 'Timeline'],
  ['assets', 'Assets'],
  ['impact', 'Impact'],
  ['funding', 'Funding'],
  ['agency', 'Agency'],
  ['docs', 'Docs']
];

const NewProjectsView = () => {
  const location = useLocation();

  // Bulletproof function to parse project ID from React Router or window location search parameters
  const getQueryProjectId = () => {
    try {
      const search = location.search || window.location.search;
      if (!search) return null;
      const params = new URLSearchParams(search);
      const id = params.get('id');
      if (!id) return null;
      const cleanId = id.trim().toLowerCase();
      return PROJECTS.some(p => p.id === cleanId) ? cleanId : null;
    } catch (e) {
      console.error('Error parsing query project id:', e);
      return null;
    }
  };

  const initialProjectId = getQueryProjectId() || PROJECTS[0].id;

  // React Component State
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId);
  const [activeTab, setActiveTab] = useState('overview');
  const [activePhase, setActivePhase] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedPicks, setSelectedPicks] = useState(new Set());
  const [fundingMode, setFundingMode] = useState('assets');
  const [customAmount, setCustomAmount] = useState(0);
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);
  const [openAccordions, setOpenAccordions] = useState(new Set(['m-vwba']));
  const [searchText, setSearchText] = useState('');
  const [showCommitDialog, setShowCommitDialog] = useState(false);
  const [simulationRainfall, setSimulationRainfall] = useState(90);

  // Sync state with URL parameter if it changes
  useEffect(() => {
    const queryId = getQueryProjectId();
    if (queryId && queryId !== selectedProjectId) {
      setSelectedProjectId(queryId);
      // Reset active tab & selections when project changes via URL
      setActiveTab('overview');
      setSelectedPicks(new Set());
      setCustomAmount(0);
    }
  }, [location.search, window.location.search]);

  const p = PROJECTS.find(x => x.id === selectedProjectId) || PROJECTS[0];
  const activeSet = new Set([...p.fundedIdx, ...selectedPicks]);
  const unfunded = p.assets.map((_, i) => i).filter(i => !p.fundedIdx.has(i));

  // Initialize phase when active project changes
  useEffect(() => {
    setActivePhase(p.group === 'Implementation' ? 2 : p.group === 'Design' ? 1 : 0);
    setSelectedAgencyId(p.team[0]);
  }, [selectedProjectId]);

  // Aggregate stats for the strip
  const totalProjects = PROJECTS.length;
  const totalVwb = PROJECTS.reduce((s, proj) => s + proj.annualVWB, 0);
  const totalCost = PROJECTS.reduce((s, proj) => s + proj.total, 0);
  const totalPeople = PROJECTS.reduce((s, proj) => s + proj.people, 0);

  // Filter project rail matches
  const railMatches = PROJECTS.filter(proj => {
    const q = searchText.trim().toLowerCase();
    const hitQ = !q || (proj.name + ' ' + proj.loc).toLowerCase().includes(q);
    const hitF = selectedFilter === 'All' || (selectedFilter === 'New' ? proj.committedPct === 0 : proj.group === selectedFilter);
    return hitQ && hitF;
  });

  // SVG Renderers in JSX
  const renderGauge = (pct) => {
    const l = 104 - pct * 0.78 * 104;
    return (
      <svg viewBox="0 0 320 118" width="100%" height="100%" preserveAspectRatio="none">
        <rect width="320" height="118" fill="#eef3f0" />
        <line x1="0" y1={104 - 81} x2="320" y2={104 - 81} stroke="#b9c2b6" strokeDasharray="5 4" />
        <path d={`M0,${l} C60,${l - 7} 120,${l + 6} 180,${l} C240,${l - 6} 290,${l + 5} 320,${l} L320,118 L0,118 Z`} fill="#0E8C8C" opacity=".85" />
        <path d={`M0,${l + 5} C60,${l - 2} 120,${l + 11} 180,${l + 5} C240,${l - 1} 290,${l + 10} 320,${l + 5} L320,118 L0,118 Z`} fill="#0A6A6A" opacity=".5" />
      </svg>
    );
  };

  const renderTank = (cP, yP) => {
    const H = 300;
    const top = H * 0.1;
    const u = H - top - 1;
    const cy = H - cP * u;
    const yy = H - Math.min(1, cP + yP) * u;
    const w = (y, o, c) => (
      <path d={`M0,${y} C70,${y - 9} 150,${y + 8} 230,${y} C290,${y - 6} 320,${y + 6} 320,${y} L320,${H} L0,${H} Z`} fill={c} opacity={o} />
    );
    return (
      <svg viewBox={`0 0 320 ${H}`} width="100%" height="100%" preserveAspectRatio="none">
        <rect width="320" height={H} fill="#eef3f0" />
        <line x1="0" y1={top} x2="320" y2={top} stroke="#b9c2b6" strokeDasharray="5 4" />
        <text x="12" y={top - 7} fontFamily="IBM Plex Mono" fontSize="11" fill="#3A5256">fully funded</text>
        {w(yy, 0.45, '#5BC8B8')}
        {w(cy, 0.9, '#0E8C8C')}
        {w(cy + 6, 0.5, '#0A6A6A')}
      </svg>
    );
  };

  const renderPhaseArt = (i) => {
    const parts = [
      <g key="0">
        <path d="M52,128 C92,142 128,142 168,128 L168,138 C128,150 92,150 52,138 Z" fill="#7d7a55" />
        <rect x="6" y="82" width="28" height="11" rx="2" fill="#6b6f72" />
        <path d="M32,96 q7,12 -2,22" stroke="#6b6f72" strokeWidth="3.5" fill="none" />
        <text x="110" y="56" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="11" fill="#9a8f76">silted · sewage-fed</text>
      </g>,
      <g key="1">
        <path d="M44,92 C82,152 138,152 176,92" fill="none" stroke="#0E8C8C" strokeWidth="2" strokeDasharray="6 4" />
        <line x1="40" y1="92" x2="180" y2="92" stroke="#0E8C8C" strokeDasharray="3 4" />
        <path d="M52,126 C92,140 128,140 168,126 L168,134 C128,146 92,146 52,134 Z" fill="#8a8666" />
        <text x="110" y="56" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="11" fill="#0A6A6A">DPR · sized to design storm</text>
      </g>,
      <g key="2">
        <path d="M48,106 C88,152 134,152 172,106 L172,116 C134,154 88,154 48,116 Z" fill="#3f8fa8" />
        <path d="M48,106 C88,144 134,144 172,106" fill="#2A7DA3" opacity=".55" />
        <rect x="172" y="88" width="16" height="18" fill="#5C6E78" />
        <path d="M30,96 q9,-18 18,0" fill="#5E8C42" />
        <text x="108" y="56" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="11" fill="#0A6A6A">bund · wetland · filling</text>
      </g>,
      <g key="3">
        <path d="M44,90 C84,152 138,152 178,90 L178,100 C138,156 84,156 44,100 Z" fill="#2A7DA3" />
        <path d="M44,90 C84,140 138,140 178,90" fill="#5BC8B8" opacity=".5" />
        <rect x="108" y="62" width="4" height="30" fill="#0C2A2E" />
        <circle cx="110" cy="62" r="6" fill="#C8743C" />
        <path d="M26,90 q10,-20 20,0" fill="#5E8C42" />
        <path d="M174,90 q10,-20 20,0" fill="#5E8C42" />
        <text x="110" y="48" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="11" fill="#0A6A6A">verified · monitored</text>
      </g>,
      <g key="4">
        <path d="M42,86 C82,152 140,152 180,86 L180,96 C140,158 82,158 42,96 Z" fill="#1C6E8C" />
        <path d="M42,86 C82,136 140,136 180,86" fill="#5BC8B8" opacity=".5" />
        <path d="M22,86 q11,-22 22,0" fill="#5E8C42" />
        <path d="M176,86 q11,-22 22,0" fill="#5E8C42" />
        <path d="M94,70 q5,-5 10,0" stroke="#0C2A2E" strokeWidth="1.6" fill="none" />
        <path d="M112,72 q5,-5 10,0" stroke="#0C2A2E" strokeWidth="1.6" fill="none" />
        <text x="110" y="48" textAnchor="middle" fontFamily="IBM Plex Mono" fontSize="11" fill="#0A6A6A">thriving · community-run</text>
      </g>
    ];

    return (
      <svg viewBox="0 0 220 190" width="100%" height="100%" preserveAspectRatio="none" aria-hidden="true">
        <rect width="220" height="190" fill="#eaf0ec" />
        <path d="M0,96 L40,96 C72,150 148,150 180,96 L220,96 L220,190 L0,190 Z" fill="#cdbfa6" />
        {parts[i]}
      </svg>
    );
  };

  // Toggle selected assets in picker
  const togglePick = (idx) => {
    const nextPicks = new Set(selectedPicks);
    if (nextPicks.has(idx)) {
      nextPicks.delete(idx);
    } else {
      nextPicks.add(idx);
    }
    setSelectedPicks(nextPicks);
  };

  // Toggle Document accordions
  const toggleAccordion = (key) => {
    const nextAcc = new Set(openAccordions);
    if (nextAcc.has(key)) {
      nextAcc.delete(key);
    } else {
      nextAcc.add(key);
    }
    setOpenAccordions(nextAcc);
  };

  // Term Sheet commitment overlay renderer
  const renderCommitBody = () => {
    if (fundingMode === 'assets') {
      const picks = Array.from(selectedPicks).map(i => p.assets[i]);
      const totalCost = picks.reduce((s, a) => s + a.cost, 0);
      return (
        <div>
          <h4>Project: {p.name}</h4>
          <p>You have selected the following blue-green-grey assets to build a water security commitment:</p>
          <table className="dlg-table">
            <thead>
              <tr>
                <th>Asset Item</th>
                <th>Type</th>
                <th>Cost (Lakhs)</th>
              </tr>
            </thead>
            <tbody>
              {picks.map((a, idx) => (
                <tr key={idx}>
                  <td>{a.n}</td>
                  <td><span className={`tag ${a.t}`}>{a.t}</span></td>
                  <td className="m">{rs(a.cost)}</td>
                </tr>
              ))}
              <tr style={{ fontWeight: 'bold', borderTop: '2px solid var(--ink)' }}>
                <td>Total Commitment</td>
                <td>—</td>
                <td className="m" style={{ color: 'var(--teal)' }}>{rs(totalCost)}</td>
              </tr>
            </tbody>
          </table>
          <div className="cta-row" style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={() => { alert('Commitment submitted successfully! Thank you for your support.'); setShowCommitDialog(false); }}>Confirm Commitment</button>
            <button className="btn btn-ghost" onClick={() => setShowCommitDialog(false)}>Cancel</button>
          </div>
        </div>
      );
    } else {
      let customAllocated = [];
      let tempCost = customAmount;
      for (let idx of unfunded) {
        const asset = p.assets[idx];
        if (tempCost >= asset.cost) {
          customAllocated.push({ n: asset.n, cost: asset.cost, partial: false });
          tempCost -= asset.cost;
        } else if (tempCost > 0) {
          customAllocated.push({ n: asset.n, cost: tempCost, partial: true });
          tempCost = 0;
          break;
        } else {
          break;
        }
      }
      return (
        <div>
          <h4>Project: {p.name}</h4>
          <p>You are making a custom CSR commitment of <strong>{rs(customAmount)}</strong>. This will fund or build the following sequential assets:</p>
          <table className="dlg-table">
            <thead>
              <tr>
                <th>Asset Item</th>
                <th>Allocation</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {customAllocated.map((item, idx) => (
                <tr key={idx}>
                  <td>{item.n}</td>
                  <td className="m">{rs(item.cost)}</td>
                  <td>{item.partial ? <span className="tag grey">Partial Funding</span> : <span className="tag green">Full Funding</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="cta-row" style={{ marginTop: '20px' }}>
            <button className="btn btn-primary" onClick={() => { alert('CSR Commitment registered successfully! Thank you.'); setShowCommitDialog(false); }}>Confirm Commitment</button>
            <button className="btn btn-ghost" onClick={() => setShowCommitDialog(false)}>Cancel</button>
          </div>
        </div>
      );
    }
  };

  // Render Inner Workspace Tab Panels
  const renderActivePanel = () => {
    const activeImpact = impactOf(p, activeSet);

    switch (activeTab) {
      case 'overview':
        const maxFlood = impactOf(p, p.assets.map((_, i) => i)).storage;
        return (
          <div className="animate-fade-in">
            <div className="kfacts">
              <div className="k"><b>{cr(p.total)}</b><span>Intervention cost</span></div>
              <div className="k"><b>{p.area} ha</b><span>Water spread</span></div>
              <div className="k"><b>{p.catchment} km²</b><span>Catchment</span></div>
              <div className="k"><b>{p.imperv}%</b><span>Built-up</span></div>
            </div>
            <div className="ov-grid">
              <div>
                <p className="lead">{p.short}</p>
                <div className="cobens">
                  <span className="coben">{m3(maxFlood)} max flood storage</span>
                  <span className="coben">{(p.annualVWB / 1e6).toFixed(2)}M m³/yr potential VWB</span>
                  <span className="coben">{p.people.toLocaleString('en-IN')} people</span>
                  <span className="coben">{p.funders.length ? (`Backed by ${p.funders.length} partner${p.funders.length > 1 ? 's' : ''}`) : 'Open — no commitments yet'}</span>
                </div>
                <div className="cta-row">
                  <button className="btn btn-primary" onClick={() => setActiveTab('funding')}>Fund this project →</button>
                  <button className="btn btn-ghost" onClick={() => setActiveTab('assets')}>Browse assets</button>
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="ov-mini-tank" style={{ height: '170px' }}>{renderTank(p.committedPct, 0)}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--ink-2)', marginTop: '8px' }}>
                  <b style={{ color: 'var(--ink)' }}>{rs(p.committed)}</b> committed · <b style={{ color: 'var(--ink)' }}>{rs(p.total - p.committed)}</b> still needed
                </div>
              </div>
            </div>
          </div>
        );

      case 'timeline':
        const i = activePhase;
        const built = i >= 2;
        const cum = i < 2 ? p.assets.filter(a => a.phase === 1).reduce((s, a) => s + a.cost, 0) : p.total;
        return (
          <div className="animate-fade-in">
            <div className="ph-pills">
              {PHASES.map((ph, k) => (
                <button key={k} className={k === i ? 'on' : ''} onClick={() => setActivePhase(k)}>
                  <span className="pn">{MONTHS[p.scale][k]} · P{k + 1}</span>
                  <span className="pt">{ph.t}</span>
                </button>
              ))}
            </div>
            <div className="ph-detail">
              <div className="ph-art">{renderPhaseArt(i)}</div>
              <div>
                <div className="ph-when">{MONTHS[p.scale][i]} · Phase {i + 1}</div>
                <h4>{PHASES[i].t}</h4>
                <ul>
                  {PHASES[i].b.map((x, idx) => <li key={idx}>{x}</li>)}
                </ul>
                <div className="ph-unlocked">
                  By end of this phase: <b>{rs(cum)}</b> deployed · {built ? <span><b>{m3(impactOf(p, p.assets.map((_, j) => j)).storage)}</b> flood storage live</span> : 'planning, no works yet'}
                </div>
              </div>
            </div>
          </div>
        );

      case 'assets':
        const pickCost = [...selectedPicks].reduce((s, idx) => s + p.assets[idx].cost, 0);
        const funderOf = idx => p.funders.find(f => f.idx.includes(idx));
        return (
          <div className="animate-fade-in">
            <div className="legend">
              <span><i className="i-blue"></i> Blue — storage &amp; conveyance</span>
              <span><i className="i-green"></i> Green — wetlands &amp; vegetation</span>
              <span><i className="i-grey"></i> Grey — engineered structures</span>
            </div>
            <div className="assets-list">
              {p.assets.map((a, idx) => {
                const f = funderOf(idx);
                const funded = !!f;
                const pick = selectedPicks.has(idx);
                return (
                  <div
                    key={idx}
                    className={`asset ${funded ? 'funded' : pick ? 'pick' : ''}`}
                    onClick={funded ? undefined : () => togglePick(idx)}
                    style={funded ? { cursor: 'default', opacity: 0.92 } : {}}
                  >
                    <div className="chk" style={funded ? { background: 'var(--grey)', borderColor: 'var(--grey)' } : {}}>
                      {funded ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                          <rect x="5" y="11" width="14" height="9" rx="1.5" />
                          <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                        </svg>
                      ) : (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.6" style={{ opacity: pick ? 1 : 0 }}>
                          <path d="M4 12l5 5L20 6" />
                        </svg>
                      )}
                    </div>
                    <div className="name">
                      <b>
                        {a.n}
                        <span className={`tag ${a.t}`}>{a.t}</span>
                        {a.enabler && <span className="tag grey">enabler</span>}
                        {funded && <span className="tag" style={{ background: '#E6E0F0', color: '#5b4b8a' }}>funded</span>}
                      </b>
                      <span>{a.fn}{funded && <span> · <b style={{ color: 'var(--ink)' }}>Funded by {f.name}</b></span>}</span>
                    </div>
                    <div className="vol">
                      {a.vwb ? <span><b>{m3(a.vwb)}</b> storage</span> : a.cn ? <span><b>↓CN</b> retention</span> : <span><b>—</b> enabling</span>}
                    </div>
                    <div className="cost">{rs(a.cost)}</div>
                  </div>
                );
              })}
            </div>
            <div className="asset-foot">
              <div className="t">Selected assets: <b>{selectedPicks.size}</b></div>
              <div className="t">Estimated cost: <b>{rs(pickCost)}</b></div>
            </div>
            <div className="cta-row" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
              <button className="btn btn-primary" onClick={() => setActiveTab('funding')}>Proceed to Funding →</button>
            </div>
          </div>
        );

      case 'impact':
        // Slider simulation values
        const baseRunoff = runoff(simulationRainfall, p.cnBase) / 1000 * p.catchment * 1e6;
        const projRunoff = runoff(simulationRainfall, activeImpact.cnEff) / 1000 * p.catchment * 1e6;
        const eventRetainedValue = Math.max(0, baseRunoff - projRunoff);

        return (
          <div className="impact-grid animate-fade-in">
            <div>
              <div className="impact-head">
                <div><b>Project volumetric benefits</b> · SCS Curve Number</div>
              </div>
              {!activeImpact.enablerOK && (
                <div className="warn">
                  <b>Sewage diversion is pending.</b> In-lake storage benefit is blocked until raw sewage inflow is intercepted.
                </div>
              )}
              <div className="metrics">
                <div className="metric">
                  <b>{m3(activeImpact.storage)}</b>
                  <span className="u">in-lake storage</span>
                  <span>Restored live volume for flood buffer</span>
                </div>
                <div className="metric">
                  <b>{m3(activeImpact.eventRetained)}</b>
                  <span className="u">event retention</span>
                  <span>Retained in catchment at {p.P}mm storm</span>
                </div>
                <div className="metric">
                  <b>{m3(activeImpact.annual)}</b>
                  <span className="u">annual benefit</span>
                  <span>Total annual water recharged and retained</span>
                </div>
                <div className="metric">
                  <b>{activeImpact.people.toLocaleString('en-IN')}</b>
                  <span className="u">people in scope</span>
                  <span>Local population benefiting from recharge</span>
                </div>
              </div>
            </div>

            <div className="calc">
              <h4>SCS Curve Number Runoff Calculator</h4>
              <div className="note">Interactively simulate storm runoff benefits based on catchment curve numbers.</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                <div>Catchment area: <span className="val" style={{ float: 'right', fontWeight: 'bold' }}>{p.catchment} km²</span></div>
                <div style={{ borderBottom: '1px solid #244a4d', paddingBottom: '6px' }}>Baseline CN: <span className="val" style={{ float: 'right', fontWeight: 'bold' }}>{p.cnBase}</span></div>
                <div>Current project CN: <span className="val" style={{ float: 'right', color: '#5BC8B8', fontWeight: 'bold' }}>{activeImpact.cnEff.toFixed(1)}</span></div>
              </div>

              <label htmlFor="calc-p">Design storm rainfall: <span className="val">{simulationRainfall} mm</span></label>
              <input
                type="range"
                id="calc-p"
                min="20"
                max="150"
                value={simulationRainfall}
                onChange={(e) => setSimulationRainfall(parseInt(e.target.value))}
                style={{ width: '100%', accentColor: '#5BC8B8', marginTop: '6px' }}
              />

              <div className="out">
                <span>Baseline runoff:</span>
                <b>{m3(baseRunoff)}</b>
              </div>
              <div className="out">
                <span>Project runoff:</span>
                <b>{m3(projRunoff)}</b>
              </div>
              <div className="out" style={{ borderTop: '2px solid #5BC8B8', paddingTop: '10px', marginTop: '10px' }}>
                <span>Runoff retained:</span>
                <b style={{ color: '#5BC8B8' }}>{m3(eventRetainedValue)}</b>
              </div>
            </div>
          </div>
        );

      case 'funding':
        const needed = p.total - p.committed;
        const currentFundedPct = p.committedPct;
        const picksSum = [...selectedPicks].reduce((s, idx) => s + p.assets[idx].cost, 0);
        const addedFundedPct = (fundingMode === 'assets' ? picksSum : customAmount) / p.total;
        const tankSVG = renderTank(currentFundedPct, addedFundedPct);

        let customAllocated = [];
        let tempCost = customAmount;
        if (fundingMode === 'custom' && customAmount > 0) {
          for (let idx of unfunded) {
            const asset = p.assets[idx];
            if (tempCost >= asset.cost) {
              customAllocated.push({ n: asset.n, cost: asset.cost, partial: false });
              tempCost -= asset.cost;
            } else if (tempCost > 0) {
              customAllocated.push({ n: asset.n, cost: tempCost, partial: true });
              tempCost = 0;
              break;
            } else {
              break;
            }
          }
        }

        return (
          <div className="fund-grid animate-fade-in">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="tank" style={{ height: '300px', width: '100%', maxWidth: '240px' }}>{tankSVG}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-2)', marginTop: '8px', textAlign: 'center' }}>
                <b>{Math.round(currentFundedPct * 100)}%</b> committed {fundingMode === 'assets' && picksSum > 0 ? <span>+ <b>{Math.round(addedFundedPct * 100)}%</b> selected</span> : ''}
              </div>
            </div>

            <div>
              <div className="modes">
                <button className={fundingMode === 'assets' ? 'on' : ''} onClick={() => setFundingMode('assets')}>Asset-based funding</button>
                <button className={fundingMode === 'custom' ? 'on' : ''} onClick={() => setFundingMode('custom')}>Custom CSR amount</button>
              </div>

              <div className="fsum">
                <div>
                  <b>{rs(p.total)}</b>
                  <span>total project cost</span>
                </div>
                <div>
                  <b>{rs(p.committed)}</b>
                  <span>already committed</span>
                </div>
                <div>
                  <b>{rs(needed)}</b>
                  <span>still needed</span>
                </div>
              </div>

              {fundingMode === 'assets' ? (
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--ink-2)', marginBottom: '12px' }}>
                    Select blue, green or grey assets in the <b>Assets</b> tab to build a customized commitment.
                  </p>
                  <div style={{ background: 'var(--paper)', border: '1px solid var(--line)', padding: '14px 18px', borderRadius: '11px' }}>
                    <span style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-2)' }}>YOUR SELECTION</span>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: '4px' }}>
                      <strong style={{ fontFamily: 'var(--disp)', fontSize: '20px' }}>{selectedPicks.size} assets selected</strong>
                      <strong style={{ fontFamily: 'var(--mono)', fontSize: '18px', color: 'var(--teal)' }}>{rs(picksSum)}</strong>
                    </div>
                  </div>
                  <div className="cta-row">
                    <button
                      className="btn btn-primary"
                      disabled={selectedPicks.size === 0}
                      style={selectedPicks.size === 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      onClick={() => setShowCommitDialog(true)}
                    >
                      Review term sheet →
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--ink-2)', marginBottom: '12px' }}>
                    Enter your desired CSR funding amount. The system will automatically allocate it to the next pending asset in sequence.
                  </p>
                  <div className="amount-in" style={{ display: 'flex', alignItems: 'center', gap: '9px', background: '#fff', border: '1px solid var(--line)', padding: '6px 12px', borderRadius: '10px' }}>
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink-2)' }}>₹</span>
                    <input
                      type="number"
                      min="1"
                      max={needed}
                      value={customAmount || ''}
                      onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                      placeholder="Enter amount in Lakhs"
                      style={{ border: 'none', outline: 'none', width: '100%', fontSize: '16px', fontWeight: 'bold' }}
                    />
                    <span className="x" style={{ fontFamily: 'var(--mono)', color: 'var(--ink-2)' }}>Lakhs</span>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <div className="fund-cols">
                      <div>
                        <div className="ftitle">Your custom allocation</div>
                        <div className="ledger" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {customAllocated.length === 0 ? (
                            <div className="empty">Enter an amount to see how it allocates to assets.</div>
                          ) : (
                            customAllocated.map((item, idx) => (
                              <div key={idx} className="frow" style={{ gridTemplateColumns: '1fr auto', padding: '8px 12px' }}>
                                <div className="fm">
                                  <b>{item.n}</b>
                                  <span style={{ color: 'var(--teal-d)', fontFamily: 'var(--mono)', fontSize: '11px', display: 'block' }}>
                                    {item.partial ? 'Partial funding' : 'Full asset funding'}
                                  </span>
                                </div>
                                <div className="famt" style={{ fontFamily: 'var(--mono)', fontWeight: 'bold' }}>{rs(item.cost)}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="ftitle">Existing funders ledger</div>
                        <div className="ledger">
                          {p.funders.length === 0 ? (
                            <div className="empty">No commitments for this project yet. Be the first!</div>
                          ) : (
                            p.funders.map((f, idx) => (
                              <div key={idx} className="frow">
                                <div className="mono-av">{initials(f.name)}</div>
                                <div className="fm">
                                  <b>{f.name}</b>
                                  <span>{f.sector} · {f.date}</span>
                                  <span className="fa" style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--teal-d)' }}>
                                    {f.idx.length} assets funded
                                  </span>
                                </div>
                                <div className="famt">{rs(f.amount)}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="cta-row">
                    <button
                      className="btn btn-primary"
                      disabled={customAmount <= 0}
                      style={customAmount <= 0 ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
                      onClick={() => setShowCommitDialog(true)}
                    >
                      Commit funds →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'agency':
        const agencies = [...p.team, ...p.alts];
        const activeAgId = selectedAgencyId || p.team[0];
        const selectedAg = AG[activeAgId];

        return (
          <div className="animate-fade-in">
            <div className="ag-lbl">Project Restoration Team</div>
            <div className="ag-grid">
              {agencies.map(id => {
                const ag = AG[id];
                const isLead = p.team[0] === id;
                const isTeam = p.team.includes(id);
                const isSel = activeAgId === id;
                return (
                  <button key={id} className={`ag-card ${isSel ? 'on' : ''}`} onClick={() => setSelectedAgencyId(id)}>
                    <span className="role">{isLead ? 'Lead Agency' : isTeam ? 'Team Partner' : 'Available Partner'}</span>
                    <h4>{ag.name}</h4>
                    <p>{ag.role}</p>
                  </button>
                );
              })}
            </div>

            {selectedAg && (
              <div className="ag-profile" style={{ marginTop: '20px' }}>
                <div className="ph" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div>
                    <h3>{selectedAg.name}</h3>
                    <div className="meta" style={{ color: 'var(--ink-2)', fontSize: '13px' }}>{selectedAg.type} · {selectedAg.role}</div>
                  </div>
                  <div>
                    <div className="ag-phases">
                      {[1, 2, 3, 4, 5].map(phNum => {
                        const isActive = selectedAg.phases.includes(phNum);
                        return (
                          <i key={phNum} className={isActive ? 'on' : ''} title={`Phase ${phNum}: ${PHASES[phNum - 1].t}`}>
                            {phNum}
                          </i>
                        );
                      })}
                    </div>
                  </div>
                </div>
                <p className="blurb" style={{ margin: '12px 0', fontSize: '14.5px' }}>{selectedAg.blurb}</p>

                <div style={{ marginTop: '12px' }}>
                  <div style={{ fontFamily: 'var(--mono)', fontSize: '10px', textTransform: 'uppercase', color: 'var(--ink-2)', marginBottom: '6px' }}>Core Strengths</div>
                  <div className="ag-tags">
                    {selectedAg.strengths.map(st => <span key={st}>{st}</span>)}
                  </div>
                </div>

                <div className="ag-note" style={{ fontSize: '12px', color: 'var(--ink-2)', marginTop: '14px' }}>
                  <b>Known for:</b> {selectedAg.known}
                </div>
              </div>
            )}
          </div>
        );

      case 'docs':
        return (
          <div className="animate-fade-in">
            <div className={`acc ${openAccordions.has('m-vwba') ? 'open' : ''}`}>
              <button onClick={() => toggleAccordion('m-vwba')}>
                <div>
                  <span className="k">Methodology</span>
                  <h4>WRI Volumetric Water Benefit Accord (VWBA)</h4>
                </div>
                <span className="chev">→</span>
              </button>
              <div className="body">
                <p>
                  The Volumetric Water Benefit Accord (VWBA) provides a standard framework to quantify how water stewardship activities contribute to local water resilience.
                </p>
                <h5>Key Quantified Benefits</h5>
                <ul>
                  <li><b>In-Lake Storage Restored:</b> Restoring lake capacity (e.g. through desilting) provides direct storm-water buffering.</li>
                  <li><b>Runoff Retention:</b> Catchment interventions (bioswales, wetlands, reforestation) reduce peak stormwater runoff by lowering the Curve Number (CN).</li>
                  <li><b>Aquifer Recharge:</b> Directed recharge well fields divert stormwater into shallow aquifers rather than leaving it to flood surface roads.</li>
                </ul>
              </div>
            </div>

            <div className={`acc ${openAccordions.has('m-scs') ? 'open' : ''}`}>
              <button onClick={() => toggleAccordion('m-scs')}>
                <div>
                  <span className="k">Hydrology</span>
                  <h4>Soil Conservation Service (SCS) Curve Number Model</h4>
                </div>
                <span className="chev">→</span>
              </button>
              <div className="body">
                <p>
                  The SCS Curve Number (CN) model is a widely accepted empirical method for predicting storm runoff from a catchment based on soil types, land cover, and imperviousness.
                </p>
                <h5>Runoff Equation</h5>
                <pre className="formula">
{`S = (25400 / CN) - 254
Ia = 0.2 * S
Q = (P - Ia)² / (P - Ia + S)  (for P > Ia)`}
                </pre>
                <p>Where:</p>
                <ul>
                  <li><b>P:</b> Design storm rainfall (mm)</li>
                  <li><b>CN:</b> Curve Number (reflecting permeability)</li>
                  <li><b>Ia:</b> Initial abstraction (mm)</li>
                  <li><b>S:</b> Soil water retention parameter (mm)</li>
                  <li><b>Q:</b> Direct storm runoff depth (mm)</li>
                </ul>
              </div>
            </div>

            <div className={`acc ${openAccordions.has('m-dpr') ? 'open' : ''}`}>
              <button onClick={() => toggleAccordion('m-dpr')}>
                <div>
                  <span className="k">Financials</span>
                  <h4>Detailed Project Report (DPR) Costing</h4>
                </div>
                <span className="chev">→</span>
              </button>
              <div className="body">
                <p>
                  Detailed Project Reports outline the engineering design and costed milestones for every asset.
                </p>
                <table className="acc-table" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                  <thead>
                    <tr>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Asset Item</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Type</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Cost (Lakhs)</th>
                      <th style={{ textAlign: 'left', padding: '8px' }}>Target Phase</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.assets.map((a, idx) => (
                      <tr key={idx} style={{ borderTop: '1px solid var(--line)' }}>
                        <td style={{ padding: '8px' }}>{a.n}</td>
                        <td className="m" style={{ padding: '8px' }}>{a.t.toUpperCase()}</td>
                        <td className="m" style={{ padding: '8px' }}>₹{a.cost.toFixed(1)} L</td>
                        <td className="m" style={{ padding: '8px' }}>Phase {a.phase}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const isZero = p.committedPct === 0;
  const leadAg = AG[p.team[0]];

  return (
    <div className="bgg-project-explorer">
      {/* Platform context strip */}
      <section className="strip">
        <div className="wrap">
          <div>
            <div className="eyebrow">Corporate water stewardship · Bengaluru</div>
            <h1>Fund flood-mitigation lakes, <em>asset by asset.</em></h1>
            <div className="lede">Each lake is broken into fundable blue, green and grey assets and quantified in cubic metres with WRI VWBA. Pick a project to explore it.</div>
          </div>
          <div className="agg">
            <div className="s">
              <b>{totalProjects}</b>
              <span>Projects listed</span>
            </div>
            <div className="s">
              <b>{(totalVwb / 1e6).toFixed(2)}M m³</b>
              <span>Annual flood VWB</span>
            </div>
            <div className="s">
              <b>₹{(totalCost / 100).toFixed(1)} Cr</b>
              <span>Total cost</span>
            </div>
            <div className="s">
              <b>{totalPeople.toLocaleString('en-IN')}</b>
              <span>People in scope</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main app grid */}
      <main className="wrap">
        <div className="app">
          {/* Left sidebar rail */}
          <aside className="rail">
            <div className="search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flex: 'none', color: 'var(--ink-2)' }}>
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4-4" />
              </svg>
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Search lakes or catchments"
                style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', background: 'none' }}
              />
            </div>
            <div className="filters">
              {['All', 'Diagnosis', 'Design', 'Implementation', 'New'].map(f => (
                <button key={f} className={selectedFilter === f ? 'on' : ''} onClick={() => setSelectedFilter(f)}>
                  {f}
                </button>
              ))}
            </div>
            <div className="railhead">
              {railMatches.length} of {totalProjects} projects
            </div>
            <div className="rlist">
              {railMatches.length === 0 ? (
                <div style={{ color: 'var(--ink-2)', fontSize: '13px', padding: '10px' }}>No projects match.</div>
              ) : (
                railMatches.map(proj => {
                  const zero = proj.committedPct === 0;
                  const isSelected = proj.id === selectedProjectId;
                  return (
                    <button
                      key={proj.id}
                      className={`prow ${isSelected ? 'sel' : ''}`}
                      onClick={() => {
                        setSelectedProjectId(proj.id);
                        setActiveTab('overview');
                        setSelectedPicks(new Set());
                      }}
                    >
                      <span className="mini">{renderGauge(proj.committedPct)}</span>
                      <span className="info">
                        <b>{proj.name}{zero && <span className="newtag">new</span>}</b>
                        <span className="st">
                          <i className={zero ? 'zero' : ''}></i>
                          {proj.status}
                        </span>
                        <span className="pc">
                          <b>{Math.round(proj.committedPct * 100)}%</b> committed · {cr(proj.total)}
                        </span>
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          </aside>

          {/* Right workspace details panel */}
          <section className="ws">
            <div className="wshead">
              <div className="top">
                <div>
                  <h2>{p.name}</h2>
                  <div className="loc">{p.loc}</div>
                </div>
                <div className="badges">
                  <span className={`pill ${isZero ? 'zero' : 'live'}`}>
                    <i></i>
                    {isZero ? 'Open · 0% committed' : `${Math.round(p.committedPct * 100)}% committed`}
                  </span>
                  <span className="pill">{p.funders.length} funder{p.funders.length !== 1 ? 's' : ''}</span>
                  <span className="pill">Lead · {leadAg.name}</span>
                </div>
              </div>
              <nav className="wstabs">
                {TABS.map(([k, label]) => (
                  <button key={k} className={activeTab === k ? 'on' : ''} onClick={() => setActiveTab(k)}>
                    {label}
                  </button>
                ))}
              </nav>
            </div>
            
            <div className="panel">
              {renderActivePanel()}
            </div>

            <div className="disclaimer">
              <b>Indicative figures · sample funders.</b> Costs, depths and volumetric benefits are planning-stage estimates confirmed by the DPR. Funder names shown are illustrative sample CSR partners, not real commitments. Impact follows WRI VWBA (SCS Curve Number); agency listing is subject to due diligence.
            </div>
          </section>
        </div>
      </main>

      {/* Modal Dialog */}
      {showCommitDialog && (
        <div className="bgg-dialog-overlay" onClick={() => setShowCommitDialog(false)}>
          <div className="bgg-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="dlg-head">
              <div className="k">Funding term sheet</div>
              <h3>Review your commitment</h3>
              <button className="close" onClick={() => setShowCommitDialog(false)} aria-label="Close">×</button>
            </div>
            <div className="dlg-body">
              {renderCommitBody()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NewProjectsView;
