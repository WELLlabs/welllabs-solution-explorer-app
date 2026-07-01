import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../../config/api';
import './DataLayersView.css';
import Analytics from '../../pages/Analytics';

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
    details: 'Diagnosis stage to analyze catchment runoff and identify point sources of heavy metal pollution. Planning installation of trash racks and silt traps at key inlet channels.'
  }
];

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

const DataLayersView = () => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const navigate = useNavigate();

  // Datasets
  const [projects, setProjects] = useState([]);
  const [wells, setWells] = useState([]);
  const [loading, setLoading] = useState(true);

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
              <div class="map-popup-container">
                <span class="popup-badge" style="background-color: ${color}20; color: ${color};">GBA WARD BOUNDARY</span>
                <h4 class="popup-title" style="margin: 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${wardName}</h4>
                <p class="popup-ward" style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🏢 Corporation: <strong>${corp}</strong></p>
                <p class="popup-ward" style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">🗳️ Assembly: <strong>${ac}</strong></p>
                <p class="popup-ward" style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">🔑 Ward ID: <strong>${wardId}</strong></p>
              </div>
            `;
          } else if (layerType === 'gba_corporations') {
            const name = props.name || 'Unknown Corporation';
            const id = props.id || 'N/A';
            popupContent = `
              <div class="map-popup-container">
                <span class="popup-badge" style="background-color: ${color}20; color: ${color};">GBA CORPORATION</span>
                <h4 class="popup-title" style="margin: 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name} Zone</h4>
                <p class="popup-ward" style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🔑 Zone ID: <strong>${id}</strong></p>
              </div>
            `;
          } else if (layerType === 'valleys') {
            const name = props.name || 'Unknown Valley';
            const area = props.area ? (props.area / 1000000).toFixed(2) : 'N/A';
            popupContent = `
              <div class="map-popup-container">
                <span class="popup-badge" style="background-color: ${color}20; color: ${color};">VALLEY WATERSHED</span>
                <h4 class="popup-title" style="margin: 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name}</h4>
                <p class="popup-ward" style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">📐 Catchment Area: <strong>${area} km²</strong></p>
              </div>
            `;
          } else if (layerType === 'greenspaces') {
            const name = props.name || 'Unnamed Greenspace';
            const nameKn = props.nameKn || '';
            popupContent = `
              <div class="map-popup-container">
                <span class="popup-badge" style="background-color: ${color}20; color: ${color};">GREENSPACE / RESERVOIR</span>
                <h4 class="popup-title" style="margin: 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name} ${nameKn ? `(${nameKn})` : ''}</h4>
              </div>
            `;
          } else {
            const acName = props.AC_NAME || props.ac_name || props.Name || 'Unknown Assembly';
            const acNameKn = props.AC_NAME_KN || '';
            const acCode = props.AC_CODE || props.ac_code || 'N/A';
            const district = props.KGISDistri || props.district || 'N/A';
            popupContent = `
              <div class="map-popup-container">
                <span class="popup-badge" style="background-color: ${color}20; color: ${color};">ASSEMBLY BOUNDARY</span>
                <h4 class="popup-title" style="margin: 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${acName}</h4>
                <p class="popup-ward" style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🔑 AC Code: <strong>${acCode}</strong></p>
                <p class="popup-ward" style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">📍 District Code: <strong>${district}</strong></p>
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
        <div class="map-popup-container" style="width: 220px;">
          <span class="popup-badge" style="background-color: ${color}15; color: ${color}; font-weight: 800;">WARD WATER PROFILE</span>
          <h4 class="popup-title" style="margin: 4px 0 0 0; font-size: 13px; font-weight: 750; color: #0f172a;">${wardName}</h4>
          ${wardNameKn ? `<p class="popup-ward" style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${wardNameKn}</p>` : ''}
          <p class="popup-ward" style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">🔑 Ward ID: <strong>${wardId || 'N/A'}</strong></p>
          <p class="popup-ward" style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">🏢 Corp: <strong>${corporation || 'N/A'}</strong></p>
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
          <span class="popup-hint" style="text-align: center; margin-top: 6px; border-top: 1px dashed #e2e8f0; padding-top: 4px;">Total Ward Assets: <strong>${totalCount}</strong></span>
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

  const getWellColor = () => {
    return '#a855f7'; // Violet/purple color matching wells checkbox
  };

  // Filter Items - Merging Wells and Projects cleanly based on checked states
  const getFilteredItems = () => {
    let items = [];
    const search = searchText.toLowerCase();

    if (showWells) {
      const filteredWells = wells.filter((w) => {
        return (
          w.wellName.toLowerCase().includes(search) ||
          w.wardName.toLowerCase().includes(search) ||
          w.wellType.toLowerCase().includes(search)
        );
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
        <div class="map-popup-container">
          <span class="popup-badge" style="background-color: ${color}20; color: ${color};">${badgeLabel}: ${String(type || 'UNSPECIFIED').toUpperCase()}</span>
          <h4 class="popup-title">${name}</h4>
          <p class="popup-ward">📍 ${item.wardName || 'Unknown Ward'}</p>
          ${isProj ? `<p class="popup-category" style="margin: 4px 0 8px 0; font-size: 11px; color: #475569;">🏷️ Category: <strong style="color: ${color};">${item.categoryInfo?.name}</strong></p>` : ''}
          <span class="popup-hint">Click point for full details</span>
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
      NEW_PROJECTS_DATA.forEach((item) => {
        const { lat, lng } = item;
        if (lat === null || lng === null || isNaN(lat) || isNaN(lng)) return;

        const color = '#3b82f6'; // Match projects color

        const marker = L.circleMarker([lat, lng], {
          radius: 8,
          fillColor: color,
          color: '#ffffff',
          weight: 2,
          opacity: 1,
          fillOpacity: 0.9
        });

        const viewMoreBtn = `<a href="/newprojects?id=${item.id}" target="_blank" class="popup-view-more-btn" style="display: block; margin-top: 8px; text-decoration: none; background-color: ${color}; color: white; text-align: center; padding: 6px 10px; border-radius: 6px; font-size: 11px; font-weight: 750; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">View More Details</a>`;

        marker.bindPopup(`
          <div class="map-popup-container">
            <span class="popup-badge" style="background-color: ${color}20; color: ${color};">PROJECT: ${item.stage.toUpperCase()}</span>
            <h4 class="popup-title">${item.name}</h4>
            <p class="popup-ward">📋 Cost: <strong>${item.cost}</strong> | Progress: <strong>${item.progress}%</strong></p>
            ${viewMoreBtn}
            <span class="popup-hint">Click point for full details</span>
          </div>
        `);

        marker.on('click', () => {
          setSelectedItem({
            ...item,
            projName: item.name,
            status: item.stage,
            budget: item.cost,
            timeline: item.phase,
            tags: 'Lakes',
            lat: lat,
            lng: lng,
            wardName: 'Kasavanahalli',
            corporation: 'South'
          });
          map.setView([lat, lng], 14);
        });

        marker.addTo(markersGroup);
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
  }, [showWells, showProjects, showNewProjects, wells, projects, searchText, loading, selectedCategories]);

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
    <div className="data-layers-wrapper animate-fade-in">
      <div className="data-layers-header-row">
        <div>
          <h2>Interactive Spatial Explorer</h2>
          {/* <p className="tab-description-subtitle">
            Local GIS map visualization for municipal watersheds, projects, and ground wells compiled by WELL Labs.
            <span className="data-source-badge">Source: {dataSource}</span>
          </p> */}
        </div>
      </div>

      <div className="map-view-layout">
        {/* Left Sidebar Control Panel */}
        <div className="map-control-sidebar glassmorphic">
          {/* Map Layer Checkboxes */}
          <div className="sidebar-section">
            <h5>Map Layers ({wells.length + projects.length} items total)</h5>
            <div className="layer-checkbox-group">
              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showWells}
                  onChange={(e) => setShowWells(e.target.checked)}
                />
                <span className="custom-check well-indicator"></span>
                Wells ({showWells ? `${filteredItems.filter(i => i.projName === undefined).length} active` : `${wells.length} total`})
              </label>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showProjects}
                  onChange={(e) => setShowProjects(e.target.checked)}
                />
                <span className="custom-check project-indicator"></span>
                Existing Interventions ({showProjects ? `${filteredItems.filter(i => i.projName !== undefined).length} active` : `${projects.length} total`})
              </label>

              {showProjects && (
                <div className="nested-category-filters animate-slide-down">
                  <label className="category-checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedCategories.lake}
                      onChange={(e) => setSelectedCategories({ ...selectedCategories, lake: e.target.checked })}
                    />
                    <span className="custom-check-nested" style={{ borderColor: '#0284c7', backgroundColor: selectedCategories.lake ? '#0284c7' : 'transparent' }}></span>
                    <span className="category-label-text">🌊 Lakes ({categoryCounts.lake})</span>
                  </label>
                  <label className="category-checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedCategories.flood}
                      onChange={(e) => setSelectedCategories({ ...selectedCategories, flood: e.target.checked })}
                    />
                    <span className="custom-check-nested" style={{ borderColor: '#ea580c', backgroundColor: selectedCategories.flood ? '#ea580c' : 'transparent' }}></span>
                    <span className="category-label-text">🛡️ Flood ({categoryCounts.flood})</span>
                  </label>
                  <label className="category-checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedCategories.groundwater}
                      onChange={(e) => setSelectedCategories({ ...selectedCategories, groundwater: e.target.checked })}
                    />
                    <span className="custom-check-nested" style={{ borderColor: '#8b5cf6', backgroundColor: selectedCategories.groundwater ? '#8b5cf6' : 'transparent' }}></span>
                    <span className="category-label-text">💧 Groundwater ({categoryCounts.groundwater})</span>
                  </label>
                  <label className="category-checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedCategories.rainwater}
                      onChange={(e) => setSelectedCategories({ ...selectedCategories, rainwater: e.target.checked })}
                    />
                    <span className="custom-check-nested" style={{ borderColor: '#10b981', backgroundColor: selectedCategories.rainwater ? '#10b981' : 'transparent' }}></span>
                    <span className="category-label-text">🌧️ Rainwater ({categoryCounts.rainwater})</span>
                  </label>
                  <label className="category-checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedCategories.iuwm}
                      onChange={(e) => setSelectedCategories({ ...selectedCategories, iuwm: e.target.checked })}
                    />
                    <span className="custom-check-nested" style={{ borderColor: '#ec4899', backgroundColor: selectedCategories.iuwm ? '#ec4899' : 'transparent' }}></span>
                    <span className="category-label-text">🔄 IUWM ({categoryCounts.iuwm})</span>
                  </label>
                  {categoryCounts.other > 0 && (
                    <label className="category-checkbox-container">
                      <input
                        type="checkbox"
                        checked={selectedCategories.other}
                        onChange={(e) => setSelectedCategories({ ...selectedCategories, other: e.target.checked })}
                      />
                      <span className="custom-check-nested" style={{ borderColor: '#64748b', backgroundColor: selectedCategories.other ? '#64748b' : 'transparent' }}></span>
                      <span className="category-label-text">⚙️ Other ({categoryCounts.other})</span>
                    </label>
                  )}
                </div>
              )}

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showWards}
                  onChange={(e) => setShowWards(e.target.checked)}
                />
                <span className="custom-check wards-indicator"></span>
                Wards Summary ({Object.keys(wells.concat(projects).reduce((acc, item) => {
                  if (item.wardName && !item.wardName.toLowerCase().includes('unknown') && item.wardName.trim() !== '') {
                    acc[item.wardName] = true;
                  }
                  return acc;
                }, {})).length} Wards)
              </label>

              {/* <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showAssemblyConst2}
                  onChange={(e) => setShowAssemblyConst2(e.target.checked)}
                />
                <span className="custom-check assembly-indicator"></span>
                Assembly Boundaries {loadingAssemblyConst2 && <span className="small-inline-spinner"></span>}
              </label> */}

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showBengaluruAssembly}
                  onChange={(e) => setShowBengaluruAssembly(e.target.checked)}
                />
                <span className="custom-check bengaluru-indicator"></span>
                Bengaluru Assemblies {loadingBengaluruAssembly && <span className="small-inline-spinner"></span>}
              </label>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showKarnatakaAssembly}
                  onChange={(e) => setShowKarnatakaAssembly(e.target.checked)}
                />
                <span className="custom-check karnataka-indicator"></span>
                Karnataka Assemblies {loadingKarnatakaAssembly && <span className="small-inline-spinner"></span>}
              </label>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showGbaWards}
                  onChange={(e) => setShowGbaWards(e.target.checked)}
                />
                <span className="custom-check gba-wards-indicator"></span>
                GBA Wards {loadingGbaWards && <span className="small-inline-spinner"></span>}
              </label>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showGbaCorporations}
                  onChange={(e) => setShowGbaCorporations(e.target.checked)}
                />
                <span className="custom-check gba-corps-indicator"></span>
                GBA Corporations {loadingGbaCorporations && <span className="small-inline-spinner"></span>}
              </label>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showValleys}
                  onChange={(e) => setShowValleys(e.target.checked)}
                />
                <span className="custom-check valleys-indicator"></span>
                Valleys {loadingValleys && <span className="small-inline-spinner"></span>}
              </label>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showGreenspaces}
                  onChange={(e) => setShowGreenspaces(e.target.checked)}
                />
                <span className="custom-check greenspaces-indicator"></span>
                Greenspaces {loadingGreenspaces && <span className="small-inline-spinner"></span>}
              </label>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showNewProjects}
                  onChange={(e) => setShowNewProjects(e.target.checked)}
                />
                <span className="custom-check new-projects-indicator"></span>
                Projects
              </label>

              <label className="checkbox-container">
                <input
                  type="checkbox"
                  checked={showNewFloodRisk}
                  onChange={(e) => setShowNewFloodRisk(e.target.checked)}
                />
                <span className="custom-check new-flood-risk-indicator"></span>
                Flood Risk {loadingBengaluruAssembly && showNewFloodRisk && <span className="small-inline-spinner"></span>}
              </label>
            </div>
          </div>

          {/* Search and List Panel */}
          <div className="sidebar-section list-section">
            <div className="search-bar-container" style={{ marginBottom: (showWells || showProjects) ? '4px' : '0px' }}>
              <svg 
                className="search-icon-svg" 
                width="16" 
                height="16" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="#64748b" 
                strokeWidth="2.5" 
                style={{ 
                  position: 'absolute', 
                  left: '14px', 
                  top: '50%', 
                  transform: 'translateY(-50%)', 
                  pointerEvents: 'none',
                  zIndex: 2
                }}
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
                className="search-input"
              />
              {searchText && (
                <button onClick={() => setSearchText('')} className="clear-search-btn">×</button>
              )}
            </div>

            {(showWells || showProjects) && (
              <div className="list-count-summary" style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '8px', paddingLeft: '4px' }}>
                Showing {filteredItems.length} of {wells.length + projects.length} items (scroll down to view all)
              </div>
            )}

            <div className="filtered-items-list">
              {loading ? (
                <div className="list-loading-state">
                  <div className="small-spinner"></div>
                  <span>Loading GIS assets...</span>
                </div>
              ) : (!showWells && !showProjects) ? (
                <div className="list-empty-state">
                  Check the <strong>Wells</strong> or <strong>Existing Interventions</strong> layer above to display spatial data.
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="list-empty-state">No matching assets found.</div>
              ) : (
                filteredItems.map((item, index) => {
                  const isProj = item.projName !== undefined;
                  const name = isProj ? item.projName : item.wellName;
                  const desc = isProj ? item.status : item.wellType;
                  const color = isProj ? getProjectColor(item.status, item.tags) : getWellColor(item.wellType);

                  return (
                    <div
                      key={item._id || item._mb_row_id || index}
                      className={`list-item-card ${isItemSelected(item) ? 'selected' : ''}`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div className="item-color-dot" style={{ backgroundColor: color }}></div>
                      <div className="item-details">
                        <strong className="item-title">{name}</strong>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span className="item-subtitle">{desc || 'Open Well'} — {item.wardName || 'Unknown Ward'}</span>
                          {isProj && item.categoryInfo && (
                            <span className="item-category-badge" style={{
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
        <div className="map-and-details-pane">
          {/* Main Leaflet Map */}
          <div className="leaflet-map-card glassmorphic">
            <div className="map-view-header">
              <h4>🗺️ Bengaluru Map View — Groundwater & Watershed Explorer</h4>
              <span className="asset-count-badge">
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
          <div className="item-details-card glassmorphic">
            {selectedItem ? (
              <div className="details-card-inner">
                {selectedItem.projName !== undefined ? (
                  <>
                    <div className="details-header">
                      {selectedItem.categoryInfo ? (
                        <span className="details-type-tag project-tag" style={{ backgroundColor: selectedItem.categoryInfo.color + '15', color: selectedItem.categoryInfo.color }}>
                          {selectedItem.categoryInfo.name.toUpperCase()}
                        </span>
                      ) : (
                        <span className="details-type-tag project-tag">PROJECT</span>
                      )}
                      <h3>{selectedItem.projName}</h3>
                      <div
                        className={`status-pill ${selectedItem.status?.toLowerCase().includes('completed') ? 'completed' : 'active'}`}
                      >
                        {selectedItem.status || 'Active'}
                      </div>
                    </div>

                    <div className="details-body">
                      <div className="info-grid">
                        <div className="info-entry">
                          <span className="entry-label">Project Lead</span>
                          <strong className="entry-val">{selectedItem.projLead || 'Not specified'}</strong>
                        </div>
                        <div className="info-entry">
                          <span className="entry-label">Budget</span>
                          <strong className="entry-val">{selectedItem.budget || 'Not specified'}</strong>
                        </div>
                        <div className="info-entry">
                          <span className="entry-label">Timeline</span>
                          <strong className="entry-val">{selectedItem.timeline || 'Not specified'}</strong>
                        </div>
                        <div className="info-entry">
                          <span className="entry-label">Area / Catchment</span>
                          <strong className="entry-val">{selectedItem.areaCatchment || 'Not specified'}</strong>
                        </div>
                        <div className="info-entry">
                          <span className="entry-label">Drain Length</span>
                          <strong className="entry-val">{selectedItem.drainLength || 'Not specified'}</strong>
                        </div>
                        <div className="info-entry">
                          <span className="entry-label">Tags</span>
                          <div className="entry-tags-row">
                            {(selectedItem.tags || 'Rejuvenation').split(',').map((t, idx) => (
                              <span key={idx} className="tag-pill">{t.trim()}</span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="location-details-block">
                        <h5>📍 Geographic Telemetry</h5>
                        <div className="location-grid">
                          <div>
                            <span>Ward Name</span>
                            <strong>{selectedItem.wardName || 'Unknown Ward'} {selectedItem.wardNameKn ? `(${selectedItem.wardNameKn})` : ''}</strong>
                          </div>
                          <div>
                            <span>Corporation</span>
                            <strong>{selectedItem.corporation || 'Unknown Corporation'}</strong>
                          </div>
                          <div>
                            <span>Coordinates</span>
                            <code>{selectedItem.lat.toFixed(6)}° N, {selectedItem.lng.toFixed(6)}° E</code>
                          </div>
                          {selectedItem.wardId && (
                            <div>
                              <span>Ward ID</span>
                              <strong>{selectedItem.wardId}</strong>
                            </div>
                          )}
                          {selectedItem.ac && (
                            <div>
                              <span>Assembly Constituency</span>
                              <strong>{selectedItem.ac} {selectedItem.acKn ? `(${selectedItem.acKn})` : ''}</strong>
                            </div>
                          )}
                        </div>
                      </div>

                      {selectedItem.mediaLink && selectedItem.mediaLink.trim() !== '' && (
                        <a
                          href={selectedItem.mediaLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="media-link-btn"
                        >
                          Read Case Report / Media Coverage
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ marginLeft: '6px' }}>
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="details-header">
                      <span className="details-type-tag well-tag">GROUND WELL</span>
                      <h3>{selectedItem.wellName}</h3>
                      <span className="well-type-tag">{selectedItem.wellType || 'Open Well'}</span>
                    </div>

                    <div className="details-body">
                      <div className="info-grid">
                        <div className="info-entry">
                          <span className="entry-label">Owner Name</span>
                          <strong className="entry-val">{selectedItem.ownerName || 'Not specified'}</strong>
                        </div>
                        <div className="info-entry">
                          <span className="entry-label">Lining Material</span>
                          <strong className="entry-val">{selectedItem.lining || 'Not specified'}</strong>
                        </div>
                        <div className="info-entry">
                          <span className="entry-label">Diameter</span>
                          <strong className="entry-val">{selectedItem.diameterFt ? `${selectedItem.diameterFt} Ft` : 'Not specified'}</strong>
                        </div>
                        <div className="info-entry">
                          <span className="entry-label">Well Depth</span>
                          <strong className="entry-val">{selectedItem.depthFt ? `${selectedItem.depthFt} Ft` : 'Not specified'}</strong>
                        </div>
                        <div className="info-entry">
                          <span className="entry-label">Water Level</span>
                          <strong className="entry-val">{selectedItem.waterLevelFt ? `${selectedItem.waterLevelFt} Ft` : 'Not specified'}</strong>
                        </div>
                      </div>

                      <div className="water-chemistry-block">
                        <h5>🧪 Hydrochemistry & Quality</h5>
                        <div className="chemistry-grid">
                          <div className="chem-entry">
                            <span className="chem-label">pH Level</span>
                            <strong className="chem-val">{selectedItem.ph !== null && selectedItem.ph !== undefined ? selectedItem.ph : '—'}</strong>
                          </div>
                          <div className="chem-entry">
                            <span className="chem-label">TDS (ppm)</span>
                            <strong className="chem-val">{selectedItem.tds !== null && selectedItem.tds !== undefined ? selectedItem.tds : '—'}</strong>
                          </div>
                          <div className="chem-entry">
                            <span className="chem-label">Salinity</span>
                            <strong className="chem-val">{selectedItem.salinity !== null && selectedItem.salinity !== undefined ? selectedItem.salinity : '—'}</strong>
                          </div>
                          <div className="chem-entry">
                            <span className="chem-label">Fluoride</span>
                            <span className={`chem-status ${selectedItem.hasFluoride?.toLowerCase() === 'true' ? 'warning' : 'safe'}`}>
                              {selectedItem.hasFluoride?.toLowerCase() === 'true' ? 'Detected' : 'Safe'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="location-details-block">
                        <h5>📍 Geographic Telemetry</h5>
                        <div className="location-grid">
                          <div>
                            <span>Ward Name</span>
                            <strong>{selectedItem.wardName || 'Unknown Ward'} {selectedItem.wardNameKn ? `(${selectedItem.wardNameKn})` : ''}</strong>
                          </div>
                          <div>
                            <span>Corporation</span>
                            <strong>{selectedItem.corporation || 'Unknown Corporation'}</strong>
                          </div>
                          <div>
                            <span>Coordinates</span>
                            <code>{selectedItem.lat.toFixed(6)}° N, {selectedItem.lng.toFixed(6)}° E</code>
                          </div>
                          {selectedItem.wardId && (
                            <div>
                              <span>Ward ID</span>
                              <strong>{selectedItem.wardId}</strong>
                            </div>
                          )}
                          {selectedItem.ac && (
                            <div>
                              <span>Assembly Constituency</span>
                              <strong>{selectedItem.ac} {selectedItem.acKn ? `(${selectedItem.acKn})` : ''}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="details-empty-prompt">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                <p>Tick the "Wells" or "Existing Interventions" layers and choose a location to view telemetry measurements here.</p>
              </div>
            )}
          </div>

          {/* Analytics Dashboard Pane */}
          <div className="analytics-details-card glassmorphic">
            <Analytics />
          </div>

        </div>
      </div>
    </div>
  );
};

export default DataLayersView;
