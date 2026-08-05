import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../config/api';
import Analytics from '../../pages/Analytics';
import NewProjectsView from './NewProjectsView';
import Interventions from './Interventions';

// Fallback local datasets (both JSON and rich CSV v1 with ward mapping telemetry)
import localProjects from '../../data/projects.json';
import localWells from '../../data/wells.json';
import v1WellsCsv from '../../data/v1_wells_with_wards.csv?raw';
import v1ProjectsCsv from '../../data/v1_projects_with_wards.csv?raw';

const NEW_PROJECTS_DATA = [
  {
    id: 'kasavanahalli',
    name: 'Kasavanahalli Lake',
    stage: 'Design',
    phase: 'Phase 2',
    progress: 34,
    cost: '₹4.20 Cr',
    committed: '₹4.20 Cr',
    lat: 12.903973,
    lng: 77.667712,
    watershedId: 'kasavanahalli_ws',
    details: 'Rejuvenation of the lake. Focuses on setting up wetland systems, desilting, channel restoration, improving water quality index, and constructing perimeter walking pathways for the local community.'
  },
  {
    id: 'doddakannelli',
    name: 'Doddakannelli Lake',
    stage: 'Design',
    phase: 'Phase 1',
    progress: 11,
    cost: '₹2.10 Cr',
    committed: '₹2.10 Cr',
    lat: 12.9126,
    lng: 77.6896,
    watershedId: 'kasavanahalli_ws',
    details: 'Diagnosing sewage inlet points and catchment siltation. A detailed project report (DPR) is underway to divert raw sewage from entering the main lake body.'
  },
  {
    id: 'varthur',
    name: 'Varthur Lake — Zone 1',
    stage: 'Diagnosis',
    phase: 'Phase 1',
    progress: 10,
    cost: '₹9.60 Cr',
    committed: '₹9.60 Cr',
    lat: 12.9431,
    lng: 77.7471,
    watershedId: 'kadugodi_ws',
    details: 'Comprehensive catchment mapping and water quality monitoring. Focuses on sediment analysis and planning massive de-weeding and aeration systems to restore the lake\'s ecological balance.'
  },
  {
    id: 'halanayakanahalli',
    name: 'Halanayakanahalli Lake',
    stage: 'Diagnosis',
    phase: 'Phase 1',
    progress: 0,
    cost: '₹2.80 Cr',
    committed: '₹2.80 Cr',
    lat: 12.8988,
    lng: 77.6922,
    watershedId: 'kasavanahalli_ws',
    details: 'Preliminary environmental baseline assessment. Project kicked off to map the incoming storm-water drains and outline encroachment boundaries for eviction and preservation.'
  },
  {
    id: 'saulkere',
    name: 'Saul Kere',
    stage: 'Diagnosis',
    phase: 'Phase 1',
    progress: 0,
    cost: '₹3.60 Cr',
    committed: '₹3.60 Cr',
    lat: 12.9238,
    lng: 77.6787,
    watershedId: 'saulkere_ws',
    details: 'Diagnosis stage to analyze catchment runoff and identify point sources of heavy metal pollution. Planning installation of trash racks and silt traps at key inlet channels.'
  },
  {
    id: 'kadugodi_park',
    name: 'Kadugodi Tree & Forest Parks',
    stage: 'Diagnosis',
    phase: 'Phase 1',
    progress: 5,
    cost: '₹1.40 Cr',
    committed: '₹0.00 Cr',
    lat: 12.9904,
    lng: 77.7608,
    watershedId: 'kadugodi_ws',
    details: 'Integrated nature-based solutions across Kadugodi Tree Park, Children Park, and Inner Circle Park. Implementing rain gardens, infiltration trenches, and bioswales to capture catchment runoff.'
  },
  {
    id: 'hoodi_lake',
    name: 'Hoodi Lake & KTPO Campus',
    stage: 'Diagnosis',
    phase: 'Phase 1',
    progress: 5,
    cost: '₹3.20 Cr',
    committed: '₹0.00 Cr',
    lat: 12.9938,
    lng: 77.7163,
    watershedId: 'hoodi_ws',
    details: 'Recharging solutions at Hoodi Lake and the KTPO office campus. Implements bioretention rain gardens, bioswales, detention basins, and EcoBloc underground storm water storage cells.'
  },
  {
    id: 'sheelavanthakere_lake',
    name: 'Sheelavanthakere Lake & Parks',
    stage: 'Diagnosis',
    phase: 'Phase 1',
    progress: 5,
    cost: '₹1.90 Cr',
    committed: '₹0.00 Cr',
    lat: 12.9554,
    lng: 77.7287,
    watershedId: 'sheelavanthakere_ws',
    details: 'Storm runoff absorption and buffer recovery around Sheelavanthakere Lake and Nallurhalli Park. Focuses on bund infiltration trenches, rain gardens, and perimeter bioswales.'
  }
];

const FLOOD_SPOTS_DATA = [
  { id: 'spot-1', name: 'Kadugodi Road Intersection', lat: 12.9985, lng: 77.7612, watershedId: 'kadugodi_ws', details: 'Severe flooding occurs under heavy downpours due to high surface runoff from the surrounding tree parks and paved layouts.' },
  { id: 'spot-2', name: 'Whitefield Station Approach Road', lat: 12.9950, lng: 77.7510, watershedId: 'kadugodi_ws', details: 'Water logging up to 2 feet occurs during design storms, blocking transit routes.' },
  { id: 'spot-3', name: 'Hoodi Circle Underpass', lat: 12.9912, lng: 77.7120, watershedId: 'hoodi_ws', details: 'Depressed underpass acts as a sink for runoff flowing from the industrial blocks.' },
  { id: 'spot-4', name: 'KTPO Intersection Road', lat: 12.9890, lng: 77.7280, watershedId: 'hoodi_ws', details: 'High percentage of built-up area causes instant peak discharge onto roads.' },
  { id: 'spot-5', name: 'Sheelavanthakere Low Layouts', lat: 12.9590, lng: 77.7320, watershedId: 'sheelavanthakere_ws', details: 'Backwater effect from lake overflow during intense events impacts surrounding houses.' },
  { id: 'spot-6', name: 'Nallurhalli Junction', lat: 12.9640, lng: 77.7410, watershedId: 'sheelavanthakere_ws', details: 'Encroached channels and blocked drains cause storm runoff to spill onto roads.' },
  { id: 'spot-7', name: 'Outer Ring Road (ORR) Saul Kere segment', lat: 12.9245, lng: 77.6820, watershedId: 'saulkere_ws', details: 'Low elevation segment adjacent to the lake outlet, prone to gridlock under storm events.' },
  { id: 'spot-8', name: 'Sarjapur Road - HSR link', lat: 12.9055, lng: 77.6710, watershedId: 'kasavanahalli_ws', details: 'Flooding at low points due to lack of adequate storm water disposal infrastructure.' }
];

const WATERSHEDS_POLYGONS = {
  kadugodi_ws: {
    name: 'Kadugodi Watershed (East)',
    color: '#10b981',
    coords: [
      [13.0060, 77.7450],
      [13.0080, 77.7750],
      [12.9800, 77.7780],
      [12.9820, 77.7400]
    ]
  },
  hoodi_ws: {
    name: 'Hoodi Watershed (Central-North)',
    color: '#8b5cf6',
    coords: [
      [13.0020, 77.7000],
      [13.0050, 77.7350],
      [12.9780, 77.7380],
      [12.9750, 77.7020]
    ]
  },
  sheelavanthakere_ws: {
    name: 'Sheelavanthakere Watershed (Central-South)',
    color: '#0284c7',
    coords: [
      [12.9720, 77.7200],
      [12.9750, 77.7550],
      [12.9480, 77.7580],
      [12.9450, 77.7220]
    ]
  },
  kasavanahalli_ws: {
    name: 'Kasavanahalli Lake Watershed',
    color: '#ec4899',
    coords: [
      [12.9220, 77.6550],
      [12.9250, 77.7000],
      [12.8920, 77.7050],
      [12.8900, 77.6600]
    ]
  },
  saulkere_ws: {
    name: 'Saul Kere Watershed',
    color: '#ea580c',
    coords: [
      [12.9350, 77.6650],
      [12.9380, 77.6950],
      [12.9120, 77.6980],
      [12.9100, 77.6680]
    ]
  }
};

// Utility helper to parse a CSV text string into an array of objects, handling quoted values correctly
const parseCSV = (csvText) => {
  const lines = [];
  let currentLine = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === '\n' && !insideQuotes) {
      lines.push(currentLine);
      currentLine = '';
      continue;
    }
    currentLine += char;
  }
  if (currentLine) lines.push(currentLine);

  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = [];
    let curVal = '';
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        inQ = !inQ;
      } else if (c === ',' && !inQ) {
        values.push(curVal.trim().replace(/^"|"$/g, ''));
        curVal = '';
        continue;
      }
      curVal += c;
    }
    values.push(curVal.trim().replace(/^"|"$/g, ''));

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index] : '';
    });
    result.push(row);
  }
  return result;
};

// Utility helper to parse coordinate strings (e.g. "12.95435900° N") into numbers
const parseCoordinate = (val) => {
  if (typeof val === 'number') return val;
  if (val === null || val === undefined || val === '') return null;
  const valStr = String(val).trim();
  const match = valStr.match(/([0-9.]+)\s*°?\s*([NSEWnsew]?)/);
  if (!match) {
    const parsed = parseFloat(valStr);
    return isNaN(parsed) ? null : parsed;
  }
  let num = parseFloat(match[1]);
  if (isNaN(num)) return null;
  const dir = match[2].toUpperCase();
  if (dir === 'S' || dir === 'W') {
    num = -num;
  }
  return num;
};

// Utility helper to check if a point [lat, lng] is inside a polygon ring
const pointInPolygon = (lat, lng, polygonCoords) => {
  if (!polygonCoords || polygonCoords.length === 0) return false;
  // GeoJSON coordinates are in [lng, lat] format
  const x = lng;
  const y = lat;
  let inside = false;
  for (let i = 0, j = polygonCoords.length - 1; i < polygonCoords.length; j = i++) {
    const xi = polygonCoords[i][0];
    const yi = polygonCoords[i][1];
    const xj = polygonCoords[j][0];
    const yj = polygonCoords[j][1];

    const intersect = ((yi > y) !== (yj > y))
      && (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
};

// Utility helper to check if a point [lat, lng] is inside a GeoJSON Geometry (Polygon or MultiPolygon)
const isPointInGeometry = (lat, lng, geometry) => {
  if (!geometry) return false;
  const { type, coordinates } = geometry;
  if (type === 'Polygon') {
    return pointInPolygon(lat, lng, coordinates[0]);
  } else if (type === 'MultiPolygon') {
    return coordinates.some(polygon => pointInPolygon(lat, lng, polygon[0]));
  }
  return false;
};

// Category resolution based on project tags
const getProjectCategoryInfo = (tags) => {
  const tagsStr = String(tags || '').toLowerCase();
  if (tagsStr.includes('rainwater')) {
    return {
      id: 'rainwater',
      name: 'Rainwater Harvesting',
      color: '#10b981',
      icon: '🌧️'
    };
  }
  if (tagsStr.includes('groundwater')) {
    return {
      id: 'groundwater',
      name: 'Groundwater Management',
      color: '#8b5cf6',
      icon: '💧'
    };
  }
  if (tagsStr.includes('flood')) {
    return {
      id: 'flood',
      name: 'Flood Management',
      color: '#ea580c',
      icon: '🛡️'
    };
  }
  if (tagsStr.includes('lake')) {
    return {
      id: 'lake',
      name: 'Lake Rejuvenation',
      color: '#0284c7',
      icon: '🌊'
    };
  }
  if (tagsStr.includes('iuwm')) {
    return {
      id: 'iuwm',
      name: 'Integrated Urban Water Management (IUWM)',
      color: '#ec4899',
      icon: '🔄'
    };
  }
  return {
    id: 'other',
    name: 'Other Solutions',
    color: '#64748b',
    icon: '⚙️'
  };
};

// Normalize Project Schema from both API and Fallback JSON/CSV
const normalizeProject = (p) => {
  const lat = parseCoordinate(p.latitude !== undefined ? p.latitude : p.Latitude);
  const lng = parseCoordinate(p.longitude !== undefined ? p.longitude : p.Longitude);
  const tagsVal = String(p.tags || p['Tags'] || '');
  const categoryInfo = getProjectCategoryInfo(tagsVal);

  return {
    projNo: String(p.projNo || p['Proj No'] || p.proj_no || ''),
    projName: String(p.projName || p['Proj Name'] || p.proj_name || ''),
    latitude: lat,
    longitude: lng,
    lat: lat,
    lng: lng,
    budget: String(p.budget || p['Budget'] || ''),
    timeline: String(p.timeline || p['Timeline'] || ''),
    status: String(p.status || p['Status'] || ''),
    projLead: String(p.projLead || p['Proj Lead'] || p.proj_lead || ''),
    stakeholders: String(p.stakeholders || p['Stakeholders'] || ''),
    tags: tagsVal,
    categoryInfo: categoryInfo,
    areaCatchment: String(p.areaCatchment || p['Area Catchment'] || p.area_catchment || ''),
    drainLength: String(p.drainLength || p['Drain Length'] || p.drain_length || ''),
    mediaLink: String(p.mediaLink || p['Media Link'] || p.media_link || ''),
    wardName: String(p.ward_name || p.wardName || p['Ward Name'] || ''),
    wardNameKn: String(p.ward_name_kn || ''),
    wardId: String(p.ward_id || ''),
    corporation: String(p.Corporation || p.corporation || p['Corporation'] || ''),
    ac: String(p.ac || p.Assembly || ''),
    acKn: String(p.ac_kn || ''),
    _id: p._id || null,
    _mb_row_id: p._mb_row_id || null
  };
};

// Normalize Well Schema from both API and Fallback JSON/CSV
const normalizeWell = (w) => {
  const lat = parseCoordinate(w.latitude !== undefined ? w.latitude : w.Latitude);
  const lng = parseCoordinate(w.longitude !== undefined ? w.longitude : w.Longitude);

  // Parse chemistry attributes
  const phVal = w.ph !== undefined && w.ph !== null ? parseFloat(w.ph) : (w['Ph'] !== undefined && w['Ph'] !== null && w['Ph'] !== '' ? parseFloat(w['Ph']) : null);
  const tdsVal = w.tds !== undefined && w.tds !== null ? parseFloat(w.tds) : (w['Tds'] !== undefined && w['Tds'] !== null && w['Tds'] !== '' ? parseFloat(w['Tds']) : null);
  const ecVal = w.ec !== undefined && w.ec !== null ? parseFloat(w.ec) : (w['Ec'] !== undefined && w['Ec'] !== null && w['Ec'] !== '' ? parseFloat(w['Ec']) : null);
  const salinityVal = w.salinity !== undefined && w.salinity !== null ? parseFloat(w.salinity) : (w['Salinity'] !== undefined && w['Salinity'] !== null && w['Salinity'] !== '' ? parseFloat(w['Salinity']) : null);

  return {
    wellName: String(w.wellName || w['Well Name'] || w.well_name || ''),
    latitude: lat,
    longitude: lng,
    lat: lat,
    lng: lng,
    wellType: String(w.wellType || w['Well Type'] || w.well_type || ''),
    ownerName: String(w.ownerName || w['Owner Name'] || w.owner_name || ''),
    yearDug: String(w.yearDug || w['Year Dug'] || w.year_dug || ''),
    lining: String(w.lining || w['Lining'] || ''),
    diameterFt: String(w.diameterFt || w['Diameter Ft'] || w.diameter_ft || ''),
    depthFt: String(w.depthFt || w['Depth Ft'] || w.depth_ft || ''),
    waterLevelFt: String(w.waterLevelFt || w['Water Level Ft'] || w.water_level_ft || ''),
    ph: isNaN(phVal) ? null : phVal,
    tds: isNaN(tdsVal) ? null : tdsVal,
    ec: isNaN(ecVal) ? null : ecVal,
    salinity: isNaN(salinityVal) ? null : salinityVal,
    hasFluoride: String(w.hasFluoride !== undefined ? w.hasFluoride : w['Has Fluoride'] || w.has_fluoride || ''),
    hasArsenic: String(w.hasArsenic !== undefined ? w.hasArsenic : w['Has Arsenic'] || w.has_arsenic || ''),
    wardName: String(w.ward_name || w.wardName || w['Ward Name'] || ''),
    wardNameKn: String(w.ward_name_kn || ''),
    wardId: String(w.ward_id || ''),
    corporation: String(w.Corporation || w.corporation || w['Corporation'] || ''),
    ac: String(w.ac || w.Assembly || ''),
    acKn: String(w.ac_kn || ''),
    _id: w._id || null,
    _mb_row_id: w._mb_row_id || null
  };
};

const ThreeDWalkthrough = ({ project }) => {
  const [activeAsset, setActiveAsset] = useState(null);
  const [toggledAssets, setToggledAssets] = useState({});
  const [walkStep, setWalkStep] = useState(0);
  const [isWalking, setIsWalking] = useState(false);

  const projectConfig = {
    kadugodi_park: {
      assets: [
        { id: 'bioretention', name: 'Bioretention Basins', area: 100, infiltration: 13180, storage: 29590, color: '#3b82f6', icon: '🌧️', x: 80, y: 70, z: 20 },
        { id: 'infiltration', name: 'Infiltration Drains', area: 720, infiltration: 3234096, storage: 0, color: '#8b5cf6', icon: '💧', x: 180, y: 110, z: 10 },
        { id: 'raingarden', name: 'Rain Gardens', area: 320, infiltration: 641792, storage: 153632, color: '#10b981', icon: '🌱', x: 120, y: 150, z: 15 },
        { id: 'swale', name: 'Bioswales', area: 450, infiltration: 30015, storage: 2115, color: '#eab308', icon: '🌿', x: 230, y: 90, z: 8 }
      ],
      runoffNo: 66.4,
      runoffWith: 64.5,
      reductionPct: 3.0,
      infilNo: 20.3,
      infilWith: 22.1,
      infilIncreasePct: 8.90
    },
    hoodi_lake: {
      assets: [
        { id: 'detention', name: 'Detention Silt Tanks', area: 100, infiltration: 1690, storage: 17280, color: '#3b82f6', icon: '📥', x: 70, y: 90, z: 30 },
        { id: 'infiltration', name: 'Infiltration Trench Field', area: 450, infiltration: 141255, storage: 0, color: '#8b5cf6', icon: '💧', x: 150, y: 160, z: 15 },
        { id: 'raingarden', name: 'Forebay Rain Gardens', area: 240, infiltration: 30264, storage: 33600, color: '#10b981', icon: '🌱', x: 220, y: 120, z: 15 },
        { id: 'swale', name: 'Catchment Bioswales', area: 400, infiltration: 9320, storage: 60, color: '#eab308', icon: '🌿', x: 260, y: 60, z: 10 }
      ],
      runoffNo: 51.94,
      runoffWith: 51.41,
      reductionPct: 1.0,
      infilNo: 7.88,
      infilWith: 8.41,
      infilIncreasePct: 6.73
    },
    sheelavanthakere_lake: {
      assets: [
        { id: 'bund_trench', name: 'Bund Infiltration Trench', area: 300, infiltration: 1200000, storage: 45000, color: '#3b82f6', icon: '💧', x: 100, y: 130, z: 20 },
        { id: 'park_raingarden', name: 'Park Rain Gardens', area: 180, infiltration: 450000, storage: 50000, color: '#10b981', icon: '🌱', x: 160, y: 70, z: 15 },
        { id: 'park_swale', name: 'Park Bioswales', area: 120, infiltration: 150000, storage: 0, color: '#eab308', icon: '🌿', x: 220, y: 150, z: 10 }
      ],
      runoffNo: 60.5,
      runoffWith: 59.0,
      reductionPct: 2.5,
      infilNo: 18.5,
      infilWith: 19.8,
      infilIncreasePct: 7.20
    }
  };

  const config = projectConfig[project.id];
  if (!config) return null;

  // Initialize toggles
  useEffect(() => {
    const initialToggles = {};
    config.assets.forEach(a => {
      initialToggles[a.id] = true;
    });
    setToggledAssets(initialToggles);
    setActiveAsset(config.assets[0]);
  }, [project.id]);

  const walkingPathPoints = [
    { x: 40, y: 140 },
    { x: 90, y: 100 },
    { x: 140, y: 110 },
    { x: 180, y: 140 },
    { x: 220, y: 110 },
    { x: 270, y: 130 }
  ];

  // Walking path animation loop
  useEffect(() => {
    let timer;
    if (isWalking) {
      timer = setInterval(() => {
        setWalkStep(prev => (prev + 1) % walkingPathPoints.length);
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isWalking]);

  const handleToggleAsset = (id) => {
    setToggledAssets(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const totalAssetsCount = config.assets.length;
  const activeAssetsCount = Object.values(toggledAssets).filter(Boolean).length;
  const activeFraction = totalAssetsCount > 0 ? activeAssetsCount / totalAssetsCount : 0;

  const liveInfiltration = config.assets.reduce((sum, a) => {
    return sum + (toggledAssets[a.id] ? a.infiltration : 0);
  }, 0);
  const liveStorage = config.assets.reduce((sum, a) => {
    return sum + (toggledAssets[a.id] ? a.storage : 0);
  }, 0);

  const liveRunoffReduction = (config.reductionPct * activeFraction).toFixed(2);
  const liveInfilIncrease = (config.infilIncreasePct * activeFraction).toFixed(2);

  const fmtL = (liters) => {
    if (liters >= 1e6) return (liters / 1e6).toFixed(2) + 'M L';
    if (liters >= 1e3) return (liters / 1e3).toFixed(1) + 'k L';
    return liters + ' L';
  };

  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="relative border border-slate-300 rounded-xl p-2 bg-[#f8fafc] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
        <svg viewBox="0 0 320 220" className="w-full h-[200px] bg-gradient-to-b from-[#f1f5f9] to-[#cbd5e1] rounded-lg block">
          <g stroke="#94a3b8" strokeWidth="0.5" opacity="0.3">
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1={0} y1={i * 20} x2={320} y2={i * 20 + 80} />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1={i * 30} y1={0} x2={i * 30 - 100} y2={220} />
            ))}
          </g>

          <path d="M 80 120 Q 140 90 200 110 Q 260 130 220 160 Q 120 170 80 120 Z" fill="#93c5fd" opacity="0.6" stroke="#3b82f6" strokeWidth="1.5" />

          <path
            d={`M ${walkingPathPoints.map(p => `${p.x} ${p.y}`).join(' L ')}`}
            fill="none"
            stroke="#475569"
            strokeWidth="2"
            strokeDasharray="4 4"
            opacity="0.8"
          />

          <circle
            cx={walkingPathPoints[walkStep].x}
            cy={walkingPathPoints[walkStep].y}
            r="6"
            fill="#f59e0b"
            stroke="#ffffff"
            strokeWidth="1.5"
            className="walker-pulse"
          />

          {config.assets.map(a => {
            const isEnabled = toggledAssets[a.id];
            const isActive = activeAsset && activeAsset.id === a.id;
            return (
              <g
                key={a.id}
                transform={`translate(${a.x}, ${a.y})`}
                onClick={() => setActiveAsset(a)}
                style={{ cursor: 'pointer' }}
              >
                <path
                  d={`M -8 0 L -8 -${a.z} L 8 -${a.z} L 8 0 Z`}
                  fill={isEnabled ? a.color : '#94a3b8'}
                  opacity={isActive ? 0.95 : 0.75}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <ellipse
                  cx="0"
                  cy={`-${a.z}`}
                  rx="8"
                  ry="4"
                  fill={isEnabled ? a.color : '#cbd5e1'}
                  opacity="0.9"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <ellipse
                  cx="0"
                  cy="0"
                  rx="8"
                  ry="4"
                  fill={isEnabled ? a.color : '#94a3b8'}
                  opacity="0.4"
                />
                <text x="0" y={`-${a.z + 5}`} textAnchor="middle" fontSize="10" fill="#1e293b" fontWeight="bold">
                  {a.icon}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex gap-2 mt-2">
          <button
            className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-lg cursor-pointer transition-all duration-200 ${isWalking ? 'bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-100/60' : 'bg-blue-600 text-white border border-blue-700/20 hover:bg-blue-700 shadow-sm'}`}
            onClick={() => setIsWalking(!isWalking)}
          >
            {isWalking ? '⏸️ Pause Walk' : '🚶 Start 3D Tour'}
          </button>
          <button
            className="py-1.5 px-3 text-[11px] font-bold text-slate-700 bg-transparent border border-slate-300 hover:bg-slate-100/60 rounded-lg cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => { setWalkStep(0); setIsWalking(false); }}
            disabled={!isWalking && walkStep === 0}
          >
            🔄 Reset
          </button>
        </div>
      </div>

      <div className="mt-4">
        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1.5">
              Buffer Assets
            </span>
            <div className="flex flex-col gap-1.5">
              {config.assets.map(a => (
                <label key={a.id} className="flex items-center gap-1.5 text-[11.5px] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={!!toggledAssets[a.id]}
                    onChange={() => handleToggleAsset(a.id)}
                    style={{ accentColor: a.color }}
                  />
                  <span className={`transition-all ${toggledAssets[a.id] ? 'no-underline text-slate-700' : 'line-through text-slate-400'}`}>
                    {a.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-2.5">
            {activeAsset ? (
              <>
                <strong style={{ color: activeAsset.color }} className="text-xs block">
                  {activeAsset.icon} {activeAsset.name}
                </strong>
                <span className="text-[11px] text-slate-500 block my-1">
                  Size: <strong>{activeAsset.area} sqm</strong>
                </span>
                <div className="flex flex-col gap-0.5 text-[11px] border-t border-dashed border-slate-200 pt-1.5">
                  <div>Infil: <strong>{fmtL(activeAsset.infiltration)}</strong></div>
                  <div>Storage: <strong>{fmtL(activeAsset.storage)}</strong></div>
                </div>
              </>
            ) : (
              <span className="text-[11px] text-slate-400 italic block text-center mt-2.5">
                Select an asset to view details.
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-[#0c2a2e] text-[#dfeae6] rounded-lg">
        <strong className="text-[11.5px] text-white block border-b border-[#244a4d] pb-1.5 mb-2">
          📊 Simulated Watershed Benefit Metrics
        </strong>
        <div className="grid grid-cols-2 gap-2 text-[11.5px]">
          <div>
            <span className="text-[#8fb3ad] block text-[9px] uppercase">Infiltration Gain</span>
            <strong className="text-[#5bc8b8] text-[14.5px]">{fmtL(liveInfiltration)}</strong>
          </div>
          <div>
            <span className="text-[#8fb3ad] block text-[9px] uppercase">Storage Buffer</span>
            <strong className="text-[#5bc8b8] text-[14.5px]">{fmtL(liveStorage)}</strong>
          </div>
          <div>
            <span className="text-[#8fb3ad] block text-[9px] uppercase">Runoff Reduction</span>
            <strong className="text-[#5bc8b8] text-[14.5px]">{liveRunoffReduction}%</strong>
          </div>
          <div>
            <span className="text-[#8fb3ad] block text-[9px] uppercase">Infil Increase</span>
            <strong className="text-[#5bc8b8] text-[14.5px]">{liveInfilIncrease}%</strong>
          </div>
        </div>
      </div>
    </div>
  );
};

const DataLayersView = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const navigate = useNavigate();

  const [activeDetailView, setActiveDetailView] = useState(null); // { type: 'site' | 'intervention', id: string }

  const handleBackToMap = () => {
    setActiveDetailView(null);
    setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize();
      }
    }, 100);
  };

  useEffect(() => {
    window.openSiteDetailInPlace = (siteId) => {
      setActiveDetailView({ type: 'site', id: siteId });
    };
    window.openInterventionDetailInPlace = () => {
      setActiveDetailView({ type: 'intervention', id: null });
    };
    return () => {
      delete window.openSiteDetailInPlace;
      delete window.openInterventionDetailInPlace;
    };
  }, []);

  // Datasets
  const [projects, setProjects] = useState([]);
  const [wells, setWells] = useState([]);
  const [loading, setLoading] = useState(true);

  // Live sites from /api/sites (the new SiteProject + Intervention data)
  const [sitesData, setSitesData] = useState([]);

  useEffect(() => {
    // Dynamic URL: Use Vite proxy locally, and absolute URL on AWS to prevent HTML routing errors
    const url = import.meta.env.DEV 
      ? '/api/sites' 
      : 'https://api.climatesolutions.ai/api/sites';

    fetch(url)
      .then(r => r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`))
      .then(data => {
        console.log(`%c🗺️ [SITES LAYER] Loaded ${data.length} sites from ${url}`, 'color:#3b82f6;font-weight:bold;font-size:13px;');
        console.log('All fetched sites details (full list):', data);
        setSitesData(data);
      })
      .catch(err => console.warn('Could not load sites layer data:', err));
  }, []);

  // Refs for access inside Leaflet event listeners
  const wellsRef = useRef([]);
  const projectsRef = useRef([]);

  useEffect(() => {
    wellsRef.current = wells;
  }, [wells]);

  useEffect(() => {
    projectsRef.current = projects;
  }, [projects]);

  const [dataSource, setDataSource] = useState('API'); // 'API' or 'Local Fallback'

  // Toggle checkboxes (all off by default as requested: "keep the check box off for every one by default")
  const [showWells, setShowWells] = useState(false);
  const [showProjects, setShowProjects] = useState(false);
  const [showWards, setShowWards] = useState(false);
  const [showAssemblyConst2, setShowAssemblyConst2] = useState(false);
  const [showBengaluruAssembly, setShowBengaluruAssembly] = useState(false);
  const [showKarnatakaAssembly, setShowKarnatakaAssembly] = useState(false);
  const [showGbaWards, setShowGbaWards] = useState(false);
  const [showGbaCorporations, setShowGbaCorporations] = useState(false);
  const [showValleys, setShowValleys] = useState(false);
  const [showGreenspaces, setShowGreenspaces] = useState(false);

  // New placeholder layers states
  const [showNewProjects, setShowNewProjects] = useState(false);
  const [showNewFloodRisk, setShowNewFloodRisk] = useState(false);

  // Watershed Explorer & Flood spots states & refs
  const [activeWatershedId, setActiveWatershedId] = useState(null);
  const [activeFloodSpotId, setActiveFloodSpotId] = useState(null);
  const activeWatershedLayerRef = useRef(null);
  const activeLinesLayerRef = useRef(null);

  const handleSelectFloodSpot = (spot) => {
    if (activeFloodSpotId === spot.id) {
      setActiveFloodSpotId(null);
      setActiveWatershedId(null);
    } else {
      setActiveFloodSpotId(spot.id);
      setActiveWatershedId(spot.watershedId);
      if (mapRef.current) {
        mapRef.current.flyTo([spot.lat, spot.lng], 13, {
          animate: true,
          duration: 1
        });
      }
    }
  };

  // Categories state for filtering existing interventions
  const [selectedCategories, setSelectedCategories] = useState({
    lake: true,
    flood: true,
    groundwater: true,
    rainwater: true,
    iuwm: true,
    other: true
  });

  const assemblyConst2LayerRef = useRef(null);
  const bengaluruAssemblyLayerRef = useRef(null);
  const karnatakaAssemblyLayerRef = useRef(null);
  const wardsLayerGroupRef = useRef(null);
  const gbaWardsLayerRef = useRef(null);
  const gbaCorporationsLayerRef = useRef(null);
  const valleysLayerRef = useRef(null);
  const greenspacesLayerRef = useRef(null);

  const [loadingAssemblyConst2, setLoadingAssemblyConst2] = useState(false);
  const [loadingBengaluruAssembly, setLoadingBengaluruAssembly] = useState(false);
  const [loadingKarnatakaAssembly, setLoadingKarnatakaAssembly] = useState(false);
  const [loadingGbaWards, setLoadingGbaWards] = useState(false);
  const [loadingGbaCorporations, setLoadingGbaCorporations] = useState(false);
  const [loadingValleys, setLoadingValleys] = useState(false);
  const [loadingGreenspaces, setLoadingGreenspaces] = useState(false);

  // Selected item (project or well) for full details panel
  const [selectedItem, setSelectedItem] = useState(null);

  // Search filter
  const [searchText, setSearchText] = useState('');

  // Fetch both projects and wells data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let loadedProjects = [];
      let loadedWells = [];
      let source = 'API';

      try {
        console.log('📡 Fetching projects and wells from backend API...');
        const [projectsRes, wellsRes] = await Promise.all([
          api.get('/analytics/projects'),
          api.get('/analytics/wells')
        ]);

        if (projectsRes.data && projectsRes.data.length > 0) {
          loadedProjects = projectsRes.data;
        }
        if (wellsRes.data && wellsRes.data.length > 0) {
          loadedWells = wellsRes.data;
        }

        if (loadedProjects.length === 0 && loadedWells.length === 0) {
          throw new Error('Backend returned empty datasets, falling back.');
        }
      } catch (err) {
        console.warn('⚠️ Failed to load datasets from backend API, using local fallback CSVs:', err.message);
        try {
          loadedProjects = parseCSV(v1ProjectsCsv);
          loadedWells = parseCSV(v1WellsCsv);
          source = 'Local Fallback (CSV v1)';
        } catch (csvErr) {
          console.error('Failed to parse fallback CSVs:', csvErr);
          loadedProjects = localProjects;
          loadedWells = localWells;
          source = 'Local Fallback (JSON)';
        }
      } finally {
        const parsedProjects = loadedProjects
          .map(normalizeProject)
          .filter(p => p.lat !== null && p.lng !== null && !isNaN(p.lat) && !isNaN(p.lng));

        const parsedWells = loadedWells
          .map(normalizeWell)
          .filter(w => w.lat !== null && w.lng !== null && !isNaN(w.lat) && !isNaN(w.lng));

        setProjects(parsedProjects);
        setWells(parsedWells);
        setDataSource(source);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapRef.current) return;
    const container = mapContainerRef.current;
    if (container._leaflet_id) {
      container._leaflet_id = null;
    }

    const blrCenter = [12.9716, 77.5946];
    const map = L.map(container, {
      center: blrCenter,
      zoom: 11,
      zoomControl: false
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 20
    }).addTo(map);

    const markersLayerGroup = L.layerGroup().addTo(map);
    const wardsLayerGroup = L.layerGroup().addTo(map);

    mapRef.current = map;
    markersLayerGroupRef.current = markersLayerGroup;
    wardsLayerGroupRef.current = wardsLayerGroup;

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      assemblyConst2LayerRef.current = null;
      bengaluruAssemblyLayerRef.current = null;
      karnatakaAssemblyLayerRef.current = null;
      wardsLayerGroupRef.current = null;
      gbaWardsLayerRef.current = null;
      gbaCorporationsLayerRef.current = null;
      valleysLayerRef.current = null;
      greenspacesLayerRef.current = null;
    };
  }, []);

  // Load and render boundaries layers dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const addGeoJsonLayer = (data, layerRef, color, layerType = 'assembly', weight = 2, fillOpacity = 0.05) => {
      if (layerRef.current) return;

      const layer = L.geoJSON(data, {
        style: {
          color: color,
          weight: weight,
          opacity: 0.65,
          fillColor: color,
          fillOpacity: fillOpacity
        },
        onEachFeature: (feature, leafletLayer) => {
          const props = feature.properties || {};
          let popupContent = '';

          if (layerType === 'gba_wards') {
            const wardName = props.wardName || 'Unknown Ward';
            const wardNameKn = props.wardNameKn || '';
            const wardId = props.wardId || 'N/A';
            const ac = props.ac || 'N/A';
            const corp = props.corporation || 'N/A';
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">GBA WARD BOUNDARY</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${wardName}</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🏢 Corporation: <strong>${corp}</strong></p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">🗳️ Assembly: <strong>${ac}</strong></p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">🔑 Ward ID: <strong>${wardId}</strong></p>
              </div>
            `;
          } else if (layerType === 'gba_corporations') {
            const name = props.name || 'Unknown Corporation';
            const id = props.id || 'N/A';
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">GBA CORPORATION</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name} Zone</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🔑 Zone ID: <strong>${id}</strong></p>
              </div>
            `;
          } else if (layerType === 'valleys') {
            const name = props.name || 'Unknown Valley';
            const area = props.area ? (props.area / 1000000).toFixed(2) : 'N/A';
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">VALLEY WATERSHED</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name}</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">📐 Catchment Area: <strong>${area} km²</strong></p>
              </div>
            `;
          } else if (layerType === 'greenspaces') {
            const name = props.name || 'Unnamed Greenspace';
            const nameKn = props.nameKn || '';
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">GREENSPACE / RESERVOIR</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name} ${nameKn ? `(${nameKn})` : ''}</h4>
              </div>
            `;
          } else {
            const acName = props.AC_NAME || props.ac_name || props.Name || 'Unknown Assembly';
            const acNameKn = props.AC_NAME_KN || '';
            const acCode = props.AC_CODE || props.ac_code || 'N/A';
            const district = props.KGISDistri || props.district || 'N/A';
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">ASSEMBLY BOUNDARY</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${acName}</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🔑 AC Code: <strong>${acCode}</strong></p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">📍 District Code: <strong>${district}</strong></p>
              </div>
            `;
          }

          leafletLayer.bindPopup(popupContent);

          leafletLayer.on('click', () => {
            const props = feature.properties || {};
            let regionName = props.AC_NAME || props.ac_name || props.Name || props.wardName || props.name || 'Unknown Region';

            // 1. Spatial matching using geometry
            const matchingWells = (wellsRef.current || []).filter(w => isPointInGeometry(w.lat, w.lng, feature.geometry));
            const matchingProjects = (projectsRef.current || []).filter(p => isPointInGeometry(p.lat, p.lng, feature.geometry));

            // 2. Attribute-based matching as fallback/addition
            let attrMatchingWells = [];
            let attrMatchingProjects = [];

            if (layerType === 'gba_wards') {
              const wName = (props.wardName || '').toLowerCase().trim();
              const wId = String(props.wardId || '').trim();
              attrMatchingWells = (wellsRef.current || []).filter(w =>
                (w.wardName && w.wardName.toLowerCase().trim() === wName) ||
                (w.wardId && String(w.wardId).trim() === wId)
              );
              attrMatchingProjects = (projectsRef.current || []).filter(p =>
                (p.wardName && p.wardName.toLowerCase().trim() === wName) ||
                (p.wardId && String(p.wardId).trim() === wId)
              );
            } else if (layerType === 'gba_corporations') {
              const corpName = (props.name || '').toLowerCase().trim();
              attrMatchingWells = (wellsRef.current || []).filter(w =>
                w.corporation && w.corporation.toLowerCase().trim().includes(corpName)
              );
              attrMatchingProjects = (projectsRef.current || []).filter(p =>
                p.corporation && p.corporation.toLowerCase().trim().includes(corpName)
              );
            } else if (layerType === 'assembly') {
              const acName = (props.AC_NAME || props.ac_name || props.Name || '').toLowerCase().trim();
              attrMatchingWells = (wellsRef.current || []).filter(w =>
                w.ac && w.ac.toLowerCase().trim() === acName
              );
              attrMatchingProjects = (projectsRef.current || []).filter(p =>
                p.ac && p.ac.toLowerCase().trim() === acName
              );
            }

            // Union matching lists (deduplicating by identifier)
            const getUniqueAssets = (spatialList, attrList) => {
              const map = new Map();
              spatialList.forEach(item => map.set(item._id || item._mb_row_id || item.wellName || item.projName, item));
              attrList.forEach(item => map.set(item._id || item._mb_row_id || item.wellName || item.projName, item));
              return Array.from(map.values());
            };

            const finalWells = getUniqueAssets(matchingWells, attrMatchingWells);
            const finalProjects = getUniqueAssets(matchingProjects, attrMatchingProjects);

            console.log(`%c🗺️ [REGION LAYER CLICK] - Type: ${layerType.toUpperCase()}`, 'color: #0284c7; font-weight: bold; font-size: 14px;');
            console.log('Region Name:', regionName);
            const filteredProps = { ...props };
            delete filteredProps.wardNameKn;
            delete filteredProps.acKn;
            console.log('Region Properties:', filteredProps);
            console.log(`Assets present in this region (Total: ${finalWells.length + finalProjects.length}):`);
            console.log(`- Wells (${finalWells.length}):`, finalWells);
            console.log(`- Projects (${finalProjects.length}):`, finalProjects);
          });

          leafletLayer.on('mouseover', () => {
            leafletLayer.setStyle({
              fillOpacity: fillOpacity + 0.08,
              weight: weight + 1
            });
          });

          leafletLayer.on('mouseout', () => {
            leafletLayer.setStyle({
              fillOpacity: fillOpacity,
              weight: weight
            });
          });
        }
      }).addTo(map);

      layerRef.current = layer;

      // Fit map boundaries automatically
      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, {
            padding: [40, 40],
            animate: true,
            duration: 1.2
          });
        }
      } catch (e) {
        console.warn('Could not zoom to layer bounds:', e);
      }
    };

    // Layer 1: assemblyConst2 (General Assembly Boundaries)
    if (showAssemblyConst2) {
      if (!assemblyConst2LayerRef.current) {
        setLoadingAssemblyConst2(true);
        import('../../data/assembly_const2/assembly_const2.json')
          .then((mod) => {
            addGeoJsonLayer(mod.default, assemblyConst2LayerRef, '#a855f7', 'assembly', 1.8, 0.06); // Violet
            setLoadingAssemblyConst2(false);
          })
          .catch((err) => {
            console.error('Failed to load Assembly Boundaries layer:', err);
            setLoadingAssemblyConst2(false);
          });
      }
    } else {
      if (assemblyConst2LayerRef.current) {
        map.removeLayer(assemblyConst2LayerRef.current);
        assemblyConst2LayerRef.current = null;
      }
    }

    // Layer 2: bengaluruAssembly (Bengaluru Assemblies Map)
    if (showBengaluruAssembly || showNewFloodRisk) {
      if (!bengaluruAssemblyLayerRef.current) {
        setLoadingBengaluruAssembly(true);
        import('../../data/assembly_const2/bengaluru_assembly_const.json')
          .then((mod) => {
            addGeoJsonLayer(mod.default, bengaluruAssemblyLayerRef, '#3b82f6', 'assembly', 1.8, 0.06); // Blue
            setLoadingBengaluruAssembly(false);
          })
          .catch((err) => {
            console.error('Failed to load Bengaluru Assembly Boundaries layer:', err);
            setLoadingBengaluruAssembly(false);
          });
      }
    } else {
      if (bengaluruAssemblyLayerRef.current) {
        map.removeLayer(bengaluruAssemblyLayerRef.current);
        bengaluruAssemblyLayerRef.current = null;
      }
    }

    // Layer 3: karnatakaAssembly (Karnataka Assemblies Map)
    if (showKarnatakaAssembly) {
      if (!karnatakaAssemblyLayerRef.current) {
        setLoadingKarnatakaAssembly(true);
        import('../../data/assembly_const2/karnataka_assembly_const.json')
          .then((mod) => {
            addGeoJsonLayer(mod.default, karnatakaAssemblyLayerRef, '#10b981', 'assembly', 1.2, 0.03); // Green
            setLoadingKarnatakaAssembly(false);
          })
          .catch((err) => {
            console.error('Failed to load Karnataka Assembly Boundaries layer:', err);
            setLoadingKarnatakaAssembly(false);
          });
      }
    } else {
      if (karnatakaAssemblyLayerRef.current) {
        map.removeLayer(karnatakaAssemblyLayerRef.current);
        karnatakaAssemblyLayerRef.current = null;
      }
    }

    // Layer 4: GBA Wards Boundary
    if (showGbaWards) {
      if (!gbaWardsLayerRef.current) {
        setLoadingGbaWards(true);
        import('../../data/gba_wards.json')
          .then((mod) => {
            addGeoJsonLayer(mod.default, gbaWardsLayerRef, '#f43f5e', 'gba_wards', 1.8, 0.06); // Rose
            setLoadingGbaWards(false);
          })
          .catch((err) => {
            console.error('Failed to load GBA Wards Boundaries layer:', err);
            setLoadingGbaWards(false);
          });
      }
    } else {
      if (gbaWardsLayerRef.current) {
        map.removeLayer(gbaWardsLayerRef.current);
        gbaWardsLayerRef.current = null;
      }
    }

    // Layer 5: GBA Corporations Boundary
    if (showGbaCorporations) {
      if (!gbaCorporationsLayerRef.current) {
        setLoadingGbaCorporations(true);
        import('../../data/gba_corporations.json')
          .then((mod) => {
            addGeoJsonLayer(mod.default, gbaCorporationsLayerRef, '#ec4899', 'gba_corporations', 1.8, 0.06); // Pink
            setLoadingGbaCorporations(false);
          })
          .catch((err) => {
            console.error('Failed to load GBA Corporations layer:', err);
            setLoadingGbaCorporations(false);
          });
      }
    } else {
      if (gbaCorporationsLayerRef.current) {
        map.removeLayer(gbaCorporationsLayerRef.current);
        gbaCorporationsLayerRef.current = null;
      }
    }

    // Layer 6: Valleys Boundary
    if (showValleys) {
      if (!valleysLayerRef.current) {
        setLoadingValleys(true);
        import('../../data/valleys.json')
          .then((mod) => {
            addGeoJsonLayer(mod.default, valleysLayerRef, '#06b6d4', 'valleys', 1.8, 0.06); // Cyan
            setLoadingValleys(false);
          })
          .catch((err) => {
            console.error('Failed to load Valleys layer:', err);
            setLoadingValleys(false);
          });
      }
    } else {
      if (valleysLayerRef.current) {
        map.removeLayer(valleysLayerRef.current);
        valleysLayerRef.current = null;
      }
    }

    // Layer 7: Greenspaces Boundary
    if (showGreenspaces) {
      if (!greenspacesLayerRef.current) {
        setLoadingGreenspaces(true);
        import('../../data/greenspaces.json')
          .then((mod) => {
            addGeoJsonLayer(mod.default, greenspacesLayerRef, '#22c55e', 'greenspaces', 1.2, 0.08); // Green
            setLoadingGreenspaces(false);
          })
          .catch((err) => {
            console.error('Failed to load Greenspaces layer:', err);
            setLoadingGreenspaces(false);
          });
      }
    } else {
      if (greenspacesLayerRef.current) {
        map.removeLayer(greenspacesLayerRef.current);
        greenspacesLayerRef.current = null;
      }
    }
  }, [showAssemblyConst2, showBengaluruAssembly, showKarnatakaAssembly, showGbaWards, showGbaCorporations, showValleys, showGreenspaces, showNewFloodRisk]);

  // Clear selected item if corresponding layer is unchecked
  useEffect(() => {
    if (!selectedItem) return;
    const isProj = selectedItem.projName !== undefined;
    if (isProj && !showProjects) {
      setSelectedItem(null);
    } else if (!isProj && !showWells) {
      setSelectedItem(null);
    }
  }, [showWells, showProjects]);

  // Aggregate loaded wells and projects to build a Wards summary water profile
  const getWardsSummary = () => {
    const wardMap = {};

    wells.forEach(w => {
      const name = w.wardName;
      if (!name || name.toLowerCase().includes('unknown') || name.trim() === '') return;
      if (!wardMap[name]) {
        wardMap[name] = {
          wardName: name,
          wardNameKn: w.wardNameKn || '',
          wardId: w.wardId || '',
          corporation: w.corporation || '',
          wellsCount: 0,
          projectsCount: 0,
          lats: [],
          lngs: []
        };
      }
      wardMap[name].wellsCount += 1;
      if (w.lat && w.lng) {
        wardMap[name].lats.push(w.lat);
        wardMap[name].lngs.push(w.lng);
      }
    });

    projects.forEach(p => {
      const name = p.wardName;
      if (!name || name.toLowerCase().includes('unknown') || name.trim() === '') return;
      if (!wardMap[name]) {
        wardMap[name] = {
          wardName: name,
          wardNameKn: p.wardNameKn || '',
          wardId: p.wardId || '',
          corporation: p.corporation || '',
          wellsCount: 0,
          projectsCount: 0,
          lats: [],
          lngs: []
        };
      }
      wardMap[name].projectsCount += 1;
      if (p.lat && p.lng) {
        wardMap[name].lats.push(p.lat);
        wardMap[name].lngs.push(p.lng);
      }
    });

    const summaries = [];
    Object.values(wardMap).forEach(w => {
      if (w.lats.length === 0) return;
      const avgLat = w.lats.reduce((a, b) => a + b, 0) / w.lats.length;
      const avgLng = w.lngs.reduce((a, b) => a + b, 0) / w.lngs.length;
      summaries.push({
        wardName: w.wardName,
        wardNameKn: w.wardNameKn,
        wardId: w.wardId,
        corporation: w.corporation,
        wellsCount: w.wellsCount,
        projectsCount: w.projectsCount,
        lat: avgLat,
        lng: avgLng
      });
    });

    return summaries.sort((a, b) => a.wardName.localeCompare(b.wardName));
  };

  // Render Ward Centroid Summaries on Map
  useEffect(() => {
    if (!mapRef.current || !wardsLayerGroupRef.current || loading) return;

    const map = mapRef.current;
    const wardsGroup = wardsLayerGroupRef.current;

    wardsGroup.clearLayers();

    if (!showWards) return;

    const wardsSummary = getWardsSummary();
    const boundsPoints = [];

    wardsSummary.forEach(w => {
      const { lat, lng, wardName, wardNameKn, wardId, corporation, wellsCount, projectsCount } = w;
      const totalCount = wellsCount + projectsCount;
      const radius = Math.min(22, Math.max(9, 7 + totalCount * 0.7));
      const color = '#d97706'; // Gold/Amber color

      const marker = L.circleMarker([lat, lng], {
        radius: radius,
        fillColor: color,
        color: '#ffffff',
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.8
      });

      marker.bindPopup(`
        <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif; width: 220px;">
          <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}15; color: ${color};">WARD WATER PROFILE</span>
          <h4 style="margin: 4px 0 0 0; font-size: 13px; font-weight: 750; color: #0f172a;">${wardName}</h4>
          ${wardNameKn ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${wardNameKn}</p>` : ''}
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">🔑 Ward ID: <strong>${wardId || 'N/A'}</strong></p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">🏢 Corp: <strong>${corporation || 'N/A'}</strong></p>
          <div style="margin-top: 8px; border-top: 1px dashed #e2e8f0; padding-top: 6px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
            <div style="text-align: center;">
              <span style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Wells</span>
              <div style="font-size: 14px; font-weight: 800; color: #a855f7;">${wellsCount}</div>
            </div>
            <div style="text-align: center;">
              <span style="font-size: 9px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Projects</span>
              <div style="font-size: 14px; font-weight: 800; color: #3b82f6;">${projectsCount}</div>
            </div>
          </div>
          <span style="text-align: center; margin-top: 6px; border-top: 1px dashed #e2e8f0; padding-top: 4px; font-size: 9.5px; color: #94a3b8; display: block; font-weight: 600;">Total Ward Assets: <strong>${totalCount}</strong></span>
        </div>
      `);

      marker.on('click', () => {
        const matchingWells = (wellsRef.current || []).filter(well => well.wardName === wardName);
        const matchingProjects = (projectsRef.current || []).filter(p => p.wardName === wardName);

        console.log(`%c🟡 [WARD SUMMARY CLICK] - Ward: ${wardName}`, 'color: #d97706; font-weight: bold; font-size: 14px;');
        console.log('Ward Info:', { wardName, wardNameKn, wardId, corporation });
        console.log(`Assets in this Ward (Total: ${matchingWells.length + matchingProjects.length}):`);
        console.log(`- Wells (${matchingWells.length}):`, matchingWells);
        console.log(`- Projects (${matchingProjects.length}):`, matchingProjects);
      });

      marker.addTo(wardsGroup);
      boundsPoints.push([lat, lng]);
    });
    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.flyToBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13,
        animate: true,
        duration: 1.2
      });
    }
  }, [showWards, wells, projects, loading]);

  // Color mappings - matching the layer checkboxes exactly for differentiation
  const getProjectColor = (status, tags) => {
    if (tags) {
      return getProjectCategoryInfo(tags).color;
    }
    return '#3b82f6'; // Premium blue color matching projects checkbox
  };

  const getWellColor = (wellType) => {
    return '#a855f7'; // Violet/purple color matching wells checkbox
  };

  // Filter Items - Merging Wells and Projects cleanly based on checked states
  const getFilteredItems = () => {
    let items = [];
    const search = searchText.toLowerCase();

    if (showWells) {
      const filteredWells = wells.filter((w) => {
        const matchesSearch = w.wellName.toLowerCase().includes(search) ||
          w.wardName.toLowerCase().includes(search) ||
          w.wellType.toLowerCase().includes(search);

        if (activeWatershedId) {
          const wsCoords = WATERSHEDS_POLYGONS[activeWatershedId].coords;
          return matchesSearch && pointInPolygon(w.lat, w.lng, wsCoords);
        }
        return matchesSearch;
      });
      items = [...items, ...filteredWells];
    }

    if (showProjects) {
      const filteredProjects = projects.filter((p) => {
        const matchesSearch =
          p.projName.toLowerCase().includes(search) ||
          p.wardName.toLowerCase().includes(search) ||
          p.tags.toLowerCase().includes(search);

        const categoryId = p.categoryInfo?.id || 'other';
        const matchesCategory = selectedCategories[categoryId] === true;

        if (activeWatershedId) {
          const hasMatchingId = p.watershedId === activeWatershedId;
          const wsCoords = WATERSHEDS_POLYGONS[activeWatershedId].coords;
          const isInsidePolygon = pointInPolygon(p.lat, p.lng, wsCoords);
          return matchesSearch && matchesCategory && (hasMatchingId || isInsidePolygon);
        }

        return matchesSearch && matchesCategory;
      });
      items = [...items, ...filteredProjects];
    }

    // Sort items alphabetically by name
    return items.sort((a, b) => {
      const nameA = a.projName !== undefined ? a.projName : a.wellName;
      const nameB = b.projName !== undefined ? b.projName : b.wellName;
      return nameA.localeCompare(nameB);
    });
  };

  const filteredItems = getFilteredItems();

  // Render Watershed Boundary and connection lines
  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;

    if (activeWatershedLayerRef.current) {
      map.removeLayer(activeWatershedLayerRef.current);
      activeWatershedLayerRef.current = null;
    }
    if (activeLinesLayerRef.current) {
      map.removeLayer(activeLinesLayerRef.current);
      activeLinesLayerRef.current = null;
    }

    if (activeWatershedId) {
      const wsInfo = WATERSHEDS_POLYGONS[activeWatershedId];
      if (wsInfo && wsInfo.coords) {
        const polygon = L.polygon(wsInfo.coords, {
          color: wsInfo.color,
          weight: 2.5,
          fillColor: wsInfo.color,
          fillOpacity: 0.15,
          dashArray: '5, 5'
        }).addTo(map);

        activeWatershedLayerRef.current = polygon;
        map.fitBounds(polygon.getBounds(), { padding: [40, 40] });

        const linesGroup = L.layerGroup().addTo(map);
        const spot = FLOOD_SPOTS_DATA.find(s => s.id === activeFloodSpotId);
        if (spot) {
          const matchingProjects = NEW_PROJECTS_DATA.filter(p => p.watershedId === activeWatershedId);
          matchingProjects.forEach(proj => {
            L.polyline([[spot.lat, spot.lng], [proj.lat, proj.lng]], {
              color: '#ef4444',
              weight: 1.5,
              opacity: 0.6,
              dashArray: '4, 4'
            }).addTo(linesGroup);
          });
        }
        activeLinesLayerRef.current = linesGroup;
      }
    }
  }, [activeWatershedId, activeFloodSpotId]);

  // Render Markers on Map when toggles, search filters, or datasets change
  useEffect(() => {
    if (!mapRef.current || !markersLayerGroupRef.current || loading) return;

    const map = mapRef.current;
    const markersGroup = markersLayerGroupRef.current;

    // Clear existing layers
    markersGroup.clearLayers();

    if (!showWells && !showProjects && !showNewProjects) return;

    const boundsPoints = [];

    filteredItems.forEach((item) => {
      const { lat, lng } = item;
      if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;

      const isProj = item.projName !== undefined;
      const name = isProj ? item.projName : item.wellName;
      const type = isProj ? item.status : item.wellType;
      const badgeLabel = isProj ? 'PROJECT' : 'WELL';
      const color = isProj ? getProjectColor(item.status, item.tags) : getWellColor(item.wellType);

      let marker;
      if (isProj) {
        const pinIcon = L.divIcon({
          className: 'custom-leaflet-pin-container',
          html: `
            <div class="pin-marker-wrapper animate-bounce-in">
              <svg class="pin-svg" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.16 0 0 7.16 0 16C0 26.6 14.8 41.1 15.4 41.7C15.7 42 16.3 42 16.6 41.7C17.2 41.1 32 26.6 32 16C32 7.16 24.8 0 16 0Z" fill="${color}"/>
                <circle cx="16" cy="16" r="10" fill="#ffffff" />
                <text x="16" y="16" fill="#0f172a" font-size="12px" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" text-anchor="middle" dominant-baseline="central">${item.categoryInfo?.icon || '🌱'}</text>
              </svg>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -42]
        });
        marker = L.marker([lat, lng], { icon: pinIcon });
      } else {
        marker = L.circleMarker([lat, lng], {
          radius: 7,
          fillColor: color,
          color: '#ffffff',
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85
        });
      }

      marker.bindPopup(`
        <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
          <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">${badgeLabel}: ${String(type || 'UNSPECIFIED').toUpperCase()}</span>
          <h4 style="font-size: 13.5px; font-weight: 750; color: #0f172a; margin: 0 0 4px 0;">${name}</h4>
          <p style="font-size: 11px; color: #64748b; margin: 0;">📍 ${item.wardName || 'Unknown Ward'}</p>
          ${isProj ? `<p style="margin: 4px 0 8px 0; font-size: 11px; color: #475569;">🏷️ Category: <strong style="color: ${color};">${item.categoryInfo?.name}</strong></p>` : ''}
          ${isProj ? `
            <button onclick="window.openInterventionDetailInPlace && window.openInterventionDetailInPlace()" style="display: block; width: 100%; margin-top: 10px; border: none; background-color: ${color}; color: white !important; text-align: center; padding: 8px; border-radius: 6px; font-size: 11.5px; font-weight: 750; cursor: pointer; box-shadow: 0 2px 4px ${color}20;">
              View Details →
            </button>
          ` : ''}
          <span style="font-size: 9.5px; color: #94a3b8; display: block; margin-top: 8px; font-weight: 600;">Click point for full details</span>
        </div>
      `);

      marker.on('click', () => {
        setSelectedItem(item);
        map.setView([lat, lng], 14);

        console.log(`%c📍 [ASSET CLICK] - Type: ${badgeLabel}`, `color: ${color}; font-weight: bold; font-size: 14px;`);
        console.log('Asset Details:', item);
      });

      marker.addTo(markersGroup);
      boundsPoints.push([lat, lng]);
    });

    if (showNewProjects) {
      // ── Use live data from /api/sites ─────────────────────────────────────
      console.log('🔄 Toggled Projects layer ON. Rendering all sites:', sitesData);
      const liveProjects = sitesData.filter(site =>
        site.latitude != null && site.longitude != null
      );

      const visibleSites = activeWatershedId
        ? liveProjects.filter(site => {
            const wsCoords = WATERSHEDS_POLYGONS[activeWatershedId]?.coords;
            return wsCoords ? pointInPolygon(site.latitude, site.longitude, wsCoords) : true;
          })
        : liveProjects;

      const SITE_COLOR = { lake: '#3b82f6', park: '#22c55e', stormdrain: '#94a3b8', campus: '#f59e0b' };
      const SITE_ICON  = { lake: '🔵', park: '🟢', stormdrain: '⚫', campus: '🏢' };

      visibleSites.forEach((site) => {
        const lat = site.latitude;
        const lng = site.longitude;
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

        const color     = SITE_COLOR[site.type] || '#3b82f6';
        const typeIcon  = SITE_ICON[site.type]  || '📍';
        const ivCount   = (site.interventions || []).length;
        const ivList    = (site.interventions || [])
          .map(iv => `<li style="margin:2px 0">${iv.type.replace(/_/g,' ')}${iv.quantity ? ` ×${iv.quantity}` : ''}</li>`)
          .join('');

        const marker = L.circleMarker([lat, lng], {
          radius: 9,
          fillColor: color,
          color: '#ffffff',
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.92
        });

        const viewMoreBtn = `<button onclick="window.openSiteDetailInPlace && window.openSiteDetailInPlace('${site.site_id}')" style="display:block;width:100%;margin-top:8px;border:none;background-color:${color};color:white!important;text-align:center;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:750;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.1);">View Details →</button>`;

        marker.bindPopup(`
          <div style="display:flex;flex-direction:column;text-align:left;padding:4px;font-family:system-ui,-apple-system,sans-serif;min-width:180px">
            <span style="font-size:8.5px;font-weight:800;letter-spacing:0.5px;padding:3px 6px;border-radius:4px;align-self:flex-start;margin-bottom:6px;text-transform:uppercase;background-color:${color}20;color:${color}">${typeIcon} ${(site.type || 'SITE').toUpperCase()}</span>
            <h4 style="font-size:13.5px;font-weight:750;color:#0f172a;margin:0 0 4px 0">${site.name}</h4>
            ${site.watershed ? `<p style="font-size:11px;color:#64748b;margin:0 0 4px 0">🌊 ${site.watershed}</p>` : ''}
            <p style="font-size:11px;color:#475569;margin:0 0 6px 0">🔧 <strong>${ivCount}</strong> intervention${ivCount !== 1 ? 's' : ''}</p>
            ${viewMoreBtn}
          </div>
        `);

        marker.on('click', () => {
          setSelectedItem({
            projName:    site.name,
            status:      site.type,
            lat,
            lng,
            wardName:    '',
            tags:        site.type === 'lake' ? 'lake' : site.type === 'park' ? 'rainwater' : 'flood',
            categoryInfo: {
              id:    site.type,
              name:  site.name,
              color: color,
              icon:  typeIcon
            },
            _raw: site
          });
          map.setView([lat, lng], 14);

          // ── Console output when a project marker is clicked ─────────────
          console.group(
            `%c📍 [PROJECT MARKER CLICK] ${site.name}`,
            `color:${color};font-weight:bold;font-size:14px;`
          );
          console.log('Site ID:     ', site.site_id);
          console.log('Type:        ', site.type);
          console.log('Watershed:   ', site.watershed || '—');
          console.log('Coordinates: ', `${lat}, ${lng}`);
          console.log('Interventions count:', ivCount);
          if (site.interventions?.length) {
            console.table(
              site.interventions.map(iv => ({
                type:     iv.type,
                quantity: iv.quantity ?? '—',
                length:   iv.details?.length_m ?? '—',
                width:    iv.details?.width_m  ?? '—',
                depth:    iv.details?.depth_m  ?? '—',
                area:     iv.details?.area     ?? '—',
              }))
            );
          }
          if (site.site_level_impact)      console.log('Site impact:         ', site.site_level_impact);
          if (site.subcatchment_level_impact) console.log('Subcatchment impact: ', site.subcatchment_level_impact);
          console.log('Full site object:', site);
          console.groupEnd();
        });

        marker.addTo(markersGroup);
        boundsPoints.push([lat, lng]);
      });
    }

    // Render Flood Hotspots
    if (showNewFloodRisk) {
      FLOOD_SPOTS_DATA.forEach((spot) => {
        const { lat, lng } = spot;
        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;

        const warningIcon = L.divIcon({
          className: 'custom-leaflet-flood-container',
          html: `
            <div class="flood-spot-marker animate-pulse-fast" style="background-color: #ef4444; border: 2px solid white; border-radius: 50%; width: 24px; height: 24px; display: grid; place-items: center; box-shadow: 0 0 10px rgba(239, 68, 68, 0.6); cursor: pointer;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              </svg>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12]
        });

        const fsMarker = L.marker([lat, lng], { icon: warningIcon });
        const wsInfo = WATERSHEDS_POLYGONS[spot.watershedId];

        fsMarker.bindPopup(`
          <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif; width: 210px;">
            <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: #ffeeeb; color: #ef4444; font-weight: 850;">⚠️ FLOOD HOTSPOT</span>
            <h4 style="margin: 4px 0 2px 0; font-size: 13px; font-weight: 700; color: #1e293b;">${spot.name}</h4>
            <p style="font-size: 11px; margin: 0 0 6px 0; color: #64748b;">🌊 Watershed: <strong>${wsInfo ? wsInfo.name : 'Unknown'}</strong></p>
            <p style="font-size: 11.5px; color: #475569; margin: 0; line-height: 1.35;">${spot.details}</p>
            <button class="popup-filter-ws-btn" style="display: block; width: 100%; margin-top: 8px; border: none; background-color: #ef4444; color: white !important; text-align: center; padding: 6px; border-radius: 6px; font-size: 11px; font-weight: 750; cursor: pointer; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">Trace Watershed</button>
          </div>
        `, { closeButton: false });

        fsMarker.on('popupopen', () => {
          const btn = document.querySelector('.popup-filter-ws-btn');
          if (btn) {
            btn.onclick = () => {
              handleSelectFloodSpot(spot);
              fsMarker.closePopup();
            };
          }
        });

        fsMarker.addTo(markersGroup);
        boundsPoints.push([lat, lng]);
      });
    }

    // Zoom automatically to active bounds containing visible points
    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.flyToBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13,
        animate: true,
        duration: 1.2
      });
    }
  }, [showWells, showProjects, showNewProjects, wells, projects, searchText, loading, selectedCategories, sitesData]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);

    const isProj = item.projName !== undefined;
    const badgeLabel = isProj ? 'PROJECT' : 'WELL';
    const color = isProj ? getProjectColor(item.status, item.tags) : getWellColor(item.wellType);
    console.log(`%c📍 [LIST ITEM SELECT] - Type: ${badgeLabel}`, `color: ${color}; font-weight: bold; font-size: 14px;`);
    console.log('Asset Details:', item);

    if (mapRef.current) {
      mapRef.current.flyTo([item.lat, item.lng], 14, {
        animate: true,
        duration: 1
      });

      markersLayerGroupRef.current.eachLayer((layer) => {
        const latLng = layer.getLatLng();
        if (latLng.lat === item.lat && latLng.lng === item.lng) {
          layer.openPopup();
        }
      });
    }
  };

  const isItemSelected = (item) => {
    if (!selectedItem) return false;

    // Check if same class (Project vs Well)
    const isProj = item.projName !== undefined;
    const isSelectedProj = selectedItem.projName !== undefined;
    if (isProj !== isSelectedProj) return false;

    if (item._id && selectedItem._id) {
      return item._id === selectedItem._id;
    }

    const itemId = item._mb_row_id || item._id;
    const selectedId = selectedItem._mb_row_id || selectedItem._id;
    return itemId && selectedId && itemId === selectedId;
  };

  const getCategoryCounts = () => {
    const counts = { lake: 0, flood: 0, groundwater: 0, rainwater: 0, iuwm: 0, other: 0 };
    projects.forEach((p) => {
      const catId = p.categoryInfo?.id || 'other';
      if (counts[catId] !== undefined) {
        counts[catId]++;
      }
    });
    return counts;
  };
  const categoryCounts = getCategoryCounts();

  return (
    <div className="max-w-[1400px] mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 text-left relative">
      {activeDetailView && (
        <div className="w-full text-left animate-[fadeIn_0.2s_ease-out_forwards]">
          <button
            onClick={handleBackToMap}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer mb-4"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Map</span>
          </button>
          {activeDetailView.type === 'site' ? (
            <NewProjectsView initialProjectId={activeDetailView.id} />
          ) : (
            <Interventions />
          )}
        </div>
      )}

      <div className={activeDetailView ? 'hidden' : 'flex flex-col gap-6 w-full animate-[fadeIn_0.4s_ease-out_forwards]'}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounceIn {
          0% { opacity: 0; transform: scale(0.3) translateY(-100%); }
          50% { opacity: 0.8; transform: scale(1.1) translateY(10%); }
          80% { transform: scale(0.95) translateY(-5%); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes pulseFast {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
          70% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        @keyframes walkerPulse {
          0% { r: 5px; opacity: 1; }
          50% { r: 9px; opacity: 0.5; }
          100% { r: 5px; opacity: 1; }
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #94a3b8;
        }
      ` }} />

      <div>
        <p className="font-bold text-xl">Interactive Spatial Explorer</p>
      </div>

      <div className="h-[650px] bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm overflow-y-auto">
        <Analytics />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-6 xl:h-[950px] items-stretch">
        {/* Left Sidebar Control Panel */}
        <div className="bg-white border border-slate-200 rounded-[20px] p-6 flex flex-col gap-6 shadow-sm h-[600px] xl:h-full overflow-hidden">
          {/* Map Layer Checkboxes */}
          <div className="flex flex-col gap-4">
            <h5 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Map Layers ({wells.length + projects.length} items total)</h5>
            <div className="flex flex-col gap-3">
              <label className="flex items-start gap-3 text-[13.5px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showWells}
                  onChange={(e) => setShowWells(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 mt-0.5"
                />
                <span>Wells ({showWells ? `${filteredItems.filter(i => i.projName === undefined).length} active` : `${wells.length} total`})</span>
              </label>

              <label className="flex items-start gap-3 text-[13.5px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showProjects}
                  onChange={(e) => setShowProjects(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 mt-0.5"
                />
                <span>Existing Interventions ({showProjects ? `${filteredItems.filter(i => i.projName !== undefined).length} active` : `${projects.length} total`})</span>
              </label>

              {showProjects && (
                <div className="flex flex-col gap-2 pl-7 mt-1 mb-1 animate-[slideDown_0.25s_cubic-bezier(0.16,1,0.3,1)_forwards]">
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer select-none relative text-left transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={selectedCategories.lake}
                      onChange={(e) => setSelectedCategories({ ...selectedCategories, lake: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-sky-500 accent-[#0284c7]"
                    />
                    <span className="whitespace-nowrap">🌊 Lakes ({categoryCounts.lake})</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer select-none relative text-left transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={selectedCategories.flood}
                      onChange={(e) => setSelectedCategories({ ...selectedCategories, flood: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-orange-500 accent-[#ea580c]"
                    />
                    <span className="whitespace-nowrap">🛡️ Flood ({categoryCounts.flood})</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer select-none relative text-left transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={selectedCategories.groundwater}
                      onChange={(e) => setSelectedCategories({ ...selectedCategories, groundwater: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-purple-500 accent-[#8b5cf6]"
                    />
                    <span className="whitespace-nowrap">💧 Groundwater ({categoryCounts.groundwater})</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer select-none relative text-left transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={selectedCategories.rainwater}
                      onChange={(e) => setSelectedCategories({ ...selectedCategories, rainwater: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-emerald-500 accent-[#10b981]"
                    />
                    <span className="whitespace-nowrap">🌧️ Rainwater ({categoryCounts.rainwater})</span>
                  </label>
                  <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer select-none relative text-left transition-colors duration-200">
                    <input
                      type="checkbox"
                      checked={selectedCategories.iuwm}
                      onChange={(e) => setSelectedCategories({ ...selectedCategories, iuwm: e.target.checked })}
                      className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-pink-500 accent-[#ec4899]"
                    />
                    <span className="whitespace-nowrap">🔄 IUWM ({categoryCounts.iuwm})</span>
                  </label>
                  {categoryCounts.other > 0 && (
                    <label className="flex items-center gap-2.5 text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer select-none relative text-left transition-colors duration-200">
                      <input
                        type="checkbox"
                        checked={selectedCategories.other}
                        onChange={(e) => setSelectedCategories({ ...selectedCategories, other: e.target.checked })}
                        className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-slate-500 accent-[#64748b]"
                      />
                      <span className="whitespace-nowrap">⚙️ Other ({categoryCounts.other})</span>
                    </label>
                  )}
                </div>
              )}

              <label className="flex items-start gap-3 text-[13.5px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showWards}
                  onChange={(e) => setShowWards(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 accent-[#d97706] mt-0.5"
                />
                <span>Wards Summary ({Object.keys(wells.concat(projects).reduce((acc, item) => {
                  if (item.wardName && !item.wardName.toLowerCase().includes('unknown') && item.wardName.trim() !== '') {
                    acc[item.wardName] = true;
                  }
                  return acc;
                }, {})).length} Wards)</span>
              </label>

              <label className="flex items-start gap-3 text-[13.5px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showBengaluruAssembly}
                  onChange={(e) => setShowBengaluruAssembly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-[#3b82f6] mt-0.5"
                />
                <span>Bengaluru Assemblies {loadingBengaluruAssembly && <span className="small-inline-spinner"></span>}</span>
              </label>

              <label className="flex items-start gap-3 text-[13.5px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showKarnatakaAssembly}
                  onChange={(e) => setShowKarnatakaAssembly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-[#10b981] mt-0.5"
                />
                <span>Karnataka Assemblies {loadingKarnatakaAssembly && <span className="small-inline-spinner"></span>}</span>
              </label>

              <label className="flex items-start gap-3 text-[13.5px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showGbaWards}
                  onChange={(e) => setShowGbaWards(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 accent-[#f43f5e] mt-0.5"
                />
                <span>GBA Wards {loadingGbaWards && <span className="small-inline-spinner"></span>}</span>
              </label>

              <label className="flex items-start gap-3 text-[13.5px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showGbaCorporations}
                  onChange={(e) => setShowGbaCorporations(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500 accent-[#ec4899] mt-0.5"
                />
                <span>GBA Corporations {loadingGbaCorporations && <span className="small-inline-spinner"></span>}</span>
              </label>

              <label className="flex items-start gap-3 text-[13.5px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showValleys}
                  onChange={(e) => setShowValleys(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 accent-[#06b6d4] mt-0.5"
                />
                <span>Valleys {loadingValleys && <span className="small-inline-spinner"></span>}</span>
              </label>

              <label className="flex items-start gap-3 text-[13.5px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showGreenspaces}
                  onChange={(e) => setShowGreenspaces(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500 accent-[#22c55e] mt-0.5"
                />
                <span>Greenspaces {loadingGreenspaces && <span className="small-inline-spinner"></span>}</span>
              </label>

              <label className="flex items-start gap-3 text-[13.5px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showNewProjects}
                  onChange={(e) => setShowNewProjects(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-[#3b82f6] mt-0.5"
                />
                <span>Projects</span>
              </label>

              <label className="flex items-start gap-3 text-[13.5px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showNewFloodRisk}
                  onChange={(e) => setShowNewFloodRisk(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 accent-[#ef4444] mt-0.5"
                />
                <span>Flood Risk {loadingBengaluruAssembly && showNewFloodRisk && <span className="small-inline-spinner"></span>}</span>
              </label>
            </div>

            {activeWatershedId && (
              <div className="flex justify-between items-center bg-blue-50 border border-blue-200 rounded-lg p-2.5 mt-3">
                <div className="text-[11.5px] text-blue-900 text-left">
                  Watershed Active: <strong className="block text-xs">{WATERSHEDS_POLYGONS[activeWatershedId].name}</strong>
                </div>
                <button onClick={() => { setActiveWatershedId(null); setActiveFloodSpotId(null); }} className="border-none bg-none text-blue-600 hover:text-blue-700 font-bold text-[11px] cursor-pointer p-1">Clear</button>
              </div>
            )}
          </div>

          {/* Search and List Panel */}
          <div className="flex-grow flex flex-col gap-4 overflow-hidden">
            <div className="relative w-full" style={{ marginBottom: (showWells || showProjects) ? '4px' : '0px' }}>
              <svg
                className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-[2]"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#64748b"
                strokeWidth="2.5"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
              <input
                type="text"
                placeholder="Search wells or projects..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                disabled={!showWells && !showProjects}
                className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/12 text-slate-900 bg-white transition-all shadow-sm"
              />
              {searchText && (
                <button onClick={() => setSearchText('')} className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-lg text-slate-400 hover:text-slate-600 cursor-pointer">×</button>
              )}
            </div>

            {(showWells || showProjects) && (
              <div style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '8px', paddingLeft: '4px' }}>
                Showing {filteredItems.length} of {wells.length + projects.length} items (scroll down to view all)
              </div>
            )}

            <div className="flex-1 overflow-y-auto flex flex-col gap-2 custom-scrollbar pr-1">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-10 gap-3 text-slate-500 text-xs">
                  <div className="w-6 h-6 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                  <span>Loading GIS assets...</span>
                </div>
              ) : (!showWells && !showProjects) ? (
                <div className="text-center py-10 px-2.5 text-slate-400 text-xs font-semibold">
                  Check the <strong>Wells</strong> or <strong>Existing Interventions</strong> layer above to display spatial data.
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-10 px-2.5 text-slate-400 text-xs font-semibold">No matching assets found.</div>
              ) : (
                filteredItems.map((item, index) => {
                  const isProj = item.projName !== undefined;
                  const name = isProj ? item.projName : item.wellName;
                  const desc = isProj ? item.status : item.wellType;
                  const color = isProj ? getProjectColor(item.status, item.tags) : getWellColor(item.wellType);

                  return (
                    <div
                      key={item._id || item._mb_row_id || index}
                      className={`flex items-center gap-3 p-3 bg-slate-50 hover:bg-slate-100/80 border rounded-xl cursor-pointer transition-all duration-200 text-left ${isItemSelected(item) ? 'bg-indigo-500/5 border-indigo-500' : 'border-slate-100 hover:border-slate-300'}`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                      <div className="flex flex-col gap-0.5 overflow-hidden w-full">
                        <strong className="text-xs font-bold text-slate-800 truncate block">{name}</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="text-[11px] text-slate-500 truncate block">{desc || 'Open Well'} — {item.wardName || 'Unknown Ward'}</span>
                          {isProj && item.categoryInfo && (
                            <span style={{
                              display: 'inline-block',
                              fontSize: '9.5px',
                              fontWeight: '750',
                              color: color,
                              backgroundColor: color + '12',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              alignSelf: 'flex-start',
                              marginTop: '2px',
                              letterSpacing: '0.2px'
                            }}>
                              {item.categoryInfo.icon} {item.categoryInfo.name}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Center / Right Section: Map & Details Pane */}
        <div className="flex flex-col gap-6 h-auto xl:h-full">
          {/* Main Leaflet Map */}
          <div className="h-[400px] sm:h-[500px] xl:h-[550px] shrink-0 bg-white border border-slate-200 rounded-[20px] flex flex-col overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-white">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">🗺️ Bengaluru Map View — Groundwater & Watershed Explorer</h4>
              <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                {(showWells || showProjects)
                  ? `Showing ${filteredItems.length} of ${wells.length + projects.length} items`
                  : `0 of ${wells.length + projects.length} items visible`}
              </span>
            </div>
            <div className="leaflet-map-wrapper-inner" style={{ position: 'relative', width: '100%', height: 'calc(100% - 48px)' }}>
              <div ref={mapContainerRef} className="leaflet-map-canvas" style={{ width: '100%', height: '100%' }}></div>
            </div>
          </div>

          {/* Details Sidebar Pane */}
          <div className="min-h-[280px] xl:flex-1 xl:h-0 overflow-y-auto bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm custom-scrollbar">
            {selectedItem ? (
              <div className="flex flex-col gap-5">
                {selectedItem.projName !== undefined ? (
                  <>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2 text-left">
                      {selectedItem.categoryInfo ? (
                        <span className="text-[9px] font-extrabold tracking-wider px-2 py-1 rounded-md bg-blue-500/10 text-blue-500" style={{ backgroundColor: selectedItem.categoryInfo.color + '15', color: selectedItem.categoryInfo.color }}>
                          {selectedItem.categoryInfo.name.toUpperCase()}
                        </span>
                      ) : (
                        <span className="text-[9px] font-extrabold tracking-wider px-2 py-1 rounded-md bg-blue-500/10 text-blue-500">PROJECT</span>
                      )}
                      <h3 className="text-base font-bold text-slate-800 m-0 grow min-w-[200px] text-left">{selectedItem.projName}</h3>
                      <div
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${selectedItem.status?.toLowerCase().includes('completed') ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' : 'bg-indigo-500/10 border-indigo-500/20 text-indigo-600'}`}
                      >
                        {selectedItem.status || 'Active'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-5 text-left">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Project Lead</span>
                          <strong className="text-xs font-bold text-slate-700">{selectedItem.projLead || 'Not specified'}</strong>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Budget</span>
                          <strong className="text-xs font-bold text-slate-700">{selectedItem.budget || 'Not specified'}</strong>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Timeline</span>
                          <strong className="text-xs font-bold text-slate-700">{selectedItem.timeline || 'Not specified'}</strong>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Area / Catchment</span>
                          <strong className="text-xs font-bold text-slate-700">{selectedItem.areaCatchment || 'Not specified'}</strong>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Drain Length</span>
                          <strong className="text-xs font-bold text-slate-700">{selectedItem.drainLength || 'Not specified'}</strong>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Tags</span>
                          <div className="flex flex-wrap gap-1.5">
                            {(selectedItem.tags || 'Rejuvenation').split(',').map((t, idx) => (
                              <span key={idx} className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">{t.trim()}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-slate-200 pt-4">
                        <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2.5">📍 Geographic Telemetry</h5>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">Ward Name</span>
                            <strong className="text-xs text-slate-700 font-bold">{selectedItem.wardName || 'Unknown Ward'} {selectedItem.wardNameKn ? `(${selectedItem.wardNameKn})` : ''}</strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">Corporation</span>
                            <strong className="text-xs text-slate-700 font-bold">{selectedItem.corporation || 'Unknown Corporation'}</strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">Coordinates</span>
                            <code className="font-mono text-[11px] text-slate-700 bg-white border border-slate-300 px-2 py-1 rounded w-fit inline-block">{selectedItem.lat.toFixed(6)}° N, {selectedItem.lng.toFixed(6)}° E</code>
                          </div>
                          {selectedItem.wardId && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">Ward ID</span>
                              <strong className="text-xs text-slate-700 font-bold">{selectedItem.wardId}</strong>
                            </div>
                          )}
                          {selectedItem.ac && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">Assembly Constituency</span>
                              <strong className="text-xs text-slate-700 font-bold">{selectedItem.ac} {selectedItem.acKn ? `(${selectedItem.acKn})` : ''}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedItem.mediaLink && selectedItem.mediaLink.trim() !== '' && (
                        <a
                          href={selectedItem.mediaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center bg-slate-50 border border-slate-300 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 hover:-translate-y-0.5 transition-all duration-200 self-start no-underline"
                        >
                          Read Case Report / Media Coverage
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '6px' }}>
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}

                      {/* 3D Walkthrough Simulator Section */}
                      {['kadugodi_park', 'hoodi_lake', 'sheelavanthakere_lake'].includes(selectedItem.id) && (
                        <div className="mt-5 border-t border-dashed border-slate-200 pt-4 text-left">
                          <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">🎮 Interactive 3D Walkthrough Simulator</h5>
                          <p style={{ fontSize: '11.5px', color: '#64748b', marginBottom: '12px', margin: '0 0 12px 0' }}>
                            Simulate stormwater storage & infiltration by toggling individual watershed assets.
                          </p>
                          <ThreeDWalkthrough project={selectedItem} />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2 text-left">
                      <span className="text-[9px] font-extrabold tracking-wider px-2 py-1 rounded-md bg-purple-500/10 text-purple-500">GROUND WELL</span>
                      <h3 className="text-base font-bold text-slate-800 m-0 grow min-w-[200px] text-left">{selectedItem.wellName}</h3>
                      <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{selectedItem.wellType || 'Open Well'}</span>
                    </div>

                    <div className="flex flex-col gap-5 text-left">
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Owner Name</span>
                          <strong className="text-xs font-bold text-slate-700">{selectedItem.ownerName || 'Not specified'}</strong>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Lining Material</span>
                          <strong className="text-xs font-bold text-slate-700">{selectedItem.lining || 'Not specified'}</strong>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Diameter</span>
                          <strong className="text-xs font-bold text-slate-700">{selectedItem.diameterFt ? `${selectedItem.diameterFt} Ft` : 'Not specified'}</strong>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Well Depth</span>
                          <strong className="text-xs font-bold text-slate-700">{selectedItem.depthFt ? `${selectedItem.depthFt} Ft` : 'Not specified'}</strong>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Water Level</span>
                          <strong className="text-xs font-bold text-slate-700">{selectedItem.waterLevelFt ? `${selectedItem.waterLevelFt} Ft` : 'Not specified'}</strong>
                        </div>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                        <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider m-0">🧪 Hydrochemistry & Quality</h5>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">pH Level</span>
                            <strong className="text-sm text-slate-800 font-extrabold">{selectedItem.ph !== null && selectedItem.ph !== undefined ? selectedItem.ph : '—'}</strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">TDS (ppm)</span>
                            <strong className="text-sm text-slate-800 font-extrabold">{selectedItem.tds !== null && selectedItem.tds !== undefined ? selectedItem.tds : '—'}</strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">Salinity</span>
                            <strong className="text-sm text-slate-800 font-extrabold">{selectedItem.salinity !== null && selectedItem.salinity !== undefined ? selectedItem.salinity : '—'}</strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">Fluoride</span>
                            <span className={`text-[10px] font-bold self-start px-1.5 py-0.5 rounded ${selectedItem.hasFluoride?.toLowerCase() === 'true' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                              {selectedItem.hasFluoride?.toLowerCase() === 'true' ? 'Detected' : 'Safe'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-dashed border-slate-200 pt-4">
                        <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2.5">📍 Geographic Telemetry</h5>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">Ward Name</span>
                            <strong className="text-xs text-slate-700 font-bold">{selectedItem.wardName || 'Unknown Ward'} {selectedItem.wardNameKn ? `(${selectedItem.wardNameKn})` : ''}</strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">Corporation</span>
                            <strong className="text-xs text-slate-700 font-bold">{selectedItem.corporation || 'Unknown Corporation'}</strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold">Coordinates</span>
                            <code className="font-mono text-[11px] text-slate-700 bg-white border border-slate-300 px-2 py-1 rounded w-fit inline-block">{selectedItem.lat.toFixed(6)}° N, {selectedItem.lng.toFixed(6)}° E</code>
                          </div>
                          {selectedItem.wardId && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">Ward ID</span>
                              <strong className="text-xs text-slate-700 font-bold">{selectedItem.wardId}</strong>
                            </div>
                          )}
                          {selectedItem.ac && (
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">Assembly Constituency</span>
                              <strong className="text-xs text-slate-700 font-bold">{selectedItem.ac} {selectedItem.acKn ? `(${selectedItem.acKn})` : ''}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-3 text-center py-10">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p className="text-[13.5px] m-0 max-w-[380px] font-semibold">Tick the &quot;Wells&quot; or &quot;Existing Interventions&quot; layers and choose a location to view telemetry measurements here.</p>
              </div>
            )}
          </div>



        </div>
      </div>
    </div>
  </div>
);
};

export default DataLayersView;