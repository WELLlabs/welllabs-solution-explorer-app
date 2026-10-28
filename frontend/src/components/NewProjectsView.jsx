import React, { useState, useEffect, useMemo, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useLocation } from 'react-router-dom';
import api from '@/utils/api';
import { AuthContext } from '@/context/AuthContext';
import fallbackSites from '@/data/fallbackSites.json';
import { getProjectImage } from '@/data/projectImages';
import { downloadFundingPdf } from '@/utils/fundingPdf';
import { PROJECT_STAGES, statusForProject } from '@/data/projectStages';

/* ============ helpers ============ */
export const cr = v => '₹' + (v / 100).toFixed(2) + ' Cr';
export const lk = v => '₹' + (v % 1 === 0 ? v.toFixed(0) : v.toFixed(2)) + ' L';
export const rs = v => v >= 100 ? cr(v) : lk(v);
export const parseCostNum = val => {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const str = String(val).trim();
  const match = str.match(/[\d.]+/);
  if (!match) return 0;
  let num = parseFloat(match[0]);
  if (isNaN(num)) return 0;
  if (/cr/i.test(str)) num = num * 100;
  return num;
};
export const m3 = n => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M m³' : n >= 1e3 ? Math.round(n / 1e3) + 'k m³' : Math.round(n) + ' m³';
export const runoff = (P, CN) => {
  const S = 25400 / CN - 254;
  const Ia = 0.2 * S;
  return P <= Ia ? 0 : Math.pow(P - Ia, 2) / (P - Ia + S);
};
export const initials = s => s.split(' ').filter(w => /[A-Za-z]/.test(w[0])).slice(0, 2).map(w => w[0]).join('').toUpperCase();

/* ============ implementing agencies ============ */
export const AG = {
  welllabs: {
    name: 'WELL Labs',
    email: 'sm1407858@gmail.com',
    type: 'Research institute',
    role: 'Design & science lead',
    blurb: 'Hydrology, water-balance and DPR specialists; co-created the Lake Rejuvenation Framework and the VWBA-aligned monitoring used on this platform.',
    strengths: ['Hydrology', 'Water balance', 'DPR', 'VWBA / M&E'],
    known: 'Lake Rejuvenation Framework · Chintamani & Jakkur studies'
  },
  fol: {
    name: 'Friends of Lakes',
    email: '',
    type: 'Citizen group',
    role: 'Restoration & stewardship',
    blurb: 'On-ground restoration and long-running community stewardship of Bengaluru lakes.',
    strengths: ['Restoration', 'Community', 'Long-term O&M'],
    known: 'Jakkur Lake restoration'
  },
  malligavad: {
    name: 'Malligavad Foundation',
    email: '',
    type: 'Restoration NGO',
    role: 'Implementation at scale',
    blurb: 'Rapid, CSR-funded restoration — desilting, bunds and natural treatment — led by Anand Malligavad, “the Lake Man of India”.',
    strengths: ['Desilting', 'Earthworks', 'CSR delivery'],
    known: 'Kyalasanahalli & dozens of revived lakes'
  },
  biome: {
    name: 'Biome Environmental Trust',
    email: '',
    type: 'Water trust',
    role: 'Recharge & blue-green',
    blurb: 'Groundwater recharge, open wells and rainwater systems — strengthens the blue and green assets.',
    strengths: ['Recharge', 'Open wells', 'Rainwater'],
    known: 'Bengaluru recharge & wells programmes'
  },
  unitedway: {
    name: 'United Way Bengaluru',
    email: '',
    type: 'CSR facilitator',
    role: 'Programme & CSR management',
    blurb: 'Manages CSR funds, Schedule-VII compliance and multi-stakeholder coordination, with milestone-linked disbursement and reporting.',
    strengths: ['CSR compliance', 'Fund management', 'Reporting'],
    known: 'Lake & water CSR programmes'
  },
  trust: {
    name: 'Lake committee trust',
    email: '',
    type: 'Local trust',
    role: 'Community O&M',
    blurb: 'A residents-and-civic-body trust (a MAPSAS-style model) that holds long-term operation and maintenance after handover.',
    strengths: ['Governance', 'Maintenance', 'Local oversight'],
    known: 'MAPSAS-style community management'
  }
};

/** Map our Intervention.type enum → the blue/green/grey colour category */
export const INT_COLOUR = {
  raingarden:         'green',
  bioswale:           'green',
  constructed_wetlands: 'green',
  infiltration_trench:'blue',
  percolation:        'blue',
  rainwater_harvesting:'blue',
  detention_basin:    'blue',
  underground_tank:   'grey',
  permeable_pathway:  'grey',
  ecobloc:            'grey',
  tree_trench:        'green',
  swd_inlet:          'grey',
  other:              'grey',
};

/** Friendly display name for each intervention type */
export const INT_LABEL = {
  raingarden:          'Rain Garden',
  bioswale:            'Bioswale',
  infiltration_trench: 'Infiltration Trench',
  percolation:         'Percolation Well',
  detention_basin:     'Detention / Retention Basin',
  constructed_wetlands:'Constructed Wetland',
  rainwater_harvesting:'Rainwater Harvesting',
  permeable_pathway:   'Permeable Pathway',
  ecobloc:             'ECOBLOC Underground Tank',
  tree_trench:         'Tree Trench',
  swd_inlet:           'SWD Inlet Placement',
  underground_tank:    'Underground Tank',
  other:               'Other Intervention',
};

function recordedLabel(value) {
  if (value == null) return '';
  const text = String(value).trim();
  return text || '';
}

function recordedMetres(value) {
  const text = recordedLabel(value);
  if (!text || /^(na|n\/a|none|nil|—|-)$/i.test(text)) return null;
  const match = text.match(/\d+(?:\.\d+)?/);
  if (!match) return null;
  const number = Number(match[0]);
  return number > 0 ? number : null;
}

function commitmentAsset(asset, amount, timeline) {
  return {
    name: asset?.n || 'Asset',
    type: asset?.designType || '',
    quantity: asset?.quantity ?? null,
    lengthM: asset?.lengthM ?? null,
    widthM: asset?.widthM ?? null,
    depthM: asset?.depthM ?? null,
    lengthLabel: asset?.lengthLabel || '',
    widthLabel: asset?.widthLabel || '',
    depthLabel: asset?.depthLabel || '',
    areaLabel: asset?.areaLabel || '',
    plants: asset?.plantSpecies || '',
    timeline: timeline || 'Planning',
    amount: amount || '',
  };
}

function commitmentProject(project, assets, subtotal) {
  return {
    name: project?.name || 'Project',
    location: project?.loc || '',
    detail: project?._raw?.site_level_impact || '',
    subtotal: subtotal || '',
    assets,
  };
}

/** Friendly display name for SiteProject.type */
export const SITE_TYPE_LABEL = {
  lake:       '🔵 Blue Site · Lake',
  park:       '🟢 Green Site · Park',
  stormdrain: '⚫ Grey Site · Storm Drain',
  campus:     '🏢 Campus Level',
};

/**
 * Normalise a SiteProject document (with embedded interventions[]) into
 * the shape the existing component expects.
 */
export function normaliseProject(site) {
  const interventions = site.interventions || [];

  // Build the `assets` array from interventions
  const assets = interventions.map((iv, i) => {
    const colour = INT_COLOUR[iv.type] || 'grey';
    const label  = INT_LABEL[iv.type]  || iv.type;
    const qty    = iv.quantity ? `×${iv.quantity} ` : '';
    const dims   = [
      iv.details?.length_m ? `L:${iv.details.length_m}` : null,
      iv.details?.width_m  ? `W:${iv.details.width_m}`  : null,
      iv.details?.depth_m  ? `D:${iv.details.depth_m}`  : null,
      iv.details?.area     ? `A:${iv.details.area}`      : null,
    ].filter(Boolean).join(' ');

    const rawCost = iv.details?.tentative_cost ?? iv.tentative_cost ?? iv.cost ?? null;
    const rawTimeline = iv.details?.tentative_timeline ?? iv.tentative_timeline ?? iv.timeline ?? '—';

    return {
      n:     `${qty}${label}${dims ? ` (${dims})` : ''}`,
      t:     colour,
      cost:  0,          // cost processed in preprocessProject
      rawCost: rawCost,
      timeline: rawTimeline,
      phase: 3,          // implementation phase by default
      vwb:   colour === 'blue' ? 5000 : 0,  // rough placeholder
      cn:    colour === 'green' ? 0.3 : colour === 'blue' ? 0.2 : 0,
      fn:    `${label} — ${dims || 'dimensions to be confirmed'}`,
      designType: iv.type || '',
      quantity: Number(iv.quantity) > 0 ? Number(iv.quantity) : null,
      lengthM: recordedMetres(iv.details?.length_m ?? iv.length),
      widthM: recordedMetres(iv.details?.width_m ?? iv.width),
      depthM: recordedMetres(iv.details?.depth_m ?? iv.depth),
      lengthLabel: recordedLabel(iv.details?.length_m ?? iv.length),
      widthLabel: recordedLabel(iv.details?.width_m ?? iv.width),
      depthLabel: recordedLabel(iv.details?.depth_m ?? iv.depth),
      areaLabel: recordedLabel(iv.details?.area ?? iv.area),
      plantSpecies: recordedLabel(iv.plant_species_used ?? iv.details?.plant_species_used),
    };
  });

  // If no interventions, show a placeholder so the detail panel doesn't crash
  if (assets.length === 0) {
    assets.push({
      n: 'Interventions being planned',
      t: 'grey', cost: 0, phase: 1, vwb: 0, fn: 'Site scoping in progress.'
    });
  }

  const typeLabel = SITE_TYPE_LABEL[site.type] || site.type;
  const watershed = site.watershed ? `${site.watershed} · ` : '';

  return {
    id:         site.site_id,
    name:       site.name || site.site_id,
    loc:        `${watershed}${typeLabel}`,
    status:     'Planning · Phase 1',
    scale:      'M',
    area:       0,
    catchment:  1,
    imperv:     50,
    P:          90,
    cnBase:     85,
    cnProj:     78,
    annualVWB:  assets.reduce((s, a) => s + (a.vwb || 0), 0),
    people:     500,
    recharge:   0,
    site_level_impact: site.site_level_impact || 'No site-level impact details specified.',
    subcatchment_level_impact: site.subcatchment_level_impact || 'No subcatchment-level impact details specified.',
    short:      site.site_level_impact
                  || site.subcatchment_level_impact
                  || `${site.name} — a ${site.type} site in the ${site.watershed || 'Nallurhalli'} micro-watershed. ${interventions.length} intervention(s) proposed.`,
    team:       ['welllabs', 'unitedway'],
    alts:       ['fol', 'biome'],
    funders:    [],
    assets,
    image_url:  getProjectImage(site),
    images:     site.images || [],
    // pass through raw fields for the overview tab
    _raw: site,
  };
}

/** Compute derived totals on a project object (works for both old & new shape) */
export function preprocessProject(p) {
  const rawCosts = p.assets.map(a => parseCostNum(a.rawCost || a.cost));
  const nonZeroCosts = rawCosts.filter(c => c > 0);
  const allEqual = nonZeroCosts.length > 0 && nonZeroCosts.every(c => Math.abs(c - nonZeroCosts[0]) < 0.001);

  if (allEqual && nonZeroCosts.length > 0) {
    const projectTotal = nonZeroCosts[0];
    const assetCount = p.assets.length || 1;
    const splitCost = projectTotal / assetCount;
    p.assets.forEach(a => {
      a.cost = splitCost;
    });
    p.total = projectTotal;
  } else {
    p.assets.forEach((a, i) => {
      a.cost = rawCosts[i] || 0;
    });
    p.total = p.assets.reduce((s, a) => s + a.cost, 0);
  }

  p.fundedIdx  = new Set(p.funders.flatMap(f => f.idx || []));
  p.funders.forEach(f => {
    if (f.idx) f.amount = f.idx.reduce((s, i) => s + (p.assets[i]?.cost || 0), 0);
  });
  p.committed    = [...p.fundedIdx].reduce((s, i) => s + (p.assets[i]?.cost || 0), 0);
  p.committedPct = p.total > 0 ? p.committed / p.total : 0;
  p.enablerIdx   = p.assets.findIndex(a => a.enabler);
  p.fullStorage  = p.assets.reduce((s, a) => s + (a.vwb || 0), 0);
  p.fullCN       = p.assets.reduce((s, a) => s + (a.cn  || 0), 0);
  p.group        = p.status.includes('Implementation') ? 'Implementation'
                 : p.status.includes('Design')         ? 'Design'
                 : 'Diagnosis';
  return p;
}

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
  ['assets', 'Assets and Timelines'],
  ['impact', 'Impact'],
  ['funding', 'Funding'],
  ['agency', 'Find Consultants'],
  ['docs', 'Docs'],
  ['status', 'Current Status']
];

function interestMessage(funder, consultantName, projectName) {
  const who = funder || "A funder";
  return `${who} is interested in engaging with ${consultantName} on ${projectName}.`;
}

function interestButtonLabel(sentNote, sending) {
  if (sending) return "Sending…";
  if (sentNote?.delivered) return "Interest sent";
  if (sentNote?.failed) return "Try again";
  if (sentNote) return "Interest noted";
  return "Show interest";
}

const STATUS_STEPS = [
  { title: "Open for funding", line: "Listed and waiting for a funder." },
  { title: "Interest received", line: "A funder wants to take part." },
  { title: "Consultant chosen", line: "Someone is studying the site." },
  { title: "Design ready", line: "Drawings and costs are prepared." },
  { title: "Approvals done", line: "The city permissions are in." },
  { title: "Agreement signed", line: "The funder and the city have signed." },
  { title: "Funds sent", line: "The first payment is released." },
  { title: "Work order issued", line: "A contractor is appointed." },
  { title: "Being built", line: "Construction is underway." },
  { title: "Finished", line: "The work is complete." },
  { title: "Handed over", line: "The city is running and watching it." },
];

const STATUS_COLORS = ["#E07A2F", "#347745", "#3669A9"];

function ProjectStatusList({ project }) {
  const record = statusForProject(project.id);
  const current = record.currentStage ?? 0;
  const last = PROJECT_STAGES.length - 1;
  return (
    <section className="text-left">
      <h3 className="text-base font-bold text-[#1F2A24] m-0">{project.name}</h3>
      <p className="text-xs text-[#347745] font-semibold m-0 mt-1 mb-2">Now · {STATUS_STEPS[current]?.title}</p>
      <div className="overflow-x-auto pb-2">
        <ol
          className="relative m-0 p-0 list-none grid min-w-[1100px]"
          style={{ gridTemplateColumns: `repeat(${PROJECT_STAGES.length}, minmax(0, 1fr))` }}
        >
          <div className="pointer-events-none absolute left-[4%] right-[4%] top-1/2 h-[3px] -translate-y-1/2 bg-[#1F2A24]" aria-hidden="true" />
          <div
            className="pointer-events-none absolute left-[4%] top-1/2 h-[3px] -translate-y-1/2 bg-[#347745]"
            style={{ width: `${(current / last) * 92}%` }}
            aria-hidden="true"
          />
          {PROJECT_STAGES.map((stage, index) => {
            const above = index % 2 === 1;
            const reached = stage.id <= current;
            const isCurrent = stage.id === current;
            const color = reached ? STATUS_COLORS[index % STATUS_COLORS.length] : "#C5CDC4";
            const copy = STATUS_STEPS[stage.id];
            const card = (
              <div className={`flex w-full flex-col items-center px-1 text-center ${reached ? "" : "opacity-55"}`}>
                <b className="text-[12px] leading-tight text-[#1F2A24]">{copy.title}</b>
                <p className="m-0 mt-1 max-w-[9.5rem] text-[11px] leading-snug text-[#6E6455]">{copy.line}</p>
              </div>
            );
            return (
              <li key={stage.id} className="relative flex flex-col items-center">
                <div className="flex h-[108px] w-full items-end justify-center pb-3">{above ? card : null}</div>
                <span
                  className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-bold"
                  style={{
                    borderColor: color,
                    background: isCurrent ? color : "#fff",
                    color: isCurrent ? "#fff" : "#1F2A24",
                  }}
                >{String(stage.id + 1).padStart(2, "0")}</span>
                <div className="flex h-[108px] w-full items-start justify-center pt-3">{above ? null : card}</div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

function timelineMonths(project) {
  return (project.assets || []).reduce((sum, asset) => {
    const match = String(asset.timeline || "").match(/[\d.]+/);
    const months = match ? parseFloat(match[0]) : 0;
    return sum + (Number.isFinite(months) ? months : 0);
  }, 0);
}

function firstImpactNumber(text, pattern) {
  const match = String(text || "").match(pattern);
  if (!match) return null;
  const value = Number(match[1].replace(/,/g, ""));
  return Number.isFinite(value) ? value : null;
}

function impactFigures(project) {
  const rawSite = project._raw?.site_level_impact || "";
  const rawSub = project._raw?.subcatchment_level_impact || "";
  const site = rawSite || (project.site_level_impact === "No site-level impact details specified." ? "" : project.site_level_impact || "");
  const sub = rawSub || (project.subcatchment_level_impact === "No subcatchment-level impact details specified." ? "" : project.subcatchment_level_impact || "");
  const runoff = String(sub).match(/from\s+([\d.]+)\s*mm\s+to\s+([\d.]+)\s*mm/i);
  const infiltrationGain = String(sub).match(/infiltration increased by\s+[\d.]+%\s+from\s+([\d.]+)\s*mm\s+to\s+([\d.]+)\s*mm/i);
  return {
    site,
    sub,
    infiltrationKl: firstImpactNumber(site, /infiltration of\s+([\d,]+(?:\.\d+)?)\s*kl/i),
    storageKl: firstImpactNumber(site, /storage of\s+([\d,]+(?:\.\d+)?)\s*kl/i),
    runoffMm: runoff ? Math.max(0, Number(runoff[1]) - Number(runoff[2])) : null,
    infiltrationMm: infiltrationGain
      ? Math.max(0, Number(infiltrationGain[2]) - Number(infiltrationGain[1]))
      : null,
  };
}

function sumFigures(projects, key) {
  const values = projects.map((project) => impactFigures(project)[key]).filter((value) => value != null);
  if (!values.length) return null;
  return values.reduce((total, value) => total + value, 0);
}

function formatMeasure(value, digits = 0) {
  if (value == null) return "—";
  return value.toLocaleString("en-IN", { maximumFractionDigits: digits });
}

function assetSelectionKey(projectId, idx) {
  return `${projectId}::${idx}`;
}

function formatMonthCount(months) {
  if (!(months > 0)) return "—";
  const text = months % 1 === 0 ? months.toFixed(0) : months.toFixed(1);
  return `${text} months`;
}

function allocateAcrossProjects(projects, amount) {
  let remaining = amount;
  const allocated = [];
  projects.forEach((project) => {
    (project.assets || []).forEach((asset, idx) => {
      if (remaining <= 0) return;
      if (project.fundedIdx?.has(idx)) return;
      const cost = asset.cost || 0;
      if (cost <= 0) return;
      if (remaining >= cost) {
        allocated.push({ projectName: project.name, name: asset.n, timeline: asset.timeline, cost, partial: false, asset });
        remaining -= cost;
      } else {
        allocated.push({ projectName: project.name, name: asset.n, timeline: asset.timeline, cost: remaining, partial: true, asset });
        remaining = 0;
      }
    });
  });
  return allocated;
}

const NewProjectsView = ({ initialProjectId, projectIds, onBack }) => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  // ── Live data from MongoDB ──────────────────────────────────────────────
  const [rawSites, setRawSites]   = useState([]);
  const [loading,  setLoading]    = useState(true);
  const [fetchErr, setFetchErr]   = useState(null);

  useEffect(() => {
    api.get('/sites')
      .then(res => {
        const data = res.data;
        if (Array.isArray(data) && data.length > 0) {
          setRawSites(data);
        } else {
          setRawSites(fallbackSites);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch sites from API, using fallback:', err);
        setRawSites(fallbackSites);
        setLoading(false);
      });
  }, []);

  // Normalise + preprocess whenever rawSites changes
  const PROJECTS = useMemo(
    () => rawSites.map(s => preprocessProject(normaliseProject(s))),
    [rawSites]
  );

  // Bulletproof function to parse project ID from React Router or window location search parameters
  const getQueryProjectId = (projects) => {
    try {
      const search = location.search || window.location.search;
      if (!search) return null;
      const params = new URLSearchParams(search);
      const id = params.get('id');
      if (!id) return null;
      const cleanId = id.trim().toLowerCase();
      return projects.some(p => p.id === cleanId) ? cleanId : null;
    } catch (e) {
      console.error('Error parsing query project id:', e);
      return null;
    }
  };

  // React Component State
  const [selectedProjectId, setSelectedProjectId] = useState(initialProjectId || null);
  const [activeTab, setActiveTab] = useState('overview');
  const [activePhase, setActivePhase] = useState(0);
  const [selectedFilter, setSelectedFilter] = useState('All');
  const [selectedPicks, setSelectedPicks] = useState(new Set());
  const [selectedAssetKeys, setSelectedAssetKeys] = useState(() => new Set());
  const [consultantByProject, setConsultantByProject] = useState({});
  const [sentInterest, setSentInterest] = useState({});
  const [sendingInterest, setSendingInterest] = useState({});
  const [fundingMode, setFundingMode] = useState('assets');
  const [customAmount, setCustomAmount] = useState(0);
  const [selectedAgencyId, setSelectedAgencyId] = useState(null);
  const [consultantDetail, setConsultantDetail] = useState(null);
  const [impactPromptOpen, setImpactPromptOpen] = useState(false);
  const [openAccordions, setOpenAccordions] = useState(new Set(['m-vwba']));
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    if (!consultantDetail && !impactPromptOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [consultantDetail, impactPromptOpen]);
  const [simulationRainfall, setSimulationRainfall] = useState(90);

  // Once data loads, set the initial selected project
  useEffect(() => {
    if (PROJECTS.length === 0) return;
    const fromSelection = (projectIds || []).find((id) => PROJECTS.some((proj) => proj.id === id));
    if (fromSelection) {
      setSelectedProjectId((current) => (
        current && (projectIds || []).includes(current) ? current : fromSelection
      ));
    } else if (initialProjectId && PROJECTS.some(p => p.id === initialProjectId)) {
      setSelectedProjectId(initialProjectId);
    } else if (!selectedProjectId) {
      const queryId = getQueryProjectId(PROJECTS);
      setSelectedProjectId(queryId || PROJECTS[0].id);
    }
  }, [PROJECTS, initialProjectId, projectIds]);

  // Sync state with URL parameter if it changes
  useEffect(() => {
    if (PROJECTS.length === 0) return;
    const queryId = getQueryProjectId(PROJECTS);
    if (queryId && queryId !== selectedProjectId) {
      setSelectedProjectId(queryId);
      // Reset active tab & selections when project changes via URL
      setActiveTab('overview');
      setSelectedPicks(new Set());
      setCustomAmount(0);
    }
  }, [location.search, window.location.search, PROJECTS]);

  const [simulationCatchment, setSimulationCatchment] = useState(0);
  const [simulationCnBase, setSimulationCnBase] = useState(0);
  const [simulationCnProj, setSimulationCnProj] = useState(0);

  // Keep simulation states synced with active project / picks unless manually adjusted
  useEffect(() => {
    if (PROJECTS.length === 0) return;
    const p = PROJECTS.find(x => x.id === selectedProjectId) || PROJECTS[0];
    const activeSet = new Set([...p.fundedIdx, ...selectedPicks]);
    // Safety check in case impactOf is not defined or fails
    try {
      const activeImpact = impactOf(p, activeSet);
      setSimulationCatchment(p.catchment || 0);
      setSimulationCnBase(p.cnBase || 0);
      setSimulationCnProj(activeImpact?.cnEff || 0);
      setSimulationRainfall(p.P || 90);
    } catch (e) {
      console.warn("Impact calculation failed during sync", e);
    }
  }, [selectedProjectId, selectedPicks, PROJECTS]);

  // Initialize phase when active project changes
  useEffect(() => {
    if (PROJECTS.length === 0) return;
    const p = PROJECTS.find(x => x.id === selectedProjectId) || PROJECTS[0];
    setActivePhase(p.group === 'Implementation' ? 2 : p.group === 'Design' ? 1 : 0);
    setSelectedAgencyId(p.team && p.team.length > 0 ? p.team[0] : null);
  }, [selectedProjectId, PROJECTS]);

  // Guard: while loading or if PROJECTS is empty, render a loading state
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-slate-500">
          <svg className="animate-spin w-8 h-8 text-teal-600" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" opacity=".25"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
          </svg>
          <span className="font-mono text-sm">Loading sites from database…</span>
        </div>
      </div>
    );
  }

  if (fetchErr) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 max-w-md text-center">
          <div className="text-2xl mb-2">⚠️</div>
          <h3 className="font-bold text-red-700 mb-1">Could not load sites</h3>
          <p className="text-sm text-red-500">{fetchErr}</p>
          <p className="text-xs text-slate-400 mt-3">Make sure the backend server is running on port 5000.</p>
        </div>
      </div>
    );
  }

  if (PROJECTS.length === 0) {
    return (
      <div className="w-full min-h-screen bg-[var(--bg-page)] flex items-center justify-center">
        <div className="text-slate-400 text-sm font-mono">No sites found in database.</div>
      </div>
    );
  }

  const selectedRail = (projectIds || [])
    .map((id) => PROJECTS.find((proj) => proj.id === id))
    .filter(Boolean);
  const showSelectedRail = selectedRail.length > 0;
  const selectedAssetEntries = showSelectedRail
    ? selectedRail.flatMap((project) =>
        project.assets
          .map((asset, idx) => ({ project, asset, idx }))
          .filter((entry) => selectedAssetKeys.has(assetSelectionKey(project.id, entry.idx)))
      )
    : [];
  const p = PROJECTS.find(x => x.id === selectedProjectId) || selectedRail[0] || PROJECTS[0];
  const selectionFor = (project) => {
    let picked = 0;
    let open = 0;
    project.assets.forEach((_, idx) => {
      if (project.fundedIdx?.has(idx)) return;
      const chosen = showSelectedRail
        ? selectedAssetKeys.has(assetSelectionKey(project.id, idx))
        : selectedPicks.has(idx);
      if (chosen) picked += 1;
      else open += 1;
    });
    return { picked, complete: picked > 0 && open === 0 };
  };
  const openImpact = () => {
    const started = showSelectedRail ? selectedRail.map(selectionFor).filter((row) => row.picked > 0) : [];
    const splittingWithoutFinishing = started.length >= 2 && started.every((row) => !row.complete);
    if (splittingWithoutFinishing) {
      setImpactPromptOpen(true);
      return;
    }
    setActiveTab("impact");
  };
  const activeSet = new Set([...p.fundedIdx, ...selectedPicks]);
  const unfunded = p.assets.map((_, i) => i).filter(i => !p.fundedIdx.has(i));
  const activeImpact = impactOf(p, activeSet);

  // Header totals follow the projects already chosen on the map.
  const statProjects = showSelectedRail ? selectedRail : PROJECTS;
  const totalProjects = statProjects.length;
  const totalVwb = statProjects.reduce((s, proj) => s + (proj.annualVWB || 0), 0);
  const totalCost = statProjects.reduce((s, proj) => s + (proj.total || 0), 0);
  const totalPeople = statProjects.reduce((s, proj) => s + (proj.people || 0), 0);

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

  const toggleAssetKey = (projectId, idx) => {
    const key = assetSelectionKey(projectId, idx);
    setSelectedAssetKeys((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const funderLabel = user?.name
    ? `${user.name}${user.organization ? `, ${user.organization}` : ""}`
    : "A funder";

  const sendConsultantInterest = async (project, agencyId) => {
    const agency = AG[agencyId];
    if (!agency) return;
    const key = `${project.id}::${agencyId}`;
    if (sendingInterest[key]) return;
    const summary = interestMessage(funderLabel, agency.name, project.name);
    if (!agency.email) {
      setSentInterest((current) => ({
        ...current,
        [key]: { text: summary, delivered: false },
      }));
      return;
    }

    setSendingInterest((current) => ({ ...current, [key]: true }));
    const fields = {
      Name: user?.name || "Not signed in",
      Email: user?.email || "Not signed in",
      Role: user?.role || "Not signed in",
      ...(user?.organization ? { Organization: user.organization } : {}),
      ...(user?.userType ? { "Funder type": user.userType } : {}),
      ...(user?.phone ? { Phone: user.phone } : {}),
      Consultant: agency.name,
      "Consultant role": agency.role,
      Project: project.name,
      ...(project.loc ? { Location: project.loc } : {}),
      Cost: rs(project.total || 0),
    };
    const detail = [
      summary,
      ...Object.entries(fields).map(([label, value]) => `${label}: ${value}`),
    ].join("\n");
    try {
      const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(agency.email)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `Funder interest in ${project.name}`,
          _template: "table",
          _captcha: "false",
          ...(user?.email ? { _replyto: user.email } : {}),
          ...fields,
          Message: detail,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || data.success === false || data.success === "false") {
        throw new Error(data.message || "The email could not be sent.");
      }
      setSentInterest((current) => ({
        ...current,
        [key]: {
          text: `Interest sent to ${agency.name}. The email includes your name, email, and role, and that you want to engage them on ${project.name}.`,
          delivered: true,
        },
      }));
    } catch (error) {
      setSentInterest((current) => ({
        ...current,
        [key]: {
          text: error?.message || "The email could not be sent.",
          delivered: false,
          failed: true,
        },
      }));
    } finally {
      setSendingInterest((current) => ({ ...current, [key]: false }));
    }
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

  const assetTimeline = (timeline) => {
    if (!timeline || timeline === '—') return 'Planning';
    const text = String(timeline).trim();
    if (/^\d+(\.\d+)?$/.test(text)) {
      return `${text} ${parseFloat(text) === 1 ? 'month' : 'months'}`;
    }
    return text;
  };

  const downloadCommitment = () => {
    if (showSelectedRail) {
      const filename = "selected-projects-funding.pdf";
      if (fundingMode === "assets") {
        const groups = selectedRail.map((project) => {
          const picks = project.assets
            .map((asset, idx) => ({ asset, idx }))
            .filter(({ idx }) => selectedAssetKeys.has(assetSelectionKey(project.id, idx)));
          if (!picks.length) return null;
          const subtotal = picks.reduce((sum, entry) => sum + (entry.asset.cost || 0), 0);
          return commitmentProject(
            project,
            picks.map(({ asset }) => commitmentAsset(
              asset,
              asset.cost > 0 ? rs(asset.cost) : "TBD",
              assetTimeline(asset.timeline),
            )),
            rs(subtotal),
          );
        }).filter(Boolean);
        const total = selectedAssetEntries.reduce((sum, entry) => sum + (entry.asset.cost || 0), 0);
        downloadFundingPdf({
          filename,
          heading: "Funding commitment",
          meta: [`${selectedRail.length} selected projects`],
          projects: groups,
          totalAmount: rs(total),
        });
        return;
      }
      const allocated = allocateAcrossProjects(selectedRail, customAmount);
      downloadFundingPdf({
        filename,
        heading: "Funding commitment",
        meta: [`${selectedRail.length} selected projects`, "Custom CSR amount"],
        projects: selectedRail.map((project) => {
          const rows = allocated.filter((item) => item.projectName === project.name);
          if (!rows.length) return null;
          const subtotal = rows.reduce((sum, item) => sum + item.cost, 0);
          return commitmentProject(
            project,
            rows.map((item) => commitmentAsset(
              item.asset,
              rs(item.cost),
              item.partial ? `${assetTimeline(item.timeline)} | partial` : assetTimeline(item.timeline),
            )),
            rs(subtotal),
          );
        }).filter(Boolean),
        totalAmount: rs(customAmount),
      });
      return;
    }

    const filename = `${String(p.name || 'project').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')}-funding.pdf`;
    if (fundingMode === 'assets') {
      const picks = Array.from(selectedPicks).map((i) => p.assets[i]).filter(Boolean);
      const totalCost = picks.reduce((sum, asset) => sum + (asset.cost || 0), 0);
      downloadFundingPdf({
        filename,
        heading: 'Funding commitment',
        meta: [`Project: ${p.name}`],
        projects: [commitmentProject(
          p,
          picks.map((asset) => commitmentAsset(
            asset,
            asset.cost > 0 ? rs(asset.cost) : 'TBD',
            assetTimeline(asset.timeline),
          )),
          rs(totalCost),
        )],
        totalAmount: rs(totalCost),
      });
      return;
    }

    let remaining = customAmount;
    const allocated = [];
    unfunded.forEach((idx) => {
      if (remaining <= 0) return;
      const asset = p.assets[idx];
      if (!asset) return;
      if (remaining >= asset.cost) {
        allocated.push(commitmentAsset(asset, rs(asset.cost), assetTimeline(asset.timeline)));
        remaining -= asset.cost;
      } else {
        allocated.push(commitmentAsset(asset, rs(remaining), `${assetTimeline(asset.timeline)} | partial`));
        remaining = 0;
      }
    });
    downloadFundingPdf({
      filename,
      heading: 'Funding commitment',
      meta: [`Project: ${p.name}`, 'Custom CSR amount'],
      projects: [commitmentProject(p, allocated, rs(customAmount))],
      totalAmount: rs(customAmount),
    });
  };

  // Render Inner Workspace Tab Panels
  const renderActivePanel = () => {
    const activeImpact = impactOf(p, activeSet);
    const totalMonths = p.assets.reduce((sum, a) => {
      const match = String(a.timeline || '').match(/[\d.]+/);
      const num = match ? parseFloat(match[0]) : 0;
      return sum + (isNaN(num) ? 0 : num);
    }, 0);

    switch (activeTab) {
      case 'overview':
        if (showSelectedRail) {
          const combinedMonths = selectedRail.reduce((sum, project) => sum + timelineMonths(project), 0);
          const combinedCost = selectedRail.reduce((sum, project) => sum + (project.total || 0), 0);
          const combinedImpact = {
            infiltrationKl: sumFigures(selectedRail, "infiltrationKl"),
            storageKl: sumFigures(selectedRail, "storageKl"),
            runoffMm: sumFigures(selectedRail, "runoffMm"),
            infiltrationMm: sumFigures(selectedRail, "infiltrationMm"),
          };
          return (
            <div className="animate-[fadeInUp_0.3s_ease-out_forwards]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-slate-100/70 rounded-xl p-4 flex flex-col gap-1 text-left">
                  <b className="text-lg font-bold text-slate-800">{rs(combinedCost)}</b>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Total cost</span>
                </div>
                <div className="bg-slate-100/70 rounded-xl p-4 flex flex-col gap-1 text-left">
                  <b className="text-lg font-bold text-slate-800">
                    {combinedMonths > 0 ? `${combinedMonths % 1 === 0 ? combinedMonths.toFixed(0) : combinedMonths.toFixed(1)} months` : "—"}
                  </b>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Total time</span>
                </div>
                <div className="bg-slate-100/70 rounded-xl p-4 flex flex-col gap-1 text-left">
                  <b className="text-lg font-bold text-slate-800">{selectedRail.length}</b>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Projects</span>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                  ["Infiltration", `${formatMeasure(combinedImpact.infiltrationKl)} KL`],
                  ["Flood storage", `${formatMeasure(combinedImpact.storageKl)} KL`],
                  ["Runoff held back", `${formatMeasure(combinedImpact.runoffMm, 1)} mm`],
                  ["Extra infiltration", `${formatMeasure(combinedImpact.infiltrationMm, 1)} mm`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-[#C8D7BC] bg-[#f3f8ef] px-3 py-3 text-left">
                    <b className="block text-base font-bold text-[#1F2A24]">{value}</b>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#347745]">{label}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-3">
                {selectedRail.map((project) => {
                  const figures = impactFigures(project);
                  const months = timelineMonths(project);
                  return (
                    <article key={project.id} className="rounded-2xl border border-[#C8D7BC] bg-white p-4 text-left">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <h3 className="text-base font-bold text-[#1F2A24] m-0">{project.name}</h3>
                        <div className="text-sm font-bold text-[#1F2A24]">{rs(project.total || 0)}</div>
                      </div>
                      <div className="text-xs text-[#6E6455] mt-1">
                        {months > 0 ? `${months % 1 === 0 ? months.toFixed(0) : months.toFixed(1)} months` : "Timeline not set"}
                        {" · "}
                        {project.assets.length} intervention{project.assets.length === 1 ? "" : "s"}
                      </div>
                      <p className="text-sm text-[#1F2A24] leading-relaxed m-0 mt-2">
                        {figures.site || "Impact figures are still being added for this project."}
                      </p>
                      {figures.sub && (
                        <p className="text-sm text-[#6E6455] leading-relaxed m-0 mt-1">{figures.sub}</p>
                      )}
                    </article>
                  );
                })}
              </div>
            </div>
          );
        }
        return (
          <div className="animate-[fadeInUp_0.3s_ease-out_forwards]">
            {p.image_url && (
              <div className="w-full h-48 sm:h-64 rounded-2xl overflow-hidden mb-6 bg-slate-100 border border-slate-200 shadow-sm relative">
                <img
                  src={p.image_url}
                  alt={p.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { if (e.currentTarget?.parentElement) e.currentTarget.parentElement.style.display = 'none'; }}
                />
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-100/70 rounded-xl p-4 flex flex-col gap-1 text-left">
                <b className="text-lg font-bold text-slate-800">{rs(p.total)}</b>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Total Cost</span>
              </div>
              <div className="bg-slate-100/70 rounded-xl p-4 flex flex-col gap-1 text-left">
                <b className="text-lg font-bold text-slate-800">
                  {totalMonths > 0 ? `${totalMonths % 1 === 0 ? totalMonths.toFixed(0) : totalMonths.toFixed(1)} Months` : '—'}
                </b>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500">Tentative Timeline</span>
              </div>
              <div className="bg-slate-100/70 rounded-xl p-4 flex flex-col gap-1 text-left">
                <b className="text-xs font-bold text-slate-800 line-clamp-3" title={p.site_level_impact || p._raw?.site_level_impact}>
                  {p.site_level_impact || p._raw?.site_level_impact || '—'}
                </b>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mt-auto pt-1">Site Level Impact</span>
              </div>
              <div className="bg-slate-100/70 rounded-xl p-4 flex flex-col gap-1 text-left">
                <b className="text-xs font-bold text-slate-800 line-clamp-3" title={p.subcatchment_level_impact || p._raw?.subcatchment_level_impact}>
                  {p.subcatchment_level_impact || p._raw?.subcatchment_level_impact || '—'}
                </b>
                <span className="font-mono text-[10px] uppercase tracking-wider text-slate-500 mt-auto pt-1">Subcatchment Level Impact</span>
              </div>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_200px] gap-8 items-center text-left">
              <div>
                <p className="text-base md:text-lg text-[var(--ink)] font-medium leading-relaxed mb-4">{p.short}</p>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div className="w-full max-w-[140px] h-[170px] rounded-2xl overflow-hidden mx-auto shadow-[0_2px_12px_rgba(0,0,0,0.06)]">{renderTank(p.committedPct, 0)}</div>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '12px', color: 'var(--ink-2)', marginTop: '8px' }}>
                  <b style={{ color: 'var(--ink)' }}>{rs(p.committed)}</b> committed · <b style={{ color: 'var(--ink)' }}>{rs(p.total - p.committed)}</b> still needed
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap justify-end mt-6">
              <button
                className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer bg-[#3669A9] hover:bg-[#347745] text-white shadow-sm"
                onClick={() => setActiveTab('funding')}
              >Fund this project →</button>
              <button
                className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer bg-white text-[#1F2A24] border border-[#C8D7BC] shadow-[0_1px_4px_rgba(0,0,0,0.05)] hover:bg-[#C8D7BC]/20"
                onClick={() => setActiveTab('assets')}
              >Browse assets</button>
            </div>
          </div>
        );

      /* 
      // Timeline tab code commented out as per request
      case 'timeline':
        const i = activePhase;
        const built = i >= 2;
        const cum = i < 2 ? p.assets.filter(a => a.phase === 1).reduce((s, a) => s + a.cost, 0) : p.total;
        return (
          <div className="animate-[fadeInUp_0.3s_ease-out_forwards]">
            <div className="flex flex-col md:flex-row gap-1.5 border border-slate-200 rounded-2xl p-1.5 bg-slate-50 mb-6">
              {PHASES.map((ph, k) => (
                <button
                  key={k}
                  className={`flex-1 flex flex-col items-center md:items-start p-3 rounded-xl border transition-all duration-150 cursor-pointer text-center md:text-left ${
                    k === i
                      ? 'bg-white border-slate-200 shadow-sm'
                      : 'border-transparent bg-slate-100/60 hover:bg-white/80'
                  }`}
                  onClick={() => setActivePhase(k)}
                >
                  <span className={`font-mono text-[10.5px] uppercase tracking-wider ${k === i ? 'text-teal-600' : 'text-slate-500'}`}>{MONTHS[p.scale][k]} · P{k + 1}</span>
                  <span className={`text-sm font-bold mt-0.5 ${k === i ? 'text-slate-900' : 'text-slate-500'}`}>{ph.t}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 items-start text-left">
              <div className="w-full aspect-[220/190] rounded-2xl overflow-hidden shadow-[0_2px_10px_rgba(0,0,0,0.06)] shrink-0">{renderPhaseArt(i)}</div>
              <div>
                <div className="font-mono text-xs uppercase tracking-wider text-[var(--teal)] font-bold mb-1">{MONTHS[p.scale][i]} · Phase {i + 1}</div>
                <h4 className="text-base font-bold text-[var(--ink)] mb-3">{PHASES[i].t}</h4>
                <ul className="pl-[18px] margin-0 flex flex-col gap-2 list-disc mb-5 text-[14.5px] text-[var(--ink-2)] leading-relaxed">
                  {PHASES[i].b.map((x, idx) => <li key={idx} className="text-left">{x}</li>)}
                </ul>
                <div className="bg-teal-50/60 rounded-xl p-4 text-xs font-mono text-teal-700 text-left">
                  By end of this phase: <b>{rs(cum)}</b> deployed · {built ? <span><b>{m3(impactOf(p, p.assets.map((_, j) => j)).storage)}</b> flood storage live</span> : 'planning, no works yet'}
                </div>
              </div>
            </div>
          </div>
        );
      */

      case 'assets':
        if (showSelectedRail) {
          const allAssets = selectedRail.reduce((sum, project) => sum + project.assets.length, 0);
          const combinedMonths = selectedRail.reduce((sum, project) => sum + timelineMonths(project), 0);
          const combinedCost = selectedRail.reduce((sum, project) => sum + (project.total || 0), 0);
          const pickCost = selectedAssetEntries.reduce((sum, entry) => sum + (entry.asset.cost || 0), 0);
          return (
            <div className="animate-[fadeInUp_0.3s_ease-out_forwards]">
              <div className="flex flex-wrap gap-4 text-xs font-mono text-[var(--ink-2)] mb-4 text-left">
                <span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full shrink-0 bg-[var(--blue)]"></i> Blue — storage &amp; conveyance</span>
                <span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full shrink-0 bg-[var(--green)]"></i> Green — wetlands &amp; vegetation</span>
                <span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full shrink-0 bg-[var(--grey)]"></i> Grey — engineered structures</span>
              </div>
              <div className="flex flex-col gap-6">
                {selectedRail.map((project) => (
                  <section key={project.id}>
                    <div className="mb-2 text-left">
                      <h3 className="text-base font-bold text-[#1F2A24] m-0">{project.name}</h3>
                      <p className="text-xs text-[#6E6455] m-0 mt-0.5">
                        {rs(project.total || 0)} · {formatMonthCount(timelineMonths(project))} · {project.assets.length} intervention{project.assets.length === 1 ? "" : "s"}
                      </p>
                    </div>
                    <div className="hidden md:grid grid-cols-[auto_1fr_140px_120px] gap-4 items-center px-4 py-2 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 mb-2 text-left">
                      <div className="w-5"></div>
                      <div>Intervention Type &amp; Details</div>
                      <div className="text-right">Tentative Timeline</div>
                      <div className="text-right">Tentative Cost</div>
                    </div>
                    <div className="flex flex-col gap-2">
                      {project.assets.map((a, idx) => {
                        const funder = project.funders.find((f) => f.idx?.includes(idx));
                        const funded = !!funder;
                        const pick = selectedAssetKeys.has(assetSelectionKey(project.id, idx));
                        return (
                          <div
                            key={assetSelectionKey(project.id, idx)}
                            className={`grid grid-cols-1 md:grid-cols-[auto_1fr_140px_120px] gap-3 md:gap-4 items-center rounded-xl p-3.5 transition-all duration-150 text-left border-2 ${
                              funded
                                ? "bg-slate-50 border-transparent cursor-default opacity-90"
                                : pick
                                  ? "bg-teal-50 border-teal-400/60 cursor-pointer"
                                  : "bg-slate-50/80 border-transparent hover:border-teal-300/50 hover:bg-white cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.04)]"
                            }`}
                            onClick={funded ? undefined : () => toggleAssetKey(project.id, idx)}
                          >
                            <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 ${funded ? "bg-slate-400 border-slate-400" : pick ? "bg-teal-600 border-teal-600" : "border-slate-300 bg-white"}`}>
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
                            <div className="flex flex-col gap-0.5 text-left">
                              <b className="text-sm font-bold text-[var(--ink)] flex items-center gap-1.5 flex-wrap">
                                {a.n}
                                <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${a.t === "blue" ? "bg-[#E2EEF4] text-[#1D5E8C]" : a.t === "green" ? "bg-[#E7EFDF] text-[#3E6325]" : "bg-[#E5E9EB] text-[#475760]"}`}>{a.t}</span>
                              </b>
                              <span className="text-xs text-[var(--ink-2)] leading-relaxed">{a.fn}</span>
                            </div>
                            <div className="text-xs font-mono font-semibold text-slate-700 text-left md:text-right">
                              {a.timeline && a.timeline !== "—" ? (
                                <span>{a.timeline} {/^\d+(\.\d+)?$/.test(String(a.timeline).trim()) ? (parseFloat(a.timeline) === 1 ? "month" : "months") : ""}</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </div>
                            <div className="text-sm font-mono font-bold text-[var(--ink)] text-left md:text-right">
                              {a.cost > 0 ? rs(a.cost) : <span className="text-slate-400 font-normal">TBD</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
              <div className="flex justify-between items-center bg-slate-100/70 rounded-xl px-5 py-3.5 mt-4 text-sm font-mono text-slate-600 flex-wrap gap-3">
                <div>Selected assets: <b className="font-bold text-slate-800">{selectedAssetEntries.length}</b> / {allAssets}</div>
                <div className="flex items-center gap-6 flex-wrap">
                  <div>Total Duration: <b className="font-bold text-slate-800">{formatMonthCount(combinedMonths)}</b></div>
                  <div>
                    {selectedAssetEntries.length > 0 ? (
                      <span>Selected Cost: <b className="font-bold text-teal-700">{rs(pickCost)}</b> (of {rs(combinedCost)} total)</span>
                    ) : (
                      <span>Total Cost: <b className="font-bold text-teal-700">{rs(combinedCost)}</b></span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex gap-3 flex-wrap justify-end mt-4">
                <button
                  className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer bg-[#3669A9] hover:bg-[#347745] text-white shadow-sm"
                  onClick={openImpact}
                >See impact →</button>
              </div>
            </div>
          );
        }
        const pickCost = [...selectedPicks].reduce((s, idx) => s + p.assets[idx].cost, 0);
        const funderOf = idx => p.funders.find(f => f.idx.includes(idx));

        return (
          <div className="animate-[fadeInUp_0.3s_ease-out_forwards]">
            <div className="flex flex-wrap gap-4 text-xs font-mono text-[var(--ink-2)] mb-4 text-left">
              <span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full shrink-0 bg-[var(--blue)]"></i> Blue — storage &amp; conveyance</span>
              <span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full shrink-0 bg-[var(--green)]"></i> Green — wetlands &amp; vegetation</span>
              <span className="flex items-center gap-2"><i className="w-3 h-3 rounded-full shrink-0 bg-[var(--grey)]"></i> Grey — engineered structures</span>
            </div>

            {/* Table Header */}
            <div className="hidden md:grid grid-cols-[auto_1fr_140px_120px] gap-4 items-center px-4 py-2 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-200 mb-2 text-left">
              <div className="w-5"></div>
              <div>Intervention Type &amp; Details</div>
              <div className="text-right">Tentative Timeline</div>
              <div className="text-right">Tentative Cost</div>
            </div>

            <div className="flex flex-col gap-2">
              {p.assets.map((a, idx) => {
                const f = funderOf(idx);
                const funded = !!f;
                const pick = selectedPicks.has(idx);
                return (
                  <div
                    key={idx}
                    className={`grid grid-cols-1 md:grid-cols-[auto_1fr_140px_120px] gap-3 md:gap-4 items-center rounded-xl p-3.5 transition-all duration-150 text-left border-2 ${
                      funded
                        ? 'bg-slate-50 border-transparent cursor-default opacity-90'
                        : pick
                          ? 'bg-teal-50 border-teal-400/60 cursor-pointer'
                          : 'bg-slate-50/80 border-transparent hover:border-teal-300/50 hover:bg-white cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.04)]'
                    }`}
                    onClick={funded ? undefined : () => togglePick(idx)}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-150 ${funded ? 'bg-slate-400 border-slate-400' : pick ? 'bg-teal-600 border-teal-600' : 'border-slate-300 bg-white'}`}>
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
                    <div className="flex flex-col gap-0.5 text-left">
                      <b className="text-sm font-bold text-[var(--ink)] flex items-center gap-1.5 flex-wrap">
                        {a.n}
                        <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md ${a.t === 'blue' ? 'bg-[#E2EEF4] text-[#1D5E8C]' : a.t === 'green' ? 'bg-[#E7EFDF] text-[#3E6325]' : 'bg-[#E5E9EB] text-[#475760]'}`}>{a.t}</span>
                        {a.enabler && <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#E5E9EB] text-[#475760]">enabler</span>}
                        {funded && <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-md bg-[#E6E0F0] text-[#5b4b8a]">funded</span>}
                      </b>
                      <span className="text-xs text-[var(--ink-2)] leading-relaxed">{a.fn}{funded && <span> · <b style={{ color: 'var(--ink)' }}>Funded by {f.name}</b></span>}</span>
                    </div>
                    <div className="text-xs font-mono font-semibold text-slate-700 text-left md:text-right bg-slate-100/80 px-2.5 py-1 rounded-md w-fit md:w-auto md:bg-transparent">
                      <span className="md:hidden text-[10px] text-slate-400 mr-1 uppercase">Timeline:</span>
                      {a.timeline && a.timeline !== '—' ? (
                        <span>{a.timeline} {/^\d+(\.\d+)?$/.test(String(a.timeline).trim()) ? (parseFloat(a.timeline) === 1 ? 'month' : 'months') : ''}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </div>
                    <div className="text-sm font-mono font-bold text-[var(--ink)] text-left md:text-right min-w-[70px]">
                      {a.cost > 0 ? rs(a.cost) : <span className="text-slate-400 font-normal">TBD</span>}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center bg-slate-100/70 rounded-xl px-5 py-3.5 mt-4 text-sm font-mono text-slate-600 flex-wrap gap-3">
              <div>Selected assets: <b className="font-bold text-slate-800">{selectedPicks.size}</b> / {p.assets.length}</div>
              <div className="flex items-center gap-6 flex-wrap">
                {totalMonths > 0 && (
                  <div>Total Duration: <b className="font-bold text-slate-800 text-sm md:text-base">{totalMonths % 1 === 0 ? totalMonths.toFixed(0) : totalMonths.toFixed(1)} Months</b></div>
                )}
                <div>
                  {selectedPicks.size > 0 ? (
                    <span>Selected Cost: <b className="font-bold text-teal-700 text-sm md:text-base">{rs(pickCost)}</b> (of {rs(p.total)} total)</span>
                  ) : (
                    <span>Total Project Cost: <b className="font-bold text-teal-700 text-sm md:text-base">{rs(p.total)}</b></span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex gap-3 flex-wrap justify-end mt-4">
              <button
                className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer bg-[#3669A9] hover:bg-[#347745] text-white shadow-sm"
                onClick={openImpact}
              >See impact →</button>
            </div>
          </div>
        );

      case 'impact':
        if (showSelectedRail) {
          const combinedImpact = {
            infiltrationKl: sumFigures(selectedRail, "infiltrationKl"),
            storageKl: sumFigures(selectedRail, "storageKl"),
            runoffMm: sumFigures(selectedRail, "runoffMm"),
            infiltrationMm: sumFigures(selectedRail, "infiltrationMm"),
          };
          return (
            <div className="animate-[fadeInUp_0.3s_ease-out_forwards]">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
                {[
                  ["Infiltration", `${formatMeasure(combinedImpact.infiltrationKl)} KL`],
                  ["Flood storage", `${formatMeasure(combinedImpact.storageKl)} KL`],
                  ["Runoff held back", `${formatMeasure(combinedImpact.runoffMm, 1)} mm`],
                  ["Extra infiltration", `${formatMeasure(combinedImpact.infiltrationMm, 1)} mm`],
                ].map(([label, value]) => (
                  <div key={label} className="rounded-xl border border-[#C8D7BC] bg-[#f3f8ef] px-3 py-3 text-left">
                    <b className="block text-base font-bold text-[#1F2A24]">{value}</b>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[#347745]">{label}</span>
                  </div>
                ))}
              </div>
              <div className="flex flex-col gap-5">
                {selectedRail.map((project) => {
                  const figures = impactFigures(project);
                  return (
                    <section key={project.id} className="text-left">
                      <h3 className="text-base font-bold text-[#1F2A24] m-0 mb-3">{project.name}</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white border border-[#C8D7BC]/90 rounded-2xl p-5 shadow-sm">
                          <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#347745]">Site Level Impact</span>
                          <p className="text-sm text-[#1F2A24] leading-relaxed m-0 mt-2 whitespace-pre-line">
                            {figures.site || "Impact figures are still being added for this project."}
                          </p>
                        </div>
                        <div className="bg-white border border-[#C8D7BC]/90 rounded-2xl p-5 shadow-sm">
                          <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#3669A9]">Subcatchment Level Impact</span>
                          <p className="text-sm text-[#1F2A24] leading-relaxed m-0 mt-2 whitespace-pre-line">
                            {figures.sub || "Subcatchment impact is still being added for this project."}
                          </p>
                        </div>
                      </div>
                    </section>
                  );
                })}
              </div>
              <div className="flex gap-3 flex-wrap justify-end mt-6">
                <button
                  className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer bg-[#3669A9] hover:bg-[#347745] text-white shadow-sm"
                  onClick={() => setActiveTab("funding")}
                >Proceed to Funding →</button>
              </div>
            </div>
          );
        }
        const siteImpact = p.site_level_impact || p._raw?.site_level_impact || 'No site-level impact details available.';
        const subcatchmentImpact = p.subcatchment_level_impact || p._raw?.subcatchment_level_impact || 'No subcatchment-level impact details available.';

        return (
          <div className="animate-[fadeInUp_0.3s_ease-out_forwards]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
              {/* Site Level Impact Card */}
              <div className="bg-white border border-[#C8D7BC]/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#347745] inline-block"></span>
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#347745]">Site Level Impact</span>
                </div>
                {/* <h3 className="text-base font-bold text-slate-800 mb-2">Site Level Impact Summary</h3> */}
                <p className="text-sm text-[#1F2A24] leading-relaxed font-normal whitespace-pre-line">
                  {siteImpact}
                </p>
              </div>

              {/* Subcatchment Level Impact Card */}
              <div className="bg-white border border-[#C8D7BC]/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#3669A9] inline-block"></span>
                  <span className="font-mono text-xs uppercase tracking-wider font-bold text-[#3669A9]">Subcatchment Level Impact</span>
                </div>
                {/* <h3 className="text-base font-bold text-slate-800 mb-2">Subcatchment Level Impact Summary</h3> */}
                <p className="text-sm text-[#1F2A24] leading-relaxed font-normal whitespace-pre-line">
                  {subcatchmentImpact}
                </p>
              </div>
            </div>

            <div className="flex gap-3 flex-wrap justify-end mt-6">
              <button
                className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer bg-[#3669A9] hover:bg-[#347745] text-white shadow-sm"
                onClick={() => setActiveTab('funding')}
              >Proceed to Funding →</button>
            </div>
          </div>
        );

      case 'funding':
        if (showSelectedRail) {
          const scopeTotal = selectedRail.reduce((sum, project) => sum + (project.total || 0), 0);
          const scopeCommitted = selectedRail.reduce((sum, project) => sum + (project.committed || 0), 0);
          const scopeNeeded = Math.max(0, scopeTotal - scopeCommitted);
          const picksSum = selectedAssetEntries.reduce((sum, entry) => sum + (entry.asset.cost || 0), 0);
          const currentFundedPct = scopeTotal > 0 ? scopeCommitted / scopeTotal : 0;
          const addedFundedPct = (fundingMode === "assets" ? picksSum : customAmount) / (scopeTotal || 1);
          const customAllocated = fundingMode === "custom" && customAmount > 0
            ? allocateAcrossProjects(selectedRail, customAmount)
            : [];
          const allFunders = selectedRail.flatMap((project) =>
            project.funders.map((funder) => ({ ...funder, projectName: project.name }))
          );
          return (
            <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 md:gap-8 items-start text-left animate-[fadeInUp_0.3s_ease-out_forwards]">
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div className="w-full max-w-[150px] h-[210px] md:max-w-[200px] md:h-[300px] rounded-2xl overflow-hidden border border-slate-200 mx-auto shrink-0">{renderTank(currentFundedPct, addedFundedPct)}</div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--ink-2)", marginTop: "8px", textAlign: "center" }}>
                  <b>{Math.round(currentFundedPct * 100)}%</b> committed
                </div>
              </div>
              <div>
                <div className="flex gap-1 border border-[#C8D7BC] bg-[#C8D7BC]/15 p-1 rounded-xl mb-6">
                  <button className={`flex-1 py-2 px-3 border-none rounded-lg text-xs font-bold transition-colors duration-150 cursor-pointer ${fundingMode === "assets" ? "bg-[#347745] text-white shadow-sm" : "text-[#6E6455] hover:text-[#1F2A24] bg-transparent"}`} onClick={() => setFundingMode("assets")}>Asset-based funding</button>
                  <button className={`flex-1 py-2 px-3 border-none rounded-lg text-xs font-bold transition-colors duration-150 cursor-pointer ${fundingMode === "custom" ? "bg-[#347745] text-white shadow-sm" : "text-[#6E6455] hover:text-[#1F2A24] bg-transparent"}`} onClick={() => setFundingMode("custom")}>Custom CSR amount</button>
                </div>
                <div className="grid grid-cols-3 gap-4 border border-[#C8D7BC]/80 rounded-2xl p-4 bg-[#C8D7BC]/10 mb-6">
                  <div className="flex flex-col text-left">
                    <b className="text-base md:text-lg font-bold text-[var(--ink)] leading-none mb-1">{rs(scopeTotal)}</b>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-2)]">total cost</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <b className="text-base md:text-lg font-bold text-[var(--ink)] leading-none mb-1">{rs(scopeCommitted)}</b>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-2)]">already committed</span>
                  </div>
                  <div className="flex flex-col text-left">
                    <b className="text-base md:text-lg font-bold text-[var(--ink)] leading-none mb-1">{rs(scopeNeeded)}</b>
                    <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-2)]">still needed</span>
                  </div>
                </div>
                {fundingMode === "assets" ? (
                  <div>
                    <p className="text-sm text-[var(--ink-2)] mb-3">Tick assets under any selected project in Assets and Timelines. The commitment below includes every tick.</p>
                    <div className="bg-white border border-[#C8D7BC] rounded-xl p-4">
                      <span className="font-mono text-[11px] text-[var(--ink-2)]">YOUR SELECTION</span>
                      <div className="flex justify-between items-baseline mt-1">
                        <strong className="text-xl">{selectedAssetEntries.length} assets selected</strong>
                        <strong className="font-mono text-lg text-[var(--teal)]">{rs(picksSum)}</strong>
                      </div>
                      <div className="mt-3 flex flex-col gap-2">
                        {selectedRail.map((project) => {
                          const picks = selectedAssetEntries.filter((entry) => entry.project.id === project.id);
                          if (!picks.length) return null;
                          return (
                            <div key={project.id} className="text-left">
                              <div className="text-xs font-bold text-[#1F2A24]">{project.name}</div>
                              {picks.map((entry) => (
                                <div key={assetSelectionKey(project.id, entry.idx)} className="flex justify-between gap-3 text-xs text-[#6E6455] mt-0.5">
                                  <span>{entry.asset.n}</span>
                                  <span className="font-mono">{entry.asset.cost > 0 ? rs(entry.asset.cost) : "TBD"}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <div className="flex gap-3 flex-wrap justify-end mt-6">
                      <button
                        className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer bg-[#3669A9] hover:bg-[#347745] text-white shadow-sm"
                        onClick={() => setActiveTab("agency")}
                      >Find consultant →</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-[var(--ink-2)] mb-3">Enter a CSR amount. It is applied across the selected projects, one unfunded asset after another.</p>
                    <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3 py-2.5 rounded-xl">
                      <span className="font-mono text-[var(--ink-2)]">₹</span>
                      <input
                        type="number"
                        min="1"
                        max={scopeNeeded}
                        value={customAmount || ""}
                        onChange={(e) => setCustomAmount(parseFloat(e.target.value) || 0)}
                        placeholder="Enter amount in Lakhs"
                        className="border-none outline-none w-full text-base font-bold"
                      />
                      <span className="font-mono text-[var(--ink-2)]">Lakhs</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                      <div>
                        <div className="font-mono text-[10.5px] uppercase tracking-widest text-[var(--ink-2)] mb-3">Your custom allocation</div>
                        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-2">
                          {customAllocated.length === 0 ? (
                            <div className="text-xs text-[var(--ink-2)] italic p-4 text-center">Enter an amount to see how it allocates across the selected projects.</div>
                          ) : customAllocated.map((item, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2.5">
                              <b className="block text-xs text-[var(--ink)]">{item.name}</b>
                              <span className="block text-[11px] text-[#6E6455]">{item.projectName} · {item.partial ? "Partial funding" : "Full asset funding"}</span>
                              <span className="block text-xs font-mono font-bold mt-1">{rs(item.cost)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="font-mono text-[10.5px] uppercase tracking-widest text-[var(--ink-2)] mb-3">Existing funders ledger</div>
                        <div className="flex flex-col gap-2 max-h-[260px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-2">
                          {allFunders.length === 0 ? (
                            <div className="text-xs text-[var(--ink-2)] italic p-4 text-center">No commitments for these projects yet.</div>
                          ) : allFunders.map((funder, idx) => (
                            <div key={idx} className="bg-white border border-slate-200 rounded-lg p-2.5">
                              <b className="block text-xs text-[var(--ink)]">{funder.name}</b>
                              <span className="block text-[11px] text-[#6E6455]">{funder.projectName}</span>
                              <span className="block text-xs font-mono font-bold mt-1">{rs(funder.amount)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3 flex-wrap justify-end mt-6">
                      <button
                        className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer bg-[#3669A9] hover:bg-[#347745] text-white shadow-sm"
                        onClick={() => setActiveTab("agency")}
                      >Find consultant →</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        }
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
          <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-5 md:gap-8 items-start text-left animate-[fadeInUp_0.3s_ease-out_forwards]">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="w-full max-w-[150px] h-[210px] md:max-w-[200px] md:h-[300px] rounded-2xl overflow-hidden border border-slate-200 mx-auto shrink-0">{tankSVG}</div>
              <div style={{ fontFamily: 'var(--mono)', fontSize: '11px', color: 'var(--ink-2)', marginTop: '8px', textAlign: 'center' }}>
                <b>{Math.round(currentFundedPct * 100)}%</b> committed {fundingMode === 'assets' && picksSum > 0 ? <span>+ <b>{Math.round(addedFundedPct * 100)}%</b> selected</span> : ''}
              </div>
            </div>

            <div>
              <div className="flex gap-1 border border-[#C8D7BC] bg-[#C8D7BC]/15 p-1 rounded-xl mb-6">
                <button className={`flex-1 py-2 px-3 border-none rounded-lg text-xs font-bold transition-colors duration-150 cursor-pointer ${fundingMode === 'assets' ? 'bg-[#347745] text-white shadow-sm' : 'text-[#6E6455] hover:text-[#1F2A24] bg-transparent'}`} onClick={() => setFundingMode('assets')}>Asset-based funding</button>
                <button className={`flex-1 py-2 px-3 border-none rounded-lg text-xs font-bold transition-colors duration-150 cursor-pointer ${fundingMode === 'custom' ? 'bg-[#347745] text-white shadow-sm' : 'text-[#6E6455] hover:text-[#1F2A24] bg-transparent'}`} onClick={() => setFundingMode('custom')}>Custom CSR amount</button>
              </div>

              <div className="grid grid-cols-3 gap-4 border border-[#C8D7BC]/80 rounded-2xl p-4 bg-[#C8D7BC]/10 mb-6">
                <div className="flex flex-col text-left">
                  <b className="text-base md:text-lg font-bold text-[var(--ink)] leading-none mb-1">{rs(p.total)}</b>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-2)]">total project cost</span>
                </div>
                <div className="flex flex-col text-left">
                  <b className="text-base md:text-lg font-bold text-[var(--ink)] leading-none mb-1">{rs(p.committed)}</b>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-2)]">already committed</span>
                </div>
                <div className="flex flex-col text-left">
                  <b className="text-base md:text-lg font-bold text-[var(--ink)] leading-none mb-1">{rs(needed)}</b>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-2)]">still needed</span>
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
                  <div className="flex gap-3 flex-wrap justify-end mt-6">
                    <button
                      className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer bg-[#3669A9] hover:bg-[#347745] text-white shadow-sm"
                      onClick={() => setActiveTab('agency')}
                    >
                      Find consultant →
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <p style={{ fontSize: '14px', color: 'var(--ink-2)', marginBottom: '12px' }}>
                    Enter your desired CSR funding amount. The system will automatically allocate it to the next pending asset in sequence.
                  </p>
                  <div className="flex items-center gap-2.5 bg-white border border-slate-200 px-3 py-2.5 rounded-xl">
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
                    <span style={{ fontFamily: 'var(--mono)', color: 'var(--ink-2)' }}>Lakhs</span>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 text-left">
                      <div>
                        <div className="font-mono text-[10.5px] uppercase tracking-widest text-[var(--ink-2)] mb-3 text-left">Your custom allocation</div>
                        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-2 text-left">
                          {customAllocated.length === 0 ? (
                            <div className="text-xs text-[var(--ink-2)] italic p-4 text-center w-full">Enter an amount to see how it allocates to assets.</div>
                          ) : (
                            customAllocated.map((item, idx) => (
                              <div key={idx} className="grid grid-cols-[1fr_auto] gap-3 items-center bg-white border border-slate-200 rounded-lg p-2.5 text-left">
                                <div className="flex flex-col text-left">
                                  <b className="text-xs font-bold text-[var(--ink)]">{item.n}</b>
                                  <span style={{ color: 'var(--teal-d)', fontFamily: 'var(--mono)', fontSize: '11px', display: 'block' }}>
                                    {item.partial ? 'Partial funding' : 'Full asset funding'}
                                  </span>
                                </div>
                                <div className="text-xs font-mono font-bold text-[var(--ink)] text-right">{rs(item.cost)}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <div className="font-mono text-[10.5px] uppercase tracking-widest text-[var(--ink-2)] mb-3 text-left">Existing funders ledger</div>
                        <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto border border-slate-200 rounded-xl bg-slate-50/50 p-2 text-left">
                          {p.funders.length === 0 ? (
                            <div className="text-xs text-[var(--ink-2)] italic p-4 text-center w-full">No commitments for this project yet. Be the first!</div>
                          ) : (
                            p.funders.map((f, idx) => (
                              <div key={idx} className="grid grid-cols-[auto_1fr_auto] gap-3 items-center bg-white border border-slate-200 rounded-lg p-2.5 text-left">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-mono text-slate-500 border border-slate-200 shrink-0">{initials(f.name)}</div>
                                <div className="flex flex-col text-left">
                                  <b className="text-xs font-bold text-[var(--ink)]">{f.name}</b>
                                  <span className="text-[10px] text-slate-400 mt-0.5">{f.sector} · {f.date}</span>
                                  <span className="fa" style={{ display: 'block', fontSize: '11px', fontFamily: 'var(--mono)', color: 'var(--teal-d)' }}>
                                    {f.idx.length} assets funded
                                  </span>
                                </div>
                                <div className="text-xs font-mono font-bold text-[var(--ink)] text-right">{rs(f.amount)}</div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 flex-wrap justify-end mt-6">
                    <button
                      className="px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold transition-all duration-150 cursor-pointer bg-[#3669A9] hover:bg-[#347745] text-white shadow-sm"
                      onClick={() => setActiveTab('agency')}
                    >
                      Find consultant →
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'agency': {
        let selectionItems = [];
        let selectionTotal = 0;
        if (fundingMode === "assets") {
          if (showSelectedRail) {
            selectionItems = selectedAssetEntries.map((entry) => ({
              key: assetSelectionKey(entry.project.id, entry.idx),
              name: entry.asset.n,
              meta: entry.project.name,
              amount: entry.asset.cost > 0 ? rs(entry.asset.cost) : "TBD",
            }));
            selectionTotal = selectedAssetEntries.reduce((sum, entry) => sum + (entry.asset.cost || 0), 0);
          } else {
            selectionItems = [...selectedPicks].map((idx) => {
              const asset = p.assets[idx];
              return {
                key: String(idx),
                name: asset?.n || "Asset",
                meta: p.name,
                amount: asset?.cost > 0 ? rs(asset.cost) : "TBD",
              };
            });
            selectionTotal = [...selectedPicks].reduce((sum, idx) => sum + (p.assets[idx]?.cost || 0), 0);
          }
        } else if (customAmount > 0) {
          const allocated = showSelectedRail
            ? allocateAcrossProjects(selectedRail, customAmount)
            : (() => {
              let remaining = customAmount;
              const rows = [];
              unfunded.forEach((idx) => {
                if (remaining <= 0) return;
                const asset = p.assets[idx];
                if (!asset) return;
                if (remaining >= asset.cost) {
                  rows.push({ projectName: p.name, name: asset.n, cost: asset.cost, partial: false });
                  remaining -= asset.cost;
                } else {
                  rows.push({ projectName: p.name, name: asset.n, cost: remaining, partial: true });
                  remaining = 0;
                }
              });
              return rows;
            })();
          selectionItems = allocated.map((item, idx) => ({
            key: String(idx),
            name: item.name,
            meta: `${item.projectName}${item.partial ? " · partial" : ""}`,
            amount: rs(item.cost),
          }));
          selectionTotal = customAmount;
        }
        const canDownload = selectionItems.length > 0;
        const openConsultant = (project, agencyId) => {
          if (showSelectedRail) {
            setConsultantByProject((current) => ({ ...current, [project.id]: agencyId }));
          } else {
            setSelectedAgencyId(agencyId);
          }
          setConsultantDetail({ projectId: project.id, agencyId });
        };
        const consultantProjects = showSelectedRail ? selectedRail : [p];
        return (
          <div className="animate-[fadeInUp_0.3s_ease-out_forwards] text-left flex flex-col gap-6">
            <div className="rounded-2xl border border-[#C8D7BC] bg-[#f7faf4] p-4">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#6E6455]">Your selection</div>
                  <strong className="block text-base text-[#1F2A24] mt-1">
                    {canDownload
                      ? `${selectionItems.length} item${selectionItems.length === 1 ? "" : "s"} · ${rs(selectionTotal)}`
                      : "Nothing selected yet"}
                  </strong>
                  <p className="text-sm text-[#6E6455] m-0 mt-1 leading-relaxed">
                    {canDownload
                      ? "Download this list, then send your interest to a consultant. The email includes who you are and which project you want them on."
                      : "Tick assets on Assets and Timelines, or enter a CSR amount on Funding. You can still contact a consultant below."}
                  </p>
                </div>
                <button
                  type="button"
                  className="ml-auto px-5 py-2.5 rounded-lg text-xs md:text-sm font-semibold bg-[#3669A9] hover:bg-[#347745] text-white cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canDownload}
                  onClick={downloadCommitment}
                >Download selection</button>
              </div>
              {canDownload && (
                <div className="mt-3 flex flex-col gap-1.5">
                  {selectionItems.map((item) => (
                    <div key={item.key} className="flex justify-between gap-3 text-xs text-[#1F2A24]">
                      <span>{item.name}<span className="text-[#6E6455]"> · {item.meta}</span></span>
                      <span className="font-mono shrink-0">{item.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {consultantProjects.map((project) => {
              const agencies = [...project.team, ...project.alts];
              return (
                <section key={project.id}>
                  <h3 className="text-base font-bold text-[#1F2A24] m-0 mb-3">
                    {showSelectedRail ? project.name : "Project restoration team"}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {agencies.map((id) => {
                      const ag = AG[id];
                      const isLead = project.team[0] === id;
                      const isTeam = project.team.includes(id);
                      const isOpen = consultantDetail?.projectId === project.id && consultantDetail?.agencyId === id;
                      const interestKey = `${project.id}::${id}`;
                      const sentNote = sentInterest[interestKey];
                      const sending = Boolean(sendingInterest[interestKey]);
                      return (
                        <div
                          key={id}
                          className={`bg-white border rounded-xl p-4 text-left flex flex-col ${isOpen ? "border-[var(--teal)] ring-1 ring-[var(--teal)] bg-[#f7f9f6]" : "border-slate-200"}`}
                        >
                          <span className="font-mono text-[9px] uppercase tracking-wider text-[var(--ink-2)]">
                            {isLead ? "Lead Agency" : isTeam ? "Team Partner" : "Available Partner"}
                          </span>
                          <h4 className="text-sm font-bold text-[var(--ink)] mt-1.5 m-0">{ag.name}</h4>
                          <p className="text-[11px] text-[var(--ink-2)] mt-1 mb-0 leading-snug">{ag.role}</p>
                          <div className="mt-auto pt-3 flex flex-nowrap gap-2 justify-end">
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-[#3669A9] hover:bg-[#347745] text-white cursor-pointer"
                              onClick={() => openConsultant(project, id)}
                            >View details</button>
                            <button
                              type="button"
                              className="px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap bg-[#3669A9] hover:bg-[#347745] text-white cursor-pointer disabled:opacity-70 disabled:cursor-default"
                              disabled={sending || Boolean(sentNote && !sentNote.failed)}
                              onClick={() => sendConsultantInterest(project, id)}
                            >{interestButtonLabel(sentNote, sending)}</button>
                          </div>
                          {sentNote && <p className={`text-[11px] leading-relaxed m-0 mt-2 text-right ${sentNote.failed ? "text-red-600" : "text-[#347745]"}`}>{sentNote.text}</p>}
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        );
      }

      case 'status': {
        const statusProjects = showSelectedRail ? selectedRail : [p];
        return (
          <div className="animate-[fadeInUp_0.3s_ease-out_forwards] flex flex-col gap-8">
            <p className="text-sm text-[#6E6455] m-0">
              Each project moves along these steps, one at a time. The filled number is where it is now.
            </p>
            {statusProjects.map((project) => (
              <ProjectStatusList key={project.id} project={project} />
            ))}
          </div>
        );
      }

      case 'docs':
        return (
          <div className="animate-[fadeInUp_0.3s_ease-out_forwards] text-left">
            <div className={`border border-slate-200 rounded-xl bg-[#FAFBF9] mb-3 overflow-hidden shadow-sm ${openAccordions.has('m-vwba') ? 'open' : ''}`}>
              <button className="w-full flex justify-between items-center p-4 border-none text-left bg-transparent cursor-pointer hover:bg-slate-50/50 transition-colors duration-150" onClick={() => toggleAccordion('m-vwba')}>
                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--ink-2)]">Methodology</span>
                  <h4 className="text-sm font-bold text-[var(--ink)] mt-0.5">WRI Volumetric Water Benefit Accord (VWBA)</h4>
                </div>
                <span className={`text-[var(--ink-2)] font-semibold transition-transform duration-200 ${openAccordions.has('m-vwba') ? 'rotate-90' : ''}`}>→</span>
              </button>
              {openAccordions.has('m-vwba') && (
                <div className="p-4 border-t border-slate-200 bg-white text-sm text-[var(--ink-2)] leading-relaxed text-left flex flex-col gap-3">
                  <p>
                    The Volumetric Water Benefit Accord (VWBA) provides a standard framework to quantify how water stewardship activities contribute to local water resilience.
                  </p>
                  <h5 className="text-xs font-bold text-[var(--ink)] m-0 uppercase tracking-wider mt-1 text-left">Key Quantified Benefits</h5>
                  <ul className="pl-[18px] margin-0 flex flex-col gap-1.5 list-disc text-left">
                    <li className="text-xs md:text-sm leading-relaxed text-[var(--ink-2)]"><b>In-Lake Storage Restored:</b> Restoring lake capacity (e.g. through desilting) provides direct storm-water buffering.</li>
                    <li className="text-xs md:text-sm leading-relaxed text-[var(--ink-2)]"><b>Runoff Retention:</b> Catchment interventions (bioswales, wetlands, reforestation) reduce peak stormwater runoff by lowering the Curve Number (CN).</li>
                    <li className="text-xs md:text-sm leading-relaxed text-[var(--ink-2)]"><b>Aquifer Recharge:</b> Directed recharge well fields divert stormwater into shallow aquifers rather than leaving it to flood surface roads.</li>
                  </ul>
                </div>
              )}
            </div>

            <div className={`border border-slate-200 rounded-xl bg-[#FAFBF9] mb-3 overflow-hidden shadow-sm ${openAccordions.has('m-scs') ? 'open' : ''}`}>
              <button className="w-full flex justify-between items-center p-4 border-none text-left bg-transparent cursor-pointer hover:bg-slate-50/50 transition-colors duration-150" onClick={() => toggleAccordion('m-scs')}>
                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--ink-2)]">Hydrology</span>
                  <h4 className="text-sm font-bold text-[var(--ink)] mt-0.5">Soil Conservation Service (SCS) Curve Number Model</h4>
                </div>
                <span className={`text-[var(--ink-2)] font-semibold transition-transform duration-200 ${openAccordions.has('m-scs') ? 'rotate-90' : ''}`}>→</span>
              </button>
              {openAccordions.has('m-scs') && (
                <div className="p-4 border-t border-slate-200 bg-white text-sm text-[var(--ink-2)] leading-relaxed text-left flex flex-col gap-3">
                  <p>
                    The SCS Curve Number (CN) model is a widely accepted empirical method for predicting storm runoff from a catchment based on soil types, land cover, and imperviousness.
                  </p>
                  <h5 className="text-xs font-bold text-[var(--ink)] m-0 uppercase tracking-wider mt-1 text-left">Runoff Equation</h5>
                  <pre className="bg-slate-50 border border-slate-200 rounded-lg p-3 font-mono text-xs text-[var(--ink-2)] overflow-x-auto m-0">
{`S = (25400 / CN) - 254
Ia = 0.2 * S
Q = (P - Ia)² / (P - Ia + S)  (for P > Ia)`}
                  </pre>
                  <p>Where:</p>
                  <ul className="pl-[18px] margin-0 flex flex-col gap-1.5 list-disc text-left">
                    <li className="text-xs md:text-sm leading-relaxed text-[var(--ink-2)]"><b>P:</b> Design storm rainfall (mm)</li>
                    <li className="text-xs md:text-sm leading-relaxed text-[var(--ink-2)]"><b>CN:</b> Curve Number (reflecting permeability)</li>
                    <li className="text-xs md:text-sm leading-relaxed text-[var(--ink-2)]"><b>Ia:</b> Initial abstraction (mm)</li>
                    <li className="text-xs md:text-sm leading-relaxed text-[var(--ink-2)]"><b>S:</b> Soil water retention parameter (mm)</li>
                    <li className="text-xs md:text-sm leading-relaxed text-[var(--ink-2)]"><b>Q:</b> Direct storm runoff depth (mm)</li>
                  </ul>
                </div>
              )}
            </div>

            <div className={`border border-slate-200 rounded-xl bg-[#FAFBF9] mb-3 overflow-hidden shadow-sm ${openAccordions.has('m-dpr') ? 'open' : ''}`}>
              <button className="w-full flex justify-between items-center p-4 border-none text-left bg-transparent cursor-pointer hover:bg-slate-50/50 transition-colors duration-150" onClick={() => toggleAccordion('m-dpr')}>
                <div>
                  <span className="font-mono text-[9.5px] uppercase tracking-wider text-[var(--ink-2)]">Financials</span>
                  <h4 className="text-sm font-bold text-[var(--ink)] mt-0.5">Detailed Project Report (DPR) Costing</h4>
                </div>
                <span className={`text-[var(--ink-2)] font-semibold transition-transform duration-200 ${openAccordions.has('m-dpr') ? 'rotate-90' : ''}`}>→</span>
              </button>
              {openAccordions.has('m-dpr') && (
                <div className="p-4 border-t border-slate-200 bg-white text-sm text-[var(--ink-2)] leading-relaxed text-left flex flex-col gap-3">
                  <p>
                    Detailed Project Reports outline the engineering design and costed milestones for every asset.
                  </p>
                  {showSelectedRail ? selectedRail.map((project) => (
                    <div key={project.id} className="mt-4">
                      <h5 className="text-sm font-bold text-[var(--ink)] m-0 mb-2">{project.name}</h5>
                      <table className="w-full border-collapse text-xs md:text-sm">
                        <thead>
                          <tr>
                            <th className="border-b border-slate-200 pb-2 text-left text-[11px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Asset Item</th>
                            <th className="border-b border-slate-200 pb-2 text-left text-[11px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Type</th>
                            <th className="border-b border-slate-200 pb-2 text-left text-[11px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Cost</th>
                            <th className="border-b border-slate-200 pb-2 text-left text-[11px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Timeline</th>
                          </tr>
                        </thead>
                        <tbody>
                          {project.assets.map((a, idx) => (
                            <tr key={idx} className="border-t border-[#C8D7BC]">
                              <td className="py-2 text-[var(--ink-2)]">{a.n}</td>
                              <td className="py-2 text-[var(--ink-2)]">{a.t.toUpperCase()}</td>
                              <td className="py-2 text-[var(--ink-2)] font-mono">{a.cost > 0 ? rs(a.cost) : "TBD"}</td>
                              <td className="py-2 text-[var(--ink-2)]">{assetTimeline(a.timeline)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )) : (
                  <table className="w-full border-collapse text-xs md:text-sm mt-3" style={{ width: '100%', borderCollapse: 'collapse', marginTop: '10px' }}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left', padding: '8px' }} className="border-b border-slate-200 pb-2 text-[11px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Asset Item</th>
                        <th style={{ textAlign: 'left', padding: '8px' }} className="border-b border-slate-200 pb-2 text-[11px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Type</th>
                        <th style={{ textAlign: 'left', padding: '8px' }} className="border-b border-slate-200 pb-2 text-[11px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Cost (Lakhs)</th>
                        <th style={{ textAlign: 'left', padding: '8px' }} className="border-b border-slate-200 pb-2 text-[11px] font-bold text-[var(--ink-2)] uppercase tracking-wider">Target Phase</th>
                      </tr>
                    </thead>
                    <tbody>
                      {p.assets.map((a, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--line)' }}>
                          <td style={{ padding: '8px' }} className="py-2 text-[var(--ink-2)]">{a.n}</td>
                          <td style={{ padding: '8px' }} className="py-2 text-[var(--ink-2)]">{a.t.toUpperCase()}</td>
                          <td style={{ padding: '8px' }} className="py-2 text-[var(--ink-2)] font-mono">₹{a.cost.toFixed(1)} L</td>
                          <td style={{ padding: '8px' }} className="py-2 text-[var(--ink-2)]">Phase {a.phase}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  )}
                </div>
              )}
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
    <div className="w-full min-h-screen bg-[var(--bg-page)] text-[#1F2A24] font-sans antialiased text-[15px] xl:text-base 2xl:text-[17px] leading-relaxed pb-12">
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        :root {
          --ink: #1F2A24;
          --ink-2: #6E6455;
          --teal: #347745;
          --teal-d: #264b32;
          --teal-l: #C8D7BC;
          --line: #C8D7BC;
          --paper: #FFFFFF;
          --blue: #3669A9;
          --green: #347745;
          --grey: #A99E8A;
          --accent: #F2C230;
        }
      `}</style>

      {/* Hero header strip */}
      <section className="bg-gradient-to-br from-[#1F2A24] via-[#264b32] to-[#347745] text-white overflow-hidden relative">
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#C8D7BC]/15 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/4 w-64 h-64 bg-[#F2C230]/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="w-full max-w-[1400px] xl:max-w-[1680px] 2xl:max-w-[2100px] mx-auto px-4 sm:px-6 lg:px-8 xl:px-10 py-6 sm:py-8 xl:py-10 pb-7 sm:pb-9 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 lg:gap-8 xl:gap-12 relative z-10">
          <div className="text-left max-w-2xl xl:max-w-3xl 2xl:max-w-4xl">
            {onBack && (
              <button
                onClick={onBack}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[#F2C230] hover:bg-[#e0b228] text-[#1F2A24] rounded-lg text-xs font-mono font-bold border border-[#F2C230] transition-all cursor-pointer mb-4 shadow-sm"
              >
                ← Back to Map Explorer
              </button>
            )}
            <div className="inline-flex items-center gap-2 font-mono text-[10px] tracking-widest uppercase text-[#C8D7BC] bg-white/10 border border-white/20 px-3 py-1 rounded-full mb-4">
              🌊 Corporate water stewardship · Bengaluru
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl xl:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Fund flood-mitigation interventions,{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F2C230] to-[#C8D7BC]">
                asset by asset.
              </span>
            </h1>
            <p className="text-white/80 max-w-[60ch] xl:max-w-[72ch] mt-3 text-sm md:text-base xl:text-lg leading-relaxed">
              {showSelectedRail
                ? "The totals on the right cover only the projects you selected. Every tab below lists those same projects."
                : "Each intervention is broken into fundable blue, green and grey assets and quantified in cubic metres with WRI VWBA. Pick a project to explore it."}
            </p>
          </div>
          <div className="grid grid-cols-2 w-full sm:w-auto sm:flex gap-3 sm:gap-4 sm:flex-wrap text-left shrink-0">
            {[
              { v: totalProjects, l: showSelectedRail ? 'Selected projects' : 'Projects listed' },
              { v: `${(totalVwb / 1e6).toFixed(2)}M m³`, l: 'Annual VWB' },
              { v: `₹${(totalCost / 100).toFixed(1)} Cr`, l: 'Total cost' },
              { v: totalPeople.toLocaleString('en-IN'), l: 'People in scope' },
            ].map(({ v, l }) => (
              <div key={l} className="flex flex-col text-left bg-white/10 backdrop-blur-sm border border-white/15 rounded-2xl px-4 sm:px-5 py-3 sm:py-4 min-w-[100px]">
                <b className="font-bold text-lg sm:text-xl md:text-2xl xl:text-3xl text-white tracking-tight">{v}</b>
                <span className="font-mono text-[10px] xl:text-xs tracking-wider uppercase text-[#C8D7BC] mt-1">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main app content - full width single project details */}
      <main className="w-full max-w-[1400px] xl:max-w-[1680px] 2xl:max-w-[2100px] mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-4 sm:py-7 xl:py-8 pb-10 sm:pb-14">
        <div className={showSelectedRail ? "grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[320px_minmax(0,1fr)] 2xl:grid-cols-[360px_minmax(0,1fr)] gap-4 xl:gap-6 items-start" : "w-full"}>
          {showSelectedRail && (
            <div className="flex flex-col gap-4 lg:sticky lg:top-4">
              <aside className="bg-white rounded-3xl border border-[#C8D7BC]/80 shadow-sm p-3 xl:p-4">
                <div className="px-2 pt-1 pb-2">
                  <div className="text-2xl font-extrabold text-[#1F2A24] leading-none">
                    {selectedRail.length} selected project{selectedRail.length === 1 ? "" : "s"}
                  </div>
                  <p className="text-[11px] text-[#6E6455] m-0 mt-2 leading-relaxed">
                    Every tab covers these projects together.
                  </p>
                </div>
                <div className="flex flex-col">
                  {selectedRail.map((proj) => (
                    <div key={proj.id} className="px-2 py-2.5 border-t border-[#C8D7BC]/70">
                      <span className="block text-sm xl:text-base font-bold text-[#1F2A24] leading-snug">{proj.name}</span>
                      <span className="block text-[11px] font-semibold text-[#6E6455] mt-0.5">{rs(proj.total || 0)}</span>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          )}
          {/* Main details panel */}
          <section className="bg-white rounded-3xl border border-[#C8D7BC]/80 shadow-sm overflow-hidden text-left flex flex-col w-full min-w-0">

            {/* Panel header */}
            <div className="px-4 sm:px-7 xl:px-8 pt-5 sm:pt-7 xl:pt-8 pb-0 bg-white">
              <div className="flex justify-between items-start flex-wrap gap-4 mb-5">
                <div>
                  <h2 className="text-xl sm:text-2xl xl:text-3xl font-bold text-[#1F2A24] m-0 tracking-tight">
                    {showSelectedRail
                      ? `${selectedRail.length} selected project${selectedRail.length === 1 ? "" : "s"}`
                      : p.name}
                  </h2>
                  <div className="text-sm xl:text-base text-[#6E6455] font-medium mt-1 flex items-start sm:items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#6E6455] shrink-0">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    {showSelectedRail
                      ? "Cost, time, assets, impact, funding, and documents for every project you chose"
                      : p.loc}
                  </div>
                </div>
                {!showSelectedRail && (
                <div className="flex gap-2 flex-wrap">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold ${isZero ? 'bg-[#F2C230]/20 text-[#1F2A24] border border-[#F2C230]/40' : 'bg-[#C8D7BC]/40 text-[#347745] border border-[#C8D7BC]'}`}>
                    <i className={`w-1.5 h-1.5 rounded-full shrink-0 ${isZero ? 'bg-[#F2C230]' : 'bg-[#347745]'}`}></i>
                    {isZero ? 'Open · 0% committed' : `${Math.round(p.committedPct * 100)}% committed`}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-[#C8D7BC]/20 text-[#1F2A24] border border-[#C8D7BC]/50 rounded-full px-3.5 py-1.5 text-xs font-semibold">
                    {p.funders.length} funder{p.funders.length !== 1 ? 's' : ''}
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-[#C8D7BC]/20 text-[#1F2A24] border border-[#C8D7BC]/50 rounded-full px-3.5 py-1.5 text-xs font-semibold">
                    Lead · {leadAg.name}
                  </span>
                </div>
                )}
              </div>

              {/* Tab nav */}
              <nav className="flex gap-1 xl:gap-2 overflow-x-auto overflow-y-hidden pb-0">
                {TABS.map(([k, label]) => (
                  <button
                    key={k}
                    className={`text-[13px] xl:text-sm font-semibold px-3 sm:px-4 xl:px-5 py-2.5 whitespace-nowrap rounded-t-xl border-b-2 -mb-[1px] cursor-pointer transition-all duration-150 bg-transparent ${
                      activeTab === k
                        ? 'text-[#347745] border-b-[#347745] font-bold'
                        : 'text-[#6E6455] border-transparent hover:text-[#1F2A24]'
                    }`}
                    onClick={(e) => {
                      setActiveTab(k);
                      e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
                    }}
                  >
                    {label}
                  </button>
                ))}
              </nav>
              <div className="h-px bg-[#C8D7BC]/60 -mx-4 sm:-mx-7"></div>
            </div>

            {/* Panel content */}
            <div className="p-4 sm:p-7 xl:p-8 2xl:p-10 text-left">
              {renderActivePanel()}
            </div>
          </section>

        </div>
      </main>

      {impactPromptOpen && createPortal(
        <div
          className="fixed inset-0 bg-[#1F2A24]/50 backdrop-blur-md z-[3000] flex items-center justify-center p-3 sm:p-4"
          onClick={() => setImpactPromptOpen(false)}
        >
          <div
            className="bg-white rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.2)] w-full max-w-[440px] border border-[#C8D7BC] p-5 sm:p-7 text-left"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-labelledby="impact-prompt-title"
          >
            <h3 id="impact-prompt-title" className="text-lg font-bold text-[#1F2A24] m-0">Select all assets</h3>
            <p className="text-sm leading-relaxed text-[#1F2A24] m-0 mt-3">
              For better impact results, we recommend selecting all assets in the project. Do you still wish to continue?
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                className="px-4 py-2.5 rounded-lg text-sm font-semibold border border-[#C8D7BC] bg-white text-[#1F2A24] cursor-pointer hover:bg-[#f3f8ef]"
                onClick={() => setImpactPromptOpen(false)}
              >Review assets</button>
              <button
                type="button"
                className="px-4 py-2.5 rounded-lg text-sm font-semibold bg-[#3669A9] hover:bg-[#347745] text-white cursor-pointer"
                onClick={() => {
                  setImpactPromptOpen(false);
                  setActiveTab("impact");
                }}
              >Yes</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {consultantDetail && (() => {
        const detailProject = PROJECTS.find((project) => project.id === consultantDetail.projectId);
        const detailAgency = AG[consultantDetail.agencyId];
        if (!detailProject || !detailAgency) return null;
        return createPortal(
          <div
            className="fixed inset-0 bg-[#1F2A24]/50 backdrop-blur-md z-[3000] flex items-center justify-center p-3 sm:p-4"
            onClick={() => setConsultantDetail(null)}
          >
            <div
              className="bg-white rounded-3xl shadow-[0_24px_80px_rgba(0,0,0,0.2)] w-full max-w-[520px] max-h-[calc(100vh-24px)] flex flex-col overflow-hidden animate-[fadeInUp_0.25s_ease-out_forwards] border border-[#C8D7BC]"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="shrink-0 px-5 sm:px-7 pt-5 sm:pt-6 pb-4 sm:pb-5 bg-gradient-to-br from-[#C8D7BC]/20 to-white relative text-left">
                <div className="font-mono text-[10px] uppercase tracking-widest text-[#6E6455] mb-1">{detailAgency.type}</div>
                <h3 className="text-xl font-bold text-[#1F2A24] m-0 pr-8">{detailAgency.name}</h3>
                <p className="text-sm text-[#6E6455] m-0 mt-1">{detailAgency.role}</p>
                <button
                  className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-xl text-[#6E6455] hover:text-[#1F2A24] hover:bg-[#C8D7BC]/30 transition-colors duration-150 cursor-pointer border-none bg-transparent leading-none"
                  onClick={() => setConsultantDetail(null)}
                  aria-label="Close consultant details"
                >×</button>
              </div>
              <div className="shrink-0 h-px bg-[#C8D7BC]/60"></div>
              <div className="p-5 sm:p-7 text-left overflow-y-auto">
                <p className="text-xs font-semibold text-[#347745] m-0 mb-3">{detailProject.name}</p>
                <p className="text-sm leading-relaxed text-slate-600 m-0">{detailAgency.blurb}</p>
                <div className="mt-4">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-[#6E6455] mb-2">Core strengths</div>
                  <div className="flex flex-wrap gap-1.5">
                    {detailAgency.strengths.map((strength) => (
                      <span key={strength} className="text-[10px] font-bold text-slate-500 bg-slate-100 border border-slate-200 rounded px-2 py-0.5">{strength}</span>
                    ))}
                  </div>
                </div>
                <p className="text-[12px] text-[#6E6455] mt-4 mb-0"><b>Known for:</b> {detailAgency.known}</p>
              </div>
            </div>
          </div>,
          document.body
        );
      })()}
    </div>
  );
};

export default NewProjectsView;
