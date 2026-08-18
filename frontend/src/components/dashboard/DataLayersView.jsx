import React, { useEffect, useRef, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import api from "../../config/api";
import Analytics from "../../pages/Analytics";
import NewProjectsView, {
  normaliseProject,
  preprocessProject,
  rs,
  INT_COLOUR,
  INT_LABEL,
  SITE_TYPE_LABEL,
} from "./NewProjectsView";
import Interventions from "./Interventions";

// Fallback local datasets (both JSON and rich CSV v1 with ward mapping telemetry)
import localProjects from "../../data/projects.json";
import localWells from "../../data/wells.json";
import v1WellsCsv from "../../data/v1_wells_with_wards.csv?raw";
import v1ProjectsCsv from "../../data/v1_projects_with_wards.csv?raw";
import { getProjectImage } from "../../data/projectImages";

const NEW_PROJECTS_DATA = [
  {
    id: "kasavanahalli",
    name: "Kasavanahalli Lake",
    stage: "Design",
    phase: "Phase 2",
    progress: 34,
    cost: "₹4.20 Cr",
    committed: "₹4.20 Cr",
    lat: 12.903973,
    lng: 77.667712,
    watershedId: "kasavanahalli_ws",
    details:
      "Rejuvenation of the lake. Focuses on setting up wetland systems, desilting, channel restoration, improving water quality index, and constructing perimeter walking pathways for the local community.",
  },
  {
    id: "doddakannelli",
    name: "Doddakannelli Lake",
    stage: "Design",
    phase: "Phase 1",
    progress: 11,
    cost: "₹2.10 Cr",
    committed: "₹2.10 Cr",
    lat: 12.9126,
    lng: 77.6896,
    watershedId: "kasavanahalli_ws",
    details:
      "Diagnosing sewage inlet points and catchment siltation. A detailed project report (DPR) is underway to divert raw sewage from entering the main lake body.",
  },
  {
    id: "varthur",
    name: "Varthur Lake — Zone 1",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 10,
    cost: "₹9.60 Cr",
    committed: "₹9.60 Cr",
    lat: 12.9431,
    lng: 77.7471,
    watershedId: "kadugodi_ws",
    details:
      "Comprehensive catchment mapping and water quality monitoring. Focuses on sediment analysis and planning massive de-weeding and aeration systems to restore the lake's ecological balance.",
  },
  {
    id: "halanayakanahalli",
    name: "Halanayakanahalli Lake",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 0,
    cost: "₹2.80 Cr",
    committed: "₹2.80 Cr",
    lat: 12.8988,
    lng: 77.6922,
    watershedId: "kasavanahalli_ws",
    details:
      "Preliminary environmental baseline assessment. Project kicked off to map the incoming storm-water drains and outline encroachment boundaries for eviction and preservation.",
  },
  {
    id: "saulkere",
    name: "Saul Kere",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 0,
    cost: "₹3.60 Cr",
    committed: "₹3.60 Cr",
    lat: 12.9238,
    lng: 77.6787,
    watershedId: "saulkere_ws",
    details:
      "Diagnosis stage to analyze catchment runoff and identify point sources of heavy metal pollution. Planning installation of trash racks and silt traps at key inlet channels.",
  },
  {
    id: "kadugodi_park",
    name: "Kadugodi Tree & Forest Parks",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 5,
    cost: "₹1.40 Cr",
    committed: "₹0.00 Cr",
    lat: 12.9904,
    lng: 77.7608,
    watershedId: "kadugodi_ws",
    details:
      "Integrated nature-based solutions across Kadugodi Tree Park, Children Park, and Inner Circle Park. Implementing rain gardens, infiltration trenches, and bioswales to capture catchment runoff.",
  },
  {
    id: "hoodi_lake",
    name: "Hoodi Lake & KTPO Campus",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 5,
    cost: "₹3.20 Cr",
    committed: "₹0.00 Cr",
    lat: 12.9938,
    lng: 77.7163,
    watershedId: "hoodi_ws",
    details:
      "Recharging solutions at Hoodi Lake and the KTPO office campus. Implements bioretention rain gardens, bioswales, detention basins, and EcoBloc underground storm water storage cells.",
  },
  {
    id: "sheelavanthakere_lake",
    name: "Sheelavanthakere Lake & Parks",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 5,
    cost: "₹1.90 Cr",
    committed: "₹0.00 Cr",
    lat: 12.9554,
    lng: 77.7287,
    watershedId: "sheelavanthakere_ws",
    details:
      "Storm runoff absorption and buffer recovery around Sheelavanthakere Lake and Nallurhalli Park. Focuses on bund infiltration trenches, rain gardens, and perimeter bioswales.",
  },
];

const FLOOD_SPOTS_DATA = [
  {
    id: "spot-1",
    name: "Kadugodi Road Intersection",
    lat: 12.9985,
    lng: 77.7612,
    watershedId: "kadugodi_ws",
    details:
      "Severe flooding occurs under heavy downpours due to high surface runoff from the surrounding tree parks and paved layouts.",
  },
  {
    id: "spot-2",
    name: "Whitefield Station Approach Road",
    lat: 12.995,
    lng: 77.751,
    watershedId: "kadugodi_ws",
    details:
      "Water logging up to 2 feet occurs during design storms, blocking transit routes.",
  },
  {
    id: "spot-3",
    name: "Hoodi Circle Underpass",
    lat: 12.9912,
    lng: 77.712,
    watershedId: "hoodi_ws",
    details:
      "Depressed underpass acts as a sink for runoff flowing from the industrial blocks.",
  },
  {
    id: "spot-4",
    name: "KTPO Intersection Road",
    lat: 12.989,
    lng: 77.728,
    watershedId: "hoodi_ws",
    details:
      "High percentage of built-up area causes instant peak discharge onto roads.",
  },
  {
    id: "spot-5",
    name: "Sheelavanthakere Low Layouts",
    lat: 12.959,
    lng: 77.732,
    watershedId: "sheelavanthakere_ws",
    details:
      "Backwater effect from lake overflow during intense events impacts surrounding houses.",
  },
  {
    id: "spot-6",
    name: "Nallurhalli Junction",
    lat: 12.964,
    lng: 77.741,
    watershedId: "sheelavanthakere_ws",
    details:
      "Encroached channels and blocked drains cause storm runoff to spill onto roads.",
  },
  {
    id: "spot-7",
    name: "Outer Ring Road (ORR) Saul Kere segment",
    lat: 12.9245,
    lng: 77.682,
    watershedId: "saulkere_ws",
    details:
      "Low elevation segment adjacent to the lake outlet, prone to gridlock under storm events.",
  },
  {
    id: "spot-8",
    name: "Sarjapur Road - HSR link",
    lat: 12.9055,
    lng: 77.671,
    watershedId: "kasavanahalli_ws",
    details:
      "Flooding at low points due to lack of adequate storm water disposal infrastructure.",
  },
];

const WATERSHEDS_POLYGONS = {
  kadugodi_ws: {
    name: "Kadugodi Watershed (East)",
    color: "#10b981",
    coords: [
      [13.006, 77.745],
      [13.008, 77.775],
      [12.98, 77.778],
      [12.982, 77.74],
    ],
  },
  hoodi_ws: {
    name: "Hoodi Watershed (Central-North)",
    color: "#8b5cf6",
    coords: [
      [13.002, 77.7],
      [13.005, 77.735],
      [12.978, 77.738],
      [12.975, 77.702],
    ],
  },
  sheelavanthakere_ws: {
    name: "Sheelavanthakere Watershed (Central-South)",
    color: "#0284c7",
    coords: [
      [12.972, 77.72],
      [12.975, 77.755],
      [12.948, 77.758],
      [12.945, 77.722],
    ],
  },
  kasavanahalli_ws: {
    name: "Kasavanahalli Lake Watershed",
    color: "#ec4899",
    coords: [
      [12.922, 77.655],
      [12.925, 77.7],
      [12.892, 77.705],
      [12.89, 77.66],
    ],
  },
  saulkere_ws: {
    name: "Saul Kere Watershed",
    color: "#ea580c",
    coords: [
      [12.935, 77.665],
      [12.938, 77.695],
      [12.912, 77.698],
      [12.91, 77.668],
    ],
  },
};

// Utility helper to parse a CSV text string into an array of objects, handling quoted values correctly
const parseCSV = (csvText) => {
  const lines = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === "\n" && !insideQuotes) {
      lines.push(currentLine);
      currentLine = "";
      continue;
    }
    currentLine += char;
  }
  if (currentLine) lines.push(currentLine);

  if (lines.length === 0) return [];

  const headers = lines[0]
    .split(",")
    .map((h) => h.trim().replace(/^"|"$/g, ""));
  const result = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const values = [];
    let curVal = "";
    let inQ = false;
    for (let j = 0; j < line.length; j++) {
      const c = line[j];
      if (c === '"') {
        inQ = !inQ;
      } else if (c === "," && !inQ) {
        values.push(curVal.trim().replace(/^"|"$/g, ""));
        curVal = "";
        continue;
      }
      curVal += c;
    }
    values.push(curVal.trim().replace(/^"|"$/g, ""));

    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] !== undefined ? values[index] : "";
    });
    result.push(row);
  }
  return result;
};

// Utility helper to parse coordinate strings (e.g. "12.95435900° N") into numbers
const parseCoordinate = (val) => {
  if (typeof val === "number") return val;
  if (val === null || val === undefined || val === "") return null;
  const valStr = String(val).trim();
  const match = valStr.match(/([0-9.]+)\s*°?\s*([NSEWnsew]?)/);
  if (!match) {
    const parsed = parseFloat(valStr);
    return isNaN(parsed) ? null : parsed;
  }
  let num = parseFloat(match[1]);
  if (isNaN(num)) return null;
  const dir = match[2].toUpperCase();
  if (dir === "S" || dir === "W") {
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
  for (
    let i = 0, j = polygonCoords.length - 1;
    i < polygonCoords.length;
    j = i++
  ) {
    const xi = polygonCoords[i][0];
    const yi = polygonCoords[i][1];
    const xj = polygonCoords[j][0];
    const yj = polygonCoords[j][1];

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
};

// Utility helper to check if a point [lat, lng] is inside a GeoJSON Geometry (Polygon or MultiPolygon)
const isPointInGeometry = (lat, lng, geometry) => {
  if (!geometry) return false;
  const { type, coordinates } = geometry;
  if (type === "Polygon") {
    return pointInPolygon(lat, lng, coordinates[0]);
  } else if (type === "MultiPolygon") {
    return coordinates.some((polygon) => pointInPolygon(lat, lng, polygon[0]));
  }
  return false;
};

// Category resolution based on project tags (Intervention Type full forms)
const getProjectCategoryInfo = (tags) => {
  const tagsStr = String(tags || "").toLowerCase();
  if (tagsStr.includes("rainwater")) {
    return {
      id: "rainwater",
      name: "Rainwater Harvesting Systems",
      color: "#10b981",
      icon: "🌧️",
      bg: "#ecfdf5",
      border: "#a7f3d0",
    };
  }
  if (tagsStr.includes("groundwater")) {
    return {
      id: "groundwater",
      name: "Groundwater Management & Recharge",
      color: "#8b5cf6",
      icon: "💧",
      bg: "#f5f3ff",
      border: "#ddd6fe",
    };
  }
  if (tagsStr.includes("flood")) {
    return {
      id: "flood",
      name: "Flood Mitigation & Drainage",
      color: "#ea580c",
      icon: "🛡️",
      bg: "#fff7ed",
      border: "#fed7aa",
    };
  }
  if (tagsStr.includes("lake")) {
    return {
      id: "lake",
      name: "Lake Rejuvenation & Restoration",
      color: "#0284c7",
      icon: "🌊",
      bg: "#f0f9ff",
      border: "#bae6fd",
    };
  }
  if (tagsStr.includes("iuwm")) {
    return {
      id: "iuwm",
      name: "Integrated Urban Water Management (IUWM)",
      color: "#ec4899",
      icon: "🔄",
      bg: "#fdf2f8",
      border: "#fbcfe8",
    };
  }
  return {
    id: "other",
    name: "Other Water Infrastructure",
    color: "#64748b",
    icon: "⚙️",
    bg: "#f8fafc",
    border: "#e2e8f0",
  };
};

// Site Type resolution (Parks, Lakes, Drains, Roads / Campuses)
const getProjectSiteType = (tags, projName = "", details = "", type = "") => {
  const text = `${projName} ${tags} ${details} ${type}`.toLowerCase();
  if (
    text.includes("lake") ||
    text.includes("kere") ||
    text.includes("tank") ||
    text.includes("water body") ||
    text.includes("pond")
  ) {
    return {
      id: "lake",
      name: "Lakes & Water Bodies",
      icon: "🌊",
      color: "#0284c7",
      bg: "#e0f2fe",
      border: "#bae6fd",
    };
  }
  if (
    text.includes("park") ||
    text.includes("garden") ||
    text.includes("green") ||
    text.includes("forest") ||
    text.includes("tree") ||
    text.includes("playground")
  ) {
    return {
      id: "park",
      name: "Parks & Green Spaces",
      icon: "🟢",
      color: "#16a34a",
      bg: "#dcfce7",
      border: "#bbf7d0",
    };
  }
  if (
    text.includes("drain") ||
    text.includes("kaluve") ||
    text.includes("swd") ||
    text.includes("channel") ||
    text.includes("culvert") ||
    text.includes("storm")
  ) {
    return {
      id: "drain",
      name: "Storm Drains & Channels",
      icon: "⚫",
      color: "#475569",
      bg: "#f1f5f9",
      border: "#cbd5e1",
    };
  }
  return {
    id: "road",
    name: "Roads, Layouts & Campuses",
    icon: "🛣️",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fde68a",
  };
};

// BGG Framework resolution directly mapped from Site Typology:
// - Blue: Lakes & Water Bodies
// - Green: Parks & Green Spaces
// - Grey: Roads, Layouts & Campuses (+ Storm Drains)
const getProjectBGGType = (siteTypeOrTags, projName = "", details = "", type = "") => {
  let siteId = "";
  if (typeof siteTypeOrTags === "object" && siteTypeOrTags?.id) {
    siteId = siteTypeOrTags.id;
  } else {
    siteId = getProjectSiteType(siteTypeOrTags, projName, details, type).id;
  }

  if (siteId === "lake") {
    return {
      id: "blue",
      name: "Blue Infrastructure",
      subtitle: "Lakes & Water Bodies",
      icon: "🔵",
      color: "#0284c7",
      bg: "#e0f2fe",
      border: "#bae6fd",
    };
  }
  if (siteId === "park") {
    return {
      id: "green",
      name: "Green Infrastructure",
      subtitle: "Parks & Green Spaces",
      icon: "🟢",
      color: "#16a34a",
      bg: "#dcfce7",
      border: "#bbf7d0",
    };
  }
  // road & drain map to Grey (Roads, Layouts, Campuses & Storm Drains)
  return {
    id: "grey",
    name: "Grey Infrastructure",
    subtitle: "Roads, Layouts & Campuses",
    icon: "⚫",
    color: "#475569",
    bg: "#f1f5f9",
    border: "#cbd5e1",
  };
};

// Normalize Project Schema from both API and Fallback JSON/CSV
const normalizeProject = (p) => {
  const lat = parseCoordinate(
    p.latitude !== undefined ? p.latitude : p.Latitude,
  );
  const lng = parseCoordinate(
    p.longitude !== undefined ? p.longitude : p.Longitude,
  );
  const tagsVal = String(p.tags || p["Tags"] || "");
  const projNameVal = String(p.projName || p["Proj Name"] || p.proj_name || "");
  const detailsVal = String(p.details || p["Details"] || "");
  const typeVal = String(p.type || "");

  const categoryInfo = getProjectCategoryInfo(tagsVal);
  const siteTypeInfo = getProjectSiteType(tagsVal, projNameVal, detailsVal, typeVal);
  const bggTypeInfo = getProjectBGGType(siteTypeInfo);

  return {
    projNo: String(p.projNo || p["Proj No"] || p.proj_no || ""),
    projName: projNameVal,
    latitude: lat,
    longitude: lng,
    lat: lat,
    lng: lng,
    budget: String(p.budget || p["Budget"] || ""),
    timeline: String(p.timeline || p["Timeline"] || ""),
    status: String(p.status || p["Status"] || ""),
    projLead: String(p.projLead || p["Proj Lead"] || p.proj_lead || ""),
    stakeholders: String(p.stakeholders || p["Stakeholders"] || ""),
    tags: tagsVal,
    categoryInfo: categoryInfo,
    siteTypeInfo: siteTypeInfo,
    bggTypeInfo: bggTypeInfo,
    areaCatchment: String(
      p.areaCatchment || p["Area Catchment"] || p.area_catchment || "",
    ),
    drainLength: String(
      p.drainLength || p["Drain Length"] || p.drain_length || "",
    ),
    mediaLink: String(p.mediaLink || p["Media Link"] || p.media_link || ""),
    wardName: String(p.ward_name || p.wardName || p["Ward Name"] || ""),
    wardNameKn: String(p.ward_name_kn || ""),
    wardId: String(p.ward_id || ""),
    corporation: String(
      p.Corporation || p.corporation || p["Corporation"] || "",
    ),
    ac: String(p.ac || p.Assembly || ""),
    acKn: String(p.ac_kn || ""),
    _id: p._id || null,
    _mb_row_id: p._mb_row_id || null,
  };
};

// Normalize Well Schema from both API and Fallback JSON/CSV
const normalizeWell = (w) => {
  const lat = parseCoordinate(
    w.latitude !== undefined ? w.latitude : w.Latitude,
  );
  const lng = parseCoordinate(
    w.longitude !== undefined ? w.longitude : w.Longitude,
  );

  // Parse chemistry attributes
  const phVal =
    w.ph !== undefined && w.ph !== null
      ? parseFloat(w.ph)
      : w["Ph"] !== undefined && w["Ph"] !== null && w["Ph"] !== ""
        ? parseFloat(w["Ph"])
        : null;
  const tdsVal =
    w.tds !== undefined && w.tds !== null
      ? parseFloat(w.tds)
      : w["Tds"] !== undefined && w["Tds"] !== null && w["Tds"] !== ""
        ? parseFloat(w["Tds"])
        : null;
  const ecVal =
    w.ec !== undefined && w.ec !== null
      ? parseFloat(w.ec)
      : w["Ec"] !== undefined && w["Ec"] !== null && w["Ec"] !== ""
        ? parseFloat(w["Ec"])
        : null;
  const salinityVal =
    w.salinity !== undefined && w.salinity !== null
      ? parseFloat(w.salinity)
      : w["Salinity"] !== undefined &&
          w["Salinity"] !== null &&
          w["Salinity"] !== ""
        ? parseFloat(w["Salinity"])
        : null;

  return {
    wellName: String(w.wellName || w["Well Name"] || w.well_name || ""),
    latitude: lat,
    longitude: lng,
    lat: lat,
    lng: lng,
    wellType: String(w.wellType || w["Well Type"] || w.well_type || ""),
    ownerName: String(w.ownerName || w["Owner Name"] || w.owner_name || ""),
    yearDug: String(w.yearDug || w["Year Dug"] || w.year_dug || ""),
    lining: String(w.lining || w["Lining"] || ""),
    diameterFt: String(w.diameterFt || w["Diameter Ft"] || w.diameter_ft || ""),
    depthFt: String(w.depthFt || w["Depth Ft"] || w.depth_ft || ""),
    waterLevelFt: String(
      w.waterLevelFt || w["Water Level Ft"] || w.water_level_ft || "",
    ),
    ph: isNaN(phVal) ? null : phVal,
    tds: isNaN(tdsVal) ? null : tdsVal,
    ec: isNaN(ecVal) ? null : ecVal,
    salinity: isNaN(salinityVal) ? null : salinityVal,
    hasFluoride: String(
      w.hasFluoride !== undefined
        ? w.hasFluoride
        : w["Has Fluoride"] || w.has_fluoride || "",
    ),
    hasArsenic: String(
      w.hasArsenic !== undefined
        ? w.hasArsenic
        : w["Has Arsenic"] || w.has_arsenic || "",
    ),
    wardName: String(w.ward_name || w.wardName || w["Ward Name"] || ""),
    wardNameKn: String(w.ward_name_kn || ""),
    wardId: String(w.ward_id || ""),
    corporation: String(
      w.Corporation || w.corporation || w["Corporation"] || "",
    ),
    ac: String(w.ac || w.Assembly || ""),
    acKn: String(w.ac_kn || ""),
    _id: w._id || null,
    _mb_row_id: w._mb_row_id || null,
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
        {
          id: "bioretention",
          name: "Bioretention Basins",
          area: 100,
          infiltration: 13180,
          storage: 29590,
          color: "#3b82f6",
          icon: "🌧️",
          x: 80,
          y: 70,
          z: 20,
        },
        {
          id: "infiltration",
          name: "Infiltration Drains",
          area: 720,
          infiltration: 3234096,
          storage: 0,
          color: "#8b5cf6",
          icon: "💧",
          x: 180,
          y: 110,
          z: 10,
        },
        {
          id: "raingarden",
          name: "Rain Gardens",
          area: 320,
          infiltration: 641792,
          storage: 153632,
          color: "#10b981",
          icon: "🌱",
          x: 120,
          y: 150,
          z: 15,
        },
        {
          id: "swale",
          name: "Bioswales",
          area: 450,
          infiltration: 30015,
          storage: 2115,
          color: "#eab308",
          icon: "🌿",
          x: 230,
          y: 90,
          z: 8,
        },
      ],
      runoffNo: 66.4,
      runoffWith: 64.5,
      reductionPct: 3.0,
      infilNo: 20.3,
      infilWith: 22.1,
      infilIncreasePct: 8.9,
    },
    hoodi_lake: {
      assets: [
        {
          id: "detention",
          name: "Detention Silt Tanks",
          area: 100,
          infiltration: 1690,
          storage: 17280,
          color: "#3b82f6",
          icon: "📥",
          x: 70,
          y: 90,
          z: 30,
        },
        {
          id: "infiltration",
          name: "Infiltration Trench Field",
          area: 450,
          infiltration: 141255,
          storage: 0,
          color: "#8b5cf6",
          icon: "💧",
          x: 150,
          y: 160,
          z: 15,
        },
        {
          id: "raingarden",
          name: "Forebay Rain Gardens",
          area: 240,
          infiltration: 30264,
          storage: 33600,
          color: "#10b981",
          icon: "🌱",
          x: 220,
          y: 120,
          z: 15,
        },
        {
          id: "swale",
          name: "Catchment Bioswales",
          area: 400,
          infiltration: 9320,
          storage: 60,
          color: "#eab308",
          icon: "🌿",
          x: 260,
          y: 60,
          z: 10,
        },
      ],
      runoffNo: 51.94,
      runoffWith: 51.41,
      reductionPct: 1.0,
      infilNo: 7.88,
      infilWith: 8.41,
      infilIncreasePct: 6.73,
    },
    sheelavanthakere_lake: {
      assets: [
        {
          id: "bund_trench",
          name: "Bund Infiltration Trench",
          area: 300,
          infiltration: 1200000,
          storage: 45000,
          color: "#3b82f6",
          icon: "💧",
          x: 100,
          y: 130,
          z: 20,
        },
        {
          id: "park_raingarden",
          name: "Park Rain Gardens",
          area: 180,
          infiltration: 450000,
          storage: 50000,
          color: "#10b981",
          icon: "🌱",
          x: 160,
          y: 70,
          z: 15,
        },
        {
          id: "park_swale",
          name: "Park Bioswales",
          area: 120,
          infiltration: 150000,
          storage: 0,
          color: "#eab308",
          icon: "🌿",
          x: 220,
          y: 150,
          z: 10,
        },
      ],
      runoffNo: 60.5,
      runoffWith: 59.0,
      reductionPct: 2.5,
      infilNo: 18.5,
      infilWith: 19.8,
      infilIncreasePct: 7.2,
    },
  };

  const config = projectConfig[project.id];
  if (!config) return null;

  // Initialize toggles
  useEffect(() => {
    const initialToggles = {};
    config.assets.forEach((a) => {
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
    { x: 270, y: 130 },
  ];

  // Walking path animation loop
  useEffect(() => {
    let timer;
    if (isWalking) {
      timer = setInterval(() => {
        setWalkStep((prev) => (prev + 1) % walkingPathPoints.length);
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [isWalking]);

  const handleToggleAsset = (id) => {
    setToggledAssets((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const totalAssetsCount = config.assets.length;
  const activeAssetsCount = Object.values(toggledAssets).filter(Boolean).length;
  const activeFraction =
    totalAssetsCount > 0 ? activeAssetsCount / totalAssetsCount : 0;

  const liveInfiltration = config.assets.reduce((sum, a) => {
    return sum + (toggledAssets[a.id] ? a.infiltration : 0);
  }, 0);
  const liveStorage = config.assets.reduce((sum, a) => {
    return sum + (toggledAssets[a.id] ? a.storage : 0);
  }, 0);

  const liveRunoffReduction = (config.reductionPct * activeFraction).toFixed(2);
  const liveInfilIncrease = (config.infilIncreasePct * activeFraction).toFixed(
    2,
  );

  const fmtL = (liters) => {
    if (liters >= 1e6) return (liters / 1e6).toFixed(2) + "M L";
    if (liters >= 1e3) return (liters / 1e3).toFixed(1) + "k L";
    return liters + " L";
  };

  return (
    <div className="mt-3 flex flex-col gap-4">
      <div className="relative border border-slate-300 rounded-xl p-2 bg-[#f8fafc] shadow-[inset_0_2px_4px_rgba(0,0,0,0.02)]">
        <svg
          viewBox="0 0 320 220"
          className="w-full h-[200px] bg-gradient-to-b from-[#f1f5f9] to-[#cbd5e1] rounded-lg block"
        >
          <g stroke="#94a3b8" strokeWidth="0.5" opacity="0.3">
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1={0} y1={i * 20} x2={320} y2={i * 20 + 80} />
            ))}
            {Array.from({ length: 12 }).map((_, i) => (
              <line key={i} x1={i * 30} y1={0} x2={i * 30 - 100} y2={220} />
            ))}
          </g>

          <path
            d="M 80 120 Q 140 90 200 110 Q 260 130 220 160 Q 120 170 80 120 Z"
            fill="#93c5fd"
            opacity="0.6"
            stroke="#3b82f6"
            strokeWidth="1.5"
          />

          <path
            d={`M ${walkingPathPoints.map((p) => `${p.x} ${p.y}`).join(" L ")}`}
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

          {config.assets.map((a) => {
            const isEnabled = toggledAssets[a.id];
            const isActive = activeAsset && activeAsset.id === a.id;
            return (
              <g
                key={a.id}
                transform={`translate(${a.x}, ${a.y})`}
                onClick={() => setActiveAsset(a)}
                style={{ cursor: "pointer" }}
              >
                <path
                  d={`M -8 0 L -8 -${a.z} L 8 -${a.z} L 8 0 Z`}
                  fill={isEnabled ? a.color : "#94a3b8"}
                  opacity={isActive ? 0.95 : 0.75}
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <ellipse
                  cx="0"
                  cy={`-${a.z}`}
                  rx="8"
                  ry="4"
                  fill={isEnabled ? a.color : "#cbd5e1"}
                  opacity="0.9"
                  stroke="#ffffff"
                  strokeWidth="1"
                />
                <ellipse
                  cx="0"
                  cy="0"
                  rx="8"
                  ry="4"
                  fill={isEnabled ? a.color : "#94a3b8"}
                  opacity="0.4"
                />
                <text
                  x="0"
                  y={`-${a.z + 5}`}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#1e293b"
                  fontWeight="bold"
                >
                  {a.icon}
                </text>
              </g>
            );
          })}
        </svg>

        <div className="flex gap-2 mt-2">
          <button
            className={`flex-1 py-1.5 px-3 text-[11px] font-bold rounded-lg cursor-pointer transition-all duration-200 ${isWalking ? "bg-transparent text-slate-700 border border-slate-300 hover:bg-slate-100/60" : "bg-blue-600 text-white border border-blue-700/20 hover:bg-blue-700 shadow-sm"}`}
            onClick={() => setIsWalking(!isWalking)}
          >
            {isWalking ? "⏸️ Pause Walk" : "🚶 Start 3D Tour"}
          </button>
          <button
            className="py-1.5 px-3 text-[11px] font-bold text-slate-700 bg-transparent border border-slate-300 hover:bg-slate-100/60 rounded-lg cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={() => {
              setWalkStep(0);
              setIsWalking(false);
            }}
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
              {config.assets.map((a) => (
                <label
                  key={a.id}
                  className="flex items-center gap-1.5 text-[11.5px] cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={!!toggledAssets[a.id]}
                    onChange={() => handleToggleAsset(a.id)}
                    style={{ accentColor: a.color }}
                  />
                  <span
                    className={`transition-all ${toggledAssets[a.id] ? "no-underline text-slate-700" : "line-through text-slate-400"}`}
                  >
                    {a.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="bg-[#f8fafc] border border-slate-200 rounded-lg p-2.5">
            {activeAsset ? (
              <>
                <strong
                  style={{ color: activeAsset.color }}
                  className="text-xs block"
                >
                  {activeAsset.icon} {activeAsset.name}
                </strong>
                <span className="text-[11px] text-slate-500 block my-1">
                  Size: <strong>{activeAsset.area} sqm</strong>
                </span>
                <div className="flex flex-col gap-0.5 text-[11px] border-t border-dashed border-slate-200 pt-1.5">
                  <div>
                    Infil: <strong>{fmtL(activeAsset.infiltration)}</strong>
                  </div>
                  <div>
                    Storage: <strong>{fmtL(activeAsset.storage)}</strong>
                  </div>
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
            <span className="text-[#8fb3ad] block text-[9px] uppercase">
              Infiltration Gain
            </span>
            <strong className="text-[#5bc8b8] text-[14.5px]">
              {fmtL(liveInfiltration)}
            </strong>
          </div>
          <div>
            <span className="text-[#8fb3ad] block text-[9px] uppercase">
              Storage Buffer
            </span>
            <strong className="text-[#5bc8b8] text-[14.5px]">
              {fmtL(liveStorage)}
            </strong>
          </div>
          <div>
            <span className="text-[#8fb3ad] block text-[9px] uppercase">
              Runoff Reduction
            </span>
            <strong className="text-[#5bc8b8] text-[14.5px]">
              {liveRunoffReduction}%
            </strong>
          </div>
          <div>
            <span className="text-[#8fb3ad] block text-[9px] uppercase">
              Infil Increase
            </span>
            <strong className="text-[#5bc8b8] text-[14.5px]">
              {liveInfilIncrease}%
            </strong>
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
      setActiveDetailView({ type: "site", id: siteId });
    };
    window.openInterventionDetailInPlace = () => {
      setActiveDetailView({ type: "intervention", id: null });
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
      ? "/api/sites"
      : "https://api.climatesolutions.ai/api/sites";

    fetch(url)
      .then((r) => (r.ok ? r.json() : Promise.reject(`HTTP ${r.status}`)))
      .then((data) => {
        console.log(
          `%c🗺️ [SITES LAYER] Loaded ${data.length} sites from ${url}`,
          "color:#3b82f6;font-weight:bold;font-size:13px;",
        );
        console.log("All fetched sites details (full list):", data);
        setSitesData(data);
      })
      .catch((err) => console.warn("Could not load sites layer data:", err));
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

  const [dataSource, setDataSource] = useState("API"); // 'API' or 'Local Fallback'

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
  const [showFloodingHotspots, setShowFloodingHotspots] = useState(false);

  // Accordion questions state for left sidebar
  const [openSections, setOpenSections] = useState({
    happening: true,
    risks: true,
    projects: true,
  });

  // ── Flood Hotspot Right-Side Projects & Funding Deck State ─────────────────
  const [selectedFundPicks, setSelectedFundPicks] = useState(new Set());
  const [isRightDeckOpen, setIsRightDeckOpen] = useState(true);
  const [showFunderModal, setShowFunderModal] = useState(false);
  const [funderFormData, setFunderFormData] = useState({
    orgName: "",
    csrSector: "Water Security & Flood Mitigation",
    email: "",
    notes: "",
  });
  const [committedPicks, setCommittedPicks] = useState(new Set());
  const [commitSuccess, setCommitSuccess] = useState(false);

  // Normalize all live site projects for the funding deck
  const cityProjectsList = useMemo(() => {
    if (!sitesData || sitesData.length === 0) return [];
    return sitesData.map((s) => preprocessProject(normaliseProject(s)));
  }, [sitesData]);

  // Compute total funding summary based on funder selections
  const fundSummary = useMemo(() => {
    let totalCost = 0;
    let totalAssets = 0;
    const projectIds = new Set();

    cityProjectsList.forEach((p) => {
      p.assets.forEach((a, idx) => {
        const key = `${p.id}__${idx}`;
        if (selectedFundPicks.has(key)) {
          totalCost += a.cost || 0;
          totalAssets += 1;
          projectIds.add(p.id);
        }
      });
    });

    return {
      totalCost,
      totalAssets,
      projectsCount: projectIds.size,
    };
  }, [cityProjectsList, selectedFundPicks]);

  const toggleFundPick = (projId, assetIdx) => {
    const key = `${projId}__${assetIdx}`;
    setSelectedFundPicks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleProjectAllAssets = (proj) => {
    const projKeys = proj.assets.map((_, i) => `${proj.id}__${i}`);
    const allSelected = projKeys.every((k) => selectedFundPicks.has(k));
    setSelectedFundPicks((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        projKeys.forEach((k) => next.delete(k));
      } else {
        projKeys.forEach((k) => next.add(k));
      }
      return next;
    });
  };

  const selectAllAvailableAssets = () => {
    const allKeys = [];
    cityProjectsList.forEach((p) => {
      p.assets.forEach((_, i) => allKeys.push(`${p.id}__${i}`));
    });
    setSelectedFundPicks(new Set(allKeys));
  };

  const clearAllSelections = () => {
    setSelectedFundPicks(new Set());
  };

  const toggleSection = (sectionKey) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  // Layer Boundary Search (Bengaluru Assembly, GBA Wards, GBA Corporations) states & methods
  const [searchLayerItems, setSearchLayerItems] = useState([]);
  const [selectedSearchCategory, setSelectedSearchCategory] = useState("all"); // 'all' | 'assembly' | 'ward' | 'corporation'
  const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
  const [selectedBoundaryItem, setSelectedBoundaryItem] = useState(null);
  const selectedBoundaryLayerRef = useRef(null);
  const searchDropdownContainerRef = useRef(null);
  const [locationSearchQuery, setLocationSearchQuery] = useState("");
  const [searchError, setSearchError] = useState(null);

  // Load GeoJSON data for the 3 searchable layers on mount
  useEffect(() => {
    Promise.all([
      import("../../data/assembly_const2/bengaluru_assembly_const.json"),
      import("../../data/gba_wards.json"),
      import("../../data/gba_corporations.json"),
    ])
      .then(([assemblyMod, wardMod, corpMod]) => {
        const items = [];

        // 1. Bengaluru Assemblies
        if (assemblyMod.default?.features) {
          assemblyMod.default.features.forEach((f, idx) => {
            const props = f.properties || {};
            const name =
              props.AC_NAME ||
              props.ac_name ||
              props.Name ||
              `Assembly ${idx + 1}`;
            const code = props.AC_CODE || props.ac_code || "";
            items.push({
              id: `assembly_${idx}_${name}`,
              name: String(name).trim(),
              category: "assembly",
              categoryLabel: "Bengaluru Assembly",
              categoryColor: "#2563eb",
              categoryBg: "#eff6ff",
              categoryBorder: "#bfdbfe",
              categoryIcon: "🏛️",
              subtitle: code ? `AC Code: ${code}` : "Assembly Constituency",
              feature: f,
            });
          });
        }

        // 2. GBA Wards
        if (wardMod.default?.features) {
          wardMod.default.features.forEach((f, idx) => {
            const props = f.properties || {};
            const name = props.wardName || props.Name || `Ward ${idx + 1}`;
            const corp = props.corporation || "";
            const ac = props.ac || "";
            const wardId = props.wardId || "";
            items.push({
              id: `ward_${idx}_${name}`,
              name: String(name).trim(),
              category: "ward",
              categoryLabel: "GBA Ward",
              categoryColor: "#e11d48",
              categoryBg: "#fff1f2",
              categoryBorder: "#fecdd3",
              categoryIcon: "📍",
              subtitle:
                [
                  corp ? `Corp: ${corp}` : "",
                  ac ? `AC: ${ac}` : "",
                  wardId ? `ID: ${wardId}` : "",
                ]
                  .filter(Boolean)
                  .join(" • ") || "GBA Ward Boundary",
              feature: f,
            });
          });
        }

        // 3. GBA Corporations
        if (corpMod.default?.features) {
          corpMod.default.features.forEach((f, idx) => {
            const props = f.properties || {};
            const name = props.name || `Corporation ${idx + 1}`;
            const id = props.id || "";
            items.push({
              id: `corp_${idx}_${name}`,
              name: String(name).includes("Corporation")
                ? String(name).trim()
                : `${String(name).trim()} Corporation`,
              category: "corporation",
              categoryLabel: "GBA Corporation",
              categoryColor: "#db2777",
              categoryBg: "#fdf2f8",
              categoryBorder: "#fbcfe8",
              categoryIcon: "🏢",
              subtitle: id ? `Zone ID: ${id}` : "GBA City Corporation Zone",
              feature: f,
            });
          });
        }

        setSearchLayerItems(items);
      })
      .catch((err) =>
        console.error("Error loading searchable boundary layers:", err),
      );
  }, []);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        searchDropdownContainerRef.current &&
        !searchDropdownContainerRef.current.contains(e.target)
      ) {
        setIsSearchDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectBoundaryItem = (item) => {
    if (!mapRef.current || !item) return;
    setSearchError(null);

    // Remove previous single boundary highlight
    if (selectedBoundaryLayerRef.current) {
      mapRef.current.removeLayer(selectedBoundaryLayerRef.current);
      selectedBoundaryLayerRef.current = null;
    }

    setSelectedBoundaryItem(item);
    setLocationSearchQuery(item.name);
    setIsSearchDropdownOpen(false);

    const color =
      item.category === "assembly"
        ? "#2563eb"
        : item.category === "ward"
          ? "#e11d48"
          : "#db2777";
    const fillColor =
      item.category === "assembly"
        ? "#3b82f6"
        : item.category === "ward"
          ? "#f43f5e"
          : "#ec4899";

    const boundaryLayer = L.geoJSON(item.feature, {
      style: {
        color: color,
        weight: 3.5,
        opacity: 0.95,
        fillColor: fillColor,
        fillOpacity: 0.22,
      },
    }).addTo(mapRef.current);

    boundaryLayer
      .bindPopup(
        `
      <div style="font-family: system-ui, -apple-system, sans-serif; padding: 4px; text-align: left; min-width: 170px;">
        <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 2px 6px; border-radius: 4px; text-transform: uppercase; background-color: ${fillColor}20; color: ${color}; display: inline-block; margin-bottom: 4px;">
          ${item.categoryIcon} ${item.categoryLabel}
        </span>
        <h4 style="margin: 2px 0 3px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${item.name}</h4>
        <p style="margin: 0; font-size: 11px; color: #64748b;">${item.subtitle}</p>
      </div>
    `,
      )
      .openPopup();

    selectedBoundaryLayerRef.current = boundaryLayer;

    try {
      const bounds = boundaryLayer.getBounds();
      if (bounds.isValid()) {
        mapRef.current.flyToBounds(bounds, {
          padding: [50, 50],
          animate: true,
          duration: 1.2,
        });
      }
    } catch (e) {
      console.warn("Could not fit bounds to boundary:", e);
    }
  };

  const handleClearSelectedBoundary = () => {
    if (selectedBoundaryLayerRef.current && mapRef.current) {
      mapRef.current.removeLayer(selectedBoundaryLayerRef.current);
      selectedBoundaryLayerRef.current = null;
    }
    setSelectedBoundaryItem(null);
    setLocationSearchQuery("");
  };

  const filteredSearchItems = searchLayerItems.filter((item) => {
    if (
      selectedSearchCategory !== "all" &&
      item.category !== selectedSearchCategory
    ) {
      return false;
    }
    if (!locationSearchQuery.trim()) {
      return true;
    }
    const q = locationSearchQuery.toLowerCase().trim();
    return (
      item.name.toLowerCase().includes(q) ||
      item.subtitle.toLowerCase().includes(q) ||
      item.categoryLabel.toLowerCase().includes(q)
    );
  });

  const handleLocationSearch = (e) => {
    if (e) e.preventDefault();
    const query = locationSearchQuery.trim();
    if (!query) return;

    if (filteredSearchItems.length > 0) {
      handleSelectBoundaryItem(filteredSearchItems[0]);
    } else {
      setSearchError(
        `No boundary matching "${query}" found in Assemblies, Wards, or Corporations.`,
      );
    }
  };

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
          duration: 1,
        });
      }
    }
  };

  // ── Existing Interventions Multi-Dimensional Filter States ─────────
  // Mode: 'intervention' (Interventions Type) | 'site' (Site Type) | 'bgg' (BGG Type)
  const [interventionFilterMode, setInterventionFilterMode] =
    useState("intervention");

  // Option 1: Interventions Type (Full forms)
  const [selectedInterventionTypes, setSelectedInterventionTypes] = useState({
    lake: true,
    flood: true,
    groundwater: true,
    rainwater: true,
    iuwm: true,
    other: true,
  });

  // Option 2: Site Type (Parks, Lakes, Drains, Roads / Campuses)
  const [selectedSiteTypes, setSelectedSiteTypes] = useState({
    lake: true,
    park: true,
    drain: true,
    road: true,
  });

  // Option 3: BGG Framework (Blue, Green, Grey)
  const [selectedBGGTypes, setSelectedBGGTypes] = useState({
    blue: true,
    green: true,
    grey: true,
  });

  const assemblyConst2LayerRef = useRef(null);
  const bengaluruAssemblyLayerRef = useRef(null);
  const karnatakaAssemblyLayerRef = useRef(null);
  const wardsLayerGroupRef = useRef(null);
  const gbaWardsLayerRef = useRef(null);
  const gbaCorporationsLayerRef = useRef(null);
  const valleysLayerRef = useRef(null);
  const greenspacesLayerRef = useRef(null);
  const floodHazardLayerRef = useRef(null);
  const floodingHotspotsLayerRef = useRef(null);

  const [loadingAssemblyConst2, setLoadingAssemblyConst2] = useState(false);
  const [loadingBengaluruAssembly, setLoadingBengaluruAssembly] =
    useState(false);
  const [loadingKarnatakaAssembly, setLoadingKarnatakaAssembly] =
    useState(false);
  const [loadingGbaWards, setLoadingGbaWards] = useState(false);
  const [loadingGbaCorporations, setLoadingGbaCorporations] = useState(false);
  const [loadingValleys, setLoadingValleys] = useState(false);
  const [loadingGreenspaces, setLoadingGreenspaces] = useState(false);
  const [loadingFloodHazard, setLoadingFloodHazard] = useState(false);
  const [loadingFloodingHotspots, setLoadingFloodingHotspots] = useState(false);

  // Selected item (project or well) for full details panel
  const [selectedItem, setSelectedItem] = useState(null);

  // Search filter
  const [searchText, setSearchText] = useState("");

  // Fetch both projects and wells data on mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let loadedProjects = [];
      let loadedWells = [];
      let source = "API";

      try {
        console.log("📡 Fetching projects and wells from backend API...");
        const [projectsRes, wellsRes] = await Promise.all([
          api.get("/analytics/projects"),
          api.get("/analytics/wells"),
        ]);

        if (projectsRes.data && projectsRes.data.length > 0) {
          loadedProjects = projectsRes.data;
        }
        if (wellsRes.data && wellsRes.data.length > 0) {
          loadedWells = wellsRes.data;
        }

        if (loadedProjects.length === 0 && loadedWells.length === 0) {
          throw new Error("Backend returned empty datasets, falling back.");
        }
      } catch (err) {
        console.warn(
          "⚠️ Failed to load datasets from backend API, using local fallback CSVs:",
          err.message,
        );
        try {
          loadedProjects = parseCSV(v1ProjectsCsv);
          loadedWells = parseCSV(v1WellsCsv);
          source = "Local Fallback (CSV v1)";
        } catch (csvErr) {
          console.error("Failed to parse fallback CSVs:", csvErr);
          loadedProjects = localProjects;
          loadedWells = localWells;
          source = "Local Fallback (JSON)";
        }
      } finally {
        const parsedProjects = loadedProjects
          .map(normalizeProject)
          .filter(
            (p) =>
              p.lat !== null &&
              p.lng !== null &&
              !isNaN(p.lat) &&
              !isNaN(p.lng),
          );

        const parsedWells = loadedWells
          .map(normalizeWell)
          .filter(
            (w) =>
              w.lat !== null &&
              w.lng !== null &&
              !isNaN(w.lat) &&
              !isNaN(w.lng),
          );

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
      zoomControl: false,
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    L.tileLayer(
      "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
        maxZoom: 19,
      },
    ).addTo(map);

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
      floodHazardLayerRef.current = null;
      floodingHotspotsLayerRef.current = null;
    };
  }, []);

  // Load and render boundaries layers dynamically
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const getFloodHazardStyle = (floodMean) => {
      if (floodMean === null || floodMean === undefined || isNaN(floodMean)) {
        return {
          color: "#94a3b8",
          fillColor: "#cbd5e1",
          fillOpacity: 0.35,
          level: "Unrated",
          range: "N/A",
          badgeColor: "#475569",
          badgeBg: "#f1f5f9",
        };
      }
      // 1. Red: 0.543 - 0.667 (Very High)
      if (floodMean >= 0.543) {
        return {
          color: "#b91c1c",
          fillColor: "#ef4444",
          fillOpacity: 0.65,
          level: "Very High Hazard",
          range: "0.543 – 0.667",
          badgeColor: "#991b1b",
          badgeBg: "#fee2e2",
        };
      }
      // 2. Orange: 0.497 - 0.543 (High)
      if (floodMean >= 0.497) {
        return {
          color: "#c2410c",
          fillColor: "#f97316",
          fillOpacity: 0.58,
          level: "High Hazard",
          range: "0.497 – 0.543",
          badgeColor: "#c2410c",
          badgeBg: "#ffedd5",
        };
      }
      // 3. Light Yellow: 0.456 - 0.497 (Moderate)
      if (floodMean >= 0.456) {
        return {
          color: "#ca8a04",
          fillColor: "#fde047",
          fillOpacity: 0.55,
          level: "Moderate Hazard",
          range: "0.456 – 0.497",
          badgeColor: "#854d0e",
          badgeBg: "#fef9c3",
        };
      }
      // 4. Light Green: 0.416 - 0.456 (Low)
      if (floodMean >= 0.416) {
        return {
          color: "#4d7c0f",
          fillColor: "#84cc16",
          fillOpacity: 0.5,
          level: "Low Hazard",
          range: "0.416 – 0.456",
          badgeColor: "#3f6212",
          badgeBg: "#ecfccb",
        };
      }
      // 5. Green: 0.000 - 0.416 (Very Low)
      return {
        color: "#14532d",
        fillColor: "#16a34a",
        fillOpacity: 0.45,
        level: "Very Low Hazard",
        range: "0.000 – 0.416",
        badgeColor: "#14532d",
        badgeBg: "#dcfce7",
      };
    };

    const addGeoJsonLayer = (
      data,
      layerRef,
      color,
      layerType = "assembly",
      weight = 2,
      fillOpacity = 0.05,
    ) => {
      if (layerRef.current) return;

      const layer = L.geoJSON(data, {
        smoothFactor: 0,
        style: (feature) => {
          if (layerType === "flood_hazard") {
            const hazard = getFloodHazardStyle(feature?.properties?._Floodmean);
            return {
              color: hazard.color,
              weight: 1.0,
              opacity: 0.9,
              fillColor: hazard.fillColor,
              fillOpacity: hazard.fillOpacity,
            };
          }
          return {
            color: color,
            weight: weight,
            opacity: 0.65,
            fillColor: color,
            fillOpacity: fillOpacity,
          };
        },
        onEachFeature: (feature, leafletLayer) => {
          const props = feature.properties || {};
          let popupContent = "";

          if (layerType === "flood_hazard") {
            const floodMean = props._Floodmean;
            const hazard = getFloodHazardStyle(floodMean);

            const corpsList =
              props.corporations && props.corporations.length > 0
                ? props.corporations.join(", ")
                : props.corporations_str || props.corporation || "BBMP";

            const wardsList =
              props.wards && props.wards.length > 0
                ? props.wards.join(", ")
                : props.wards_str || props.wardName || "N/A";

            popupContent = `
              <div class="font-sans min-w-[220px] max-w-[280px] bg-white text-slate-800 text-left">
                <div style="background-color: ${hazard.fillColor};" class="px-3.5 py-2.5 pr-8 border-b border-black/10">
                  <h4 class="m-0 text-sm font-black text-black tracking-tight leading-tight">Flood Hazard Index</h4>
                </div>
                <div class="p-3 flex flex-col gap-2 text-xs leading-normal">
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Corporation Name:</span>
                    <span class="font-bold text-slate-900 text-[11.5px]">${corpsList}</span>
                  </div>
                  <div class="flex flex-col gap-0.5">
                    <span class="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Ward Name:</span>
                    <span class="font-semibold text-slate-800 text-[11.5px]">${wardsList}</span>
                  </div>
                  <div class="flex items-center justify-between pt-1.5 border-t border-slate-100">
                    <span class="font-semibold text-slate-600">Flood Index:</span>
                    <strong class="font-bold text-slate-900 text-xs">${typeof floodMean === "number" ? floodMean.toFixed(3) : "—"}</strong>
                  </div>
                  <div class="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span class="font-semibold text-slate-600">Hazard Class:</span>
                    <span style="background-color: ${hazard.fillColor}25; color: ${hazard.color}; border: 1px solid ${hazard.color}50;" class="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md">
                      ${hazard.level}
                    </span>
                  </div>
                </div>
              </div>
            `;

            leafletLayer.bindPopup(popupContent, {
              className: "flood-hazard-popup-container",
              closeButton: true,
            });

            leafletLayer.on("popupopen", (e) => {
              const popupEl = e.popup.getElement();
              if (popupEl) {
                const wrapper = popupEl.querySelector(
                  ".leaflet-popup-content-wrapper",
                );
                const content = popupEl.querySelector(".leaflet-popup-content");
                const tip = popupEl.querySelector(".leaflet-popup-tip");
                const closeBtn = popupEl.querySelector(
                  ".leaflet-popup-close-button",
                );

                if (wrapper) {
                  wrapper.className +=
                    " !p-0 !rounded-xl !overflow-hidden !shadow-2xl !bg-white";
                  wrapper.style.border = "1px solid rgba(0,0,0,0.1)";
                }
                if (content) {
                  content.className += " !m-0 !leading-relaxed";
                }
                if (tip) {
                  tip.className += " !bg-white";
                }
                if (closeBtn) {
                  closeBtn.className +=
                    " !text-black !top-2 !right-2.5 !font-black !text-base !p-0 !w-5 !h-5 !flex !items-center !justify-center hover:!opacity-70";
                }
              }
            });
          } else if (layerType === "gba_wards") {
            const wardName = props.wardName || "Unknown Ward";
            const wardNameKn = props.wardNameKn || "";
            const wardId = props.wardId || "N/A";
            const ac = props.ac || "N/A";
            const corp = props.corporation || "N/A";
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">GBA WARD BOUNDARY</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${wardName}</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🏢 Corporation: <strong>${corp}</strong></p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">🗳️ Assembly: <strong>${ac}</strong></p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">🔑 Ward ID: <strong>${wardId}</strong></p>
              </div>
            `;
            leafletLayer.bindPopup(popupContent);
          } else if (layerType === "gba_corporations") {
            const name = props.name || "Unknown Corporation";
            const id = props.id || "N/A";
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">GBA CORPORATION</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name} Zone</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🔑 Zone ID: <strong>${id}</strong></p>
              </div>
            `;
            leafletLayer.bindPopup(popupContent);
          } else if (layerType === "valleys") {
            const name = props.name || "Unknown Valley";
            const area = props.area ? (props.area / 1000000).toFixed(2) : "N/A";
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">VALLEY WATERSHED</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name}</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">📐 Catchment Area: <strong>${area} km²</strong></p>
              </div>
            `;
            leafletLayer.bindPopup(popupContent);
          } else if (layerType === "greenspaces") {
            const name = props.name || "Unnamed Greenspace";
            const nameKn = props.nameKn || "";
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">GREENSPACE / RESERVOIR</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${name} ${nameKn ? `(${nameKn})` : ""}</h4>
              </div>
            `;
            leafletLayer.bindPopup(popupContent);
          } else {
            const acName =
              props.AC_NAME ||
              props.ac_name ||
              props.Name ||
              "Unknown Assembly";
            const acNameKn = props.AC_NAME_KN || "";
            const acCode = props.AC_CODE || props.ac_code || "N/A";
            const district = props.KGISDistri || props.district || "N/A";
            popupContent = `
              <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif;">
                <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">ASSEMBLY BOUNDARY</span>
                <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 700; color: #0f172a;">${acName}</h4>
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #64748b;">🔑 AC Code: <strong>${acCode}</strong></p>
                <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">📍 District Code: <strong>${district}</strong></p>
              </div>
            `;
            leafletLayer.bindPopup(popupContent);
          }

          leafletLayer.on("click", () => {
            const props = feature.properties || {};
            let regionName =
              props.AC_NAME ||
              props.ac_name ||
              props.Name ||
              props.wardName ||
              props.name ||
              "Unknown Region";

            // 1. Spatial matching using geometry
            const matchingWells = (wellsRef.current || []).filter((w) =>
              isPointInGeometry(w.lat, w.lng, feature.geometry),
            );
            const matchingProjects = (projectsRef.current || []).filter((p) =>
              isPointInGeometry(p.lat, p.lng, feature.geometry),
            );

            // 2. Attribute-based matching as fallback/addition
            let attrMatchingWells = [];
            let attrMatchingProjects = [];

            if (layerType === "gba_wards") {
              const wName = (props.wardName || "").toLowerCase().trim();
              const wId = String(props.wardId || "").trim();
              attrMatchingWells = (wellsRef.current || []).filter(
                (w) =>
                  (w.wardName && w.wardName.toLowerCase().trim() === wName) ||
                  (w.wardId && String(w.wardId).trim() === wId),
              );
              attrMatchingProjects = (projectsRef.current || []).filter(
                (p) =>
                  (p.wardName && p.wardName.toLowerCase().trim() === wName) ||
                  (p.wardId && String(p.wardId).trim() === wId),
              );
            } else if (layerType === "gba_corporations") {
              const corpName = (props.name || "").toLowerCase().trim();
              attrMatchingWells = (wellsRef.current || []).filter(
                (w) =>
                  w.corporation &&
                  w.corporation.toLowerCase().trim().includes(corpName),
              );
              attrMatchingProjects = (projectsRef.current || []).filter(
                (p) =>
                  p.corporation &&
                  p.corporation.toLowerCase().trim().includes(corpName),
              );
            } else if (layerType === "assembly") {
              const acName = (
                props.AC_NAME ||
                props.ac_name ||
                props.Name ||
                ""
              )
                .toLowerCase()
                .trim();
              attrMatchingWells = (wellsRef.current || []).filter(
                (w) => w.ac && w.ac.toLowerCase().trim() === acName,
              );
              attrMatchingProjects = (projectsRef.current || []).filter(
                (p) => p.ac && p.ac.toLowerCase().trim() === acName,
              );
            }

            // Union matching lists (deduplicating by identifier)
            const getUniqueAssets = (spatialList, attrList) => {
              const map = new Map();
              spatialList.forEach((item) =>
                map.set(
                  item._id || item._mb_row_id || item.wellName || item.projName,
                  item,
                ),
              );
              attrList.forEach((item) =>
                map.set(
                  item._id || item._mb_row_id || item.wellName || item.projName,
                  item,
                ),
              );
              return Array.from(map.values());
            };

            const finalWells = getUniqueAssets(
              matchingWells,
              attrMatchingWells,
            );
            const finalProjects = getUniqueAssets(
              matchingProjects,
              attrMatchingProjects,
            );

            console.log(
              `%c🗺️ [REGION LAYER CLICK] - Type: ${layerType.toUpperCase()}`,
              "color: #0284c7; font-weight: bold; font-size: 14px;",
            );
            console.log("Region Name:", regionName);
            const filteredProps = { ...props };
            delete filteredProps.wardNameKn;
            delete filteredProps.acKn;
            console.log("Region Properties:", filteredProps);
            console.log(
              `Assets present in this region (Total: ${finalWells.length + finalProjects.length}):`,
            );
            console.log(`- Wells (${finalWells.length}):`, finalWells);
            console.log(`- Projects (${finalProjects.length}):`, finalProjects);
          });

          leafletLayer.on("mouseover", () => {
            if (layerType === "flood_hazard") {
              leafletLayer.setStyle({
                fillOpacity: 0.85,
                weight: 1.0,
              });
            } else {
              leafletLayer.setStyle({
                fillOpacity: fillOpacity + 0.08,
                weight: weight + 1,
              });
            }
          });

          leafletLayer.on("mouseout", () => {
            if (layerType === "flood_hazard") {
              const hazard = getFloodHazardStyle(
                feature?.properties?._Floodmean,
              );
              leafletLayer.setStyle({
                fillOpacity: hazard.fillOpacity,
                weight: 1.0,
              });
            } else {
              leafletLayer.setStyle({
                fillOpacity: fillOpacity,
                weight: weight,
              });
            }
          });
        },
      }).addTo(map);

      layerRef.current = layer;

      // Fit map boundaries automatically
      try {
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.flyToBounds(bounds, {
            padding: [40, 40],
            animate: true,
            duration: 1.2,
          });
        }
      } catch (e) {
        console.warn("Could not zoom to layer bounds:", e);
      }
    };

    // Layer 1: assemblyConst2 (General Assembly Boundaries)
    if (showAssemblyConst2) {
      if (!assemblyConst2LayerRef.current) {
        setLoadingAssemblyConst2(true);
        import("../../data/assembly_const2/assembly_const2.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              assemblyConst2LayerRef,
              "#a855f7",
              "assembly",
              1.8,
              0.06,
            ); // Violet
            setLoadingAssemblyConst2(false);
          })
          .catch((err) => {
            console.error("Failed to load Assembly Boundaries layer:", err);
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
    if (showBengaluruAssembly) {
      if (!bengaluruAssemblyLayerRef.current) {
        setLoadingBengaluruAssembly(true);
        import("../../data/assembly_const2/bengaluru_assembly_const.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              bengaluruAssemblyLayerRef,
              "#3b82f6",
              "assembly",
              1.8,
              0.06,
            ); // Blue
            setLoadingBengaluruAssembly(false);
          })
          .catch((err) => {
            console.error(
              "Failed to load Bengaluru Assembly Boundaries layer:",
              err,
            );
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
        import("../../data/assembly_const2/karnataka_assembly_const.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              karnatakaAssemblyLayerRef,
              "#10b981",
              "assembly",
              1.2,
              0.03,
            ); // Green
            setLoadingKarnatakaAssembly(false);
          })
          .catch((err) => {
            console.error(
              "Failed to load Karnataka Assembly Boundaries layer:",
              err,
            );
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
        import("../../data/gba_wards.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              gbaWardsLayerRef,
              "#f43f5e",
              "gba_wards",
              1.8,
              0.06,
            ); // Rose
            setLoadingGbaWards(false);
          })
          .catch((err) => {
            console.error("Failed to load GBA Wards Boundaries layer:", err);
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
        import("../../data/gba_corporations.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              gbaCorporationsLayerRef,
              "#ec4899",
              "gba_corporations",
              1.8,
              0.06,
            ); // Pink
            setLoadingGbaCorporations(false);
          })
          .catch((err) => {
            console.error("Failed to load GBA Corporations layer:", err);
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
        import("../../data/valleys.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              valleysLayerRef,
              "#06b6d4",
              "valleys",
              1.8,
              0.06,
            ); // Cyan
            setLoadingValleys(false);
          })
          .catch((err) => {
            console.error("Failed to load Valleys layer:", err);
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
        import("../../data/greenspaces.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              greenspacesLayerRef,
              "#15803d",
              "greenspaces",
              1.5,
              0.22,
            ); // Forest Green
            setLoadingGreenspaces(false);
          })
          .catch((err) => {
            console.error("Failed to load Greenspaces layer:", err);
            setLoadingGreenspaces(false);
          });
      }
    } else {
      if (greenspacesLayerRef.current) {
        map.removeLayer(greenspacesLayerRef.current);
        greenspacesLayerRef.current = null;
      }
    }

    // Layer 8: Flood Hazard Map (JasinS)
    if (showNewFloodRisk) {
      if (!floodHazardLayerRef.current) {
        setLoadingFloodHazard(true);
        import("../../data/flood_hazard_jasin.json")
          .then((mod) => {
            addGeoJsonLayer(
              mod.default,
              floodHazardLayerRef,
              "#ef4444",
              "flood_hazard",
              1.5,
              0.48,
            );
            setLoadingFloodHazard(false);
          })
          .catch((err) => {
            console.error("Failed to load Flood Hazard Map layer:", err);
            setLoadingFloodHazard(false);
          });
      }
    } else {
      if (floodHazardLayerRef.current) {
        map.removeLayer(floodHazardLayerRef.current);
        floodHazardLayerRef.current = null;
      }
    }

    // Layer 9: Flooding Hotspots (Points + Delineated Catchment Boundary)
    if (showFloodingHotspots) {
      if (!floodingHotspotsLayerRef.current) {
        setLoadingFloodingHotspots(true);
        Promise.all([
          import("../../data/flood_points.json"),
          import("../../data/borewell_road_delineation.json"),
        ])
          .then(([pointsMod, delineationMod]) => {
            const geojsonData = pointsMod.default;
            const delineationData = delineationMod.default;
            const pointsGroup = L.layerGroup();

            // 1. Render Delineated Catchment Boundary Polygon
            if (delineationData) {
              const boundaryLayer = L.geoJSON(delineationData, {
                style: {
                  color: "#d97706",
                  weight: 2.5,
                  opacity: 0.9,
                  dashArray: "6, 6",
                  fillColor: "#f59e0b",
                  fillOpacity: 0.22,
                },
                onEachFeature: (feat, layer) => {
                  const props = feat.properties || {};
                  layer.bindPopup(`
                    <div style="font-family: system-ui, -apple-system, sans-serif; text-align: left; min-width: 230px; max-width: 290px; padding: 4px;">
                      <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; background: #fef3c7; color: #92400e; text-transform: uppercase;">
                        DELINEATED CATCHMENT BOUNDARY
                      </span>
                      <h4 style="margin: 4px 0 2px 0; font-size: 13.5px; font-weight: 750; color: #0f172a;">
                        ${props.name || "Borewell Road Catchment Boundary"}
                      </h4>
                      <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
                        🏢 Zone: <strong>${props.zone || "Mahadevapura / Whitefield"}</strong>
                      </p>
                      <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
                        📐 Type: <strong>${props.type || "Delineated Flood Micro-Basin"}</strong>
                      </p>
                      <p style="margin: 6px 0 0 0; font-size: 10.5px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; line-height: 1.4;">
                        ${props.description || "Hydrologically delineated micro-catchment boundary for the Borewell Road flooding hotspot."}
                      </p>
                    </div>
                  `);
                },
              });
              boundaryLayer.addTo(pointsGroup);
            }

            // 2. Render 201 Flood Hotspot Points
            geojsonData.features.forEach((feat) => {
              const props = feat.properties || {};
              const lat = props.lat;
              const lng = props.lng;
              if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

              const isHigh =
                props.vulnerabilityLevel === "High" ||
                props.vulnerabilityCode === "H";
              const color = isHigh ? "#ef4444" : "#f59e0b";
              const fillColor = isHigh ? "#dc2626" : "#d97706";
              const badgeBg = isHigh ? "#fee2e2" : "#fef3c7";
              const badgeColor = isHigh ? "#991b1b" : "#92400e";

              const marker = L.circleMarker([lat, lng], {
                radius: isHigh ? 8 : 6.5,
                fillColor: fillColor,
                color: "#ffffff",
                weight: 2,
                opacity: 0.95,
                fillOpacity: 0.85,
              });

              const popupHtml = `
                <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif; min-width: 220px; max-width: 280px;">
                  <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${badgeBg}; color: ${badgeColor};">
                    ${isHigh ? "🚨 HIGH VULNERABILITY" : "⚠️ MODERATE VULNERABILITY"}
                  </span>
                  <h4 style="margin: 0 0 4px 0; font-size: 13.5px; font-weight: 750; color: #0f172a; line-height: 1.3;">
                    ${props.location || "Unnamed Hotspot"}
                  </h4>
                  <p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">
                    🏢 Zone: <strong style="color: #334155;">${props.zone || "N/A"}</strong>
                  </p>
                  ${
                    props.remarks
                      ? `
                    <div style="margin: 6px 0 0 0; font-size: 11px; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
                      <strong>Remarks / Status:</strong><br/>
                      <span style="color: #64748b;">${props.remarks}</span>
                    </div>
                  `
                      : ""
                  }
                  ${
                    props.vulnerabilityMeasure
                      ? `
                    <p style="margin: 4px 0 0 0; font-size: 10.5px; color: #64748b;">
                      📏 Measure: <strong>${props.vulnerabilityMeasure}</strong>
                    </p>
                  `
                      : ""
                  }
                  ${
                    props.reducedLevel
                      ? `
                    <p style="margin: 2px 0 0 0; font-size: 10.5px; color: #64748b;">
                      📐 Reduced Level (RL): <strong>${props.reducedLevel} m</strong>
                    </p>
                  `
                      : ""
                  }
                  <p style="margin: 6px 0 0 0; font-size: 9.5px; color: #94a3b8; border-top: 1px dashed #e2e8f0; padding-top: 4px;">
                    📍 Lat: ${lat.toFixed(5)}°, Lng: ${lng.toFixed(5)}°
                  </p>
                </div>
              `;

              marker.bindPopup(popupHtml);
              marker.addTo(pointsGroup);
            });

            pointsGroup.addTo(map);
            floodingHotspotsLayerRef.current = pointsGroup;
            setLoadingFloodingHotspots(false);
          })
          .catch((err) => {
            console.error("Failed to load Flooding Hotspots layer:", err);
            setLoadingFloodingHotspots(false);
          });
      }
    } else {
      if (floodingHotspotsLayerRef.current) {
        map.removeLayer(floodingHotspotsLayerRef.current);
        floodingHotspotsLayerRef.current = null;
      }
    }
  }, [
    showAssemblyConst2,
    showBengaluruAssembly,
    showKarnatakaAssembly,
    showGbaWards,
    showGbaCorporations,
    showValleys,
    showGreenspaces,
    showNewFloodRisk,
    showFloodingHotspots,
  ]);

  // Clear selected item if corresponding layer is unchecked
  useEffect(() => {
    if (!selectedItem) return;
    if (selectedItem.isSiteProject && !showNewProjects) {
      setSelectedItem(null);
    } else if (
      selectedItem.projName !== undefined &&
      !selectedItem.isSiteProject &&
      !showProjects
    ) {
      setSelectedItem(null);
    } else if (selectedItem.wellName !== undefined && !showWells) {
      setSelectedItem(null);
    }
  }, [showWells, showProjects, showNewProjects]);

  // Aggregate loaded wells and projects to build a Wards summary water profile
  const getWardsSummary = () => {
    const wardMap = {};

    wells.forEach((w) => {
      const name = w.wardName;
      if (!name || name.toLowerCase().includes("unknown") || name.trim() === "")
        return;
      if (!wardMap[name]) {
        wardMap[name] = {
          wardName: name,
          wardNameKn: w.wardNameKn || "",
          wardId: w.wardId || "",
          corporation: w.corporation || "",
          wellsCount: 0,
          projectsCount: 0,
          lats: [],
          lngs: [],
        };
      }
      wardMap[name].wellsCount += 1;
      if (w.lat && w.lng) {
        wardMap[name].lats.push(w.lat);
        wardMap[name].lngs.push(w.lng);
      }
    });

    projects.forEach((p) => {
      const name = p.wardName;
      if (!name || name.toLowerCase().includes("unknown") || name.trim() === "")
        return;
      if (!wardMap[name]) {
        wardMap[name] = {
          wardName: name,
          wardNameKn: p.wardNameKn || "",
          wardId: p.wardId || "",
          corporation: p.corporation || "",
          wellsCount: 0,
          projectsCount: 0,
          lats: [],
          lngs: [],
        };
      }
      wardMap[name].projectsCount += 1;
      if (p.lat && p.lng) {
        wardMap[name].lats.push(p.lat);
        wardMap[name].lngs.push(p.lng);
      }
    });

    const summaries = [];
    Object.values(wardMap).forEach((w) => {
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
        lng: avgLng,
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

    wardsSummary.forEach((w) => {
      const {
        lat,
        lng,
        wardName,
        wardNameKn,
        wardId,
        corporation,
        wellsCount,
        projectsCount,
      } = w;
      const totalCount = wellsCount + projectsCount;
      const radius = Math.min(22, Math.max(9, 7 + totalCount * 0.7));
      const color = "#d97706"; // Gold/Amber color

      const marker = L.circleMarker([lat, lng], {
        radius: radius,
        fillColor: color,
        color: "#ffffff",
        weight: 2,
        opacity: 0.9,
        fillOpacity: 0.8,
      });

      marker.bindPopup(`
        <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif; width: 220px;">
          <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}15; color: ${color};">WARD WATER PROFILE</span>
          <h4 style="margin: 4px 0 0 0; font-size: 13px; font-weight: 750; color: #0f172a;">${wardName}</h4>
          ${wardNameKn ? `<p style="margin: 2px 0 0 0; font-size: 11px; color: #64748b;">${wardNameKn}</p>` : ""}
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #475569;">🔑 Ward ID: <strong>${wardId || "N/A"}</strong></p>
          <p style="margin: 2px 0 0 0; font-size: 11px; color: #475569;">🏢 Corp: <strong>${corporation || "N/A"}</strong></p>
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

      marker.on("click", () => {
        const matchingWells = (wellsRef.current || []).filter(
          (well) => well.wardName === wardName,
        );
        const matchingProjects = (projectsRef.current || []).filter(
          (p) => p.wardName === wardName,
        );

        console.log(
          `%c🟡 [WARD SUMMARY CLICK] - Ward: ${wardName}`,
          "color: #d97706; font-weight: bold; font-size: 14px;",
        );
        console.log("Ward Info:", {
          wardName,
          wardNameKn,
          wardId,
          corporation,
        });
        console.log(
          `Assets in this Ward (Total: ${matchingWells.length + matchingProjects.length}):`,
        );
        console.log(`- Wells (${matchingWells.length}):`, matchingWells);
        console.log(
          `- Projects (${matchingProjects.length}):`,
          matchingProjects,
        );
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
        duration: 1.2,
      });
    }
  }, [showWards, wells, projects, loading]);

  // Color mappings - matching the layer checkboxes exactly for differentiation
  const getProjectColor = (status, tags) => {
    if (tags) {
      return getProjectCategoryInfo(tags).color;
    }
    return "#3b82f6"; // Premium blue color matching projects checkbox
  };

  const getWellColor = (wellType) => {
    return "#a855f7"; // Violet/purple color matching wells checkbox
  };

  // Filter Items - Merging Wells and Projects cleanly based on checked states
  const getFilteredItems = () => {
    let items = [];
    const search = searchText.toLowerCase();

    if (showWells) {
      const filteredWells = wells.filter((w) => {
        const matchesSearch =
          w.wellName.toLowerCase().includes(search) ||
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

        let matchesFilter = true;
        if (interventionFilterMode === "intervention") {
          const categoryId = p.categoryInfo?.id || "other";
          matchesFilter = selectedInterventionTypes[categoryId] === true;
        } else if (interventionFilterMode === "site") {
          const siteId = p.siteTypeInfo?.id || "road";
          matchesFilter = selectedSiteTypes[siteId] === true;
        } else if (interventionFilterMode === "bgg") {
          const bggId = p.bggTypeInfo?.id || "grey";
          matchesFilter = selectedBGGTypes[bggId] === true;
        }

        if (activeWatershedId) {
          const hasMatchingId = p.watershedId === activeWatershedId;
          const wsCoords = WATERSHEDS_POLYGONS[activeWatershedId].coords;
          const isInsidePolygon = pointInPolygon(p.lat, p.lng, wsCoords);
          return (
            matchesSearch &&
            matchesFilter &&
            (hasMatchingId || isInsidePolygon)
          );
        }

        return matchesSearch && matchesFilter;
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
          dashArray: "5, 5",
        }).addTo(map);

        activeWatershedLayerRef.current = polygon;
        map.fitBounds(polygon.getBounds(), { padding: [40, 40] });

        const linesGroup = L.layerGroup().addTo(map);
        const spot = FLOOD_SPOTS_DATA.find((s) => s.id === activeFloodSpotId);
        if (spot) {
          const matchingProjects = NEW_PROJECTS_DATA.filter(
            (p) => p.watershedId === activeWatershedId,
          );
          matchingProjects.forEach((proj) => {
            L.polyline(
              [
                [spot.lat, spot.lng],
                [proj.lat, proj.lng],
              ],
              {
                color: "#ef4444",
                weight: 1.5,
                opacity: 0.6,
                dashArray: "4, 4",
              },
            ).addTo(linesGroup);
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
      const badgeLabel = isProj ? "PROJECT" : "WELL";
      const color = isProj
        ? getProjectColor(item.status, item.tags)
        : getWellColor(item.wellType);

      let marker;
      if (isProj) {
        const pinIcon = L.divIcon({
          className: "custom-leaflet-pin-container",
          html: `
            <div class="pin-marker-wrapper animate-bounce-in">
              <svg class="pin-svg" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M16 0C7.16 0 0 7.16 0 16C0 26.6 14.8 41.1 15.4 41.7C15.7 42 16.3 42 16.6 41.7C17.2 41.1 32 26.6 32 16C32 7.16 24.8 0 16 0Z" fill="${color}"/>
                <circle cx="16" cy="16" r="10" fill="#ffffff" />
                <text x="16" y="16" fill="#0f172a" font-size="12px" font-family="system-ui, -apple-system, BlinkMacSystemFont, sans-serif" text-anchor="middle" dominant-baseline="central">${item.categoryInfo?.icon || "🌱"}</text>
              </svg>
            </div>
          `,
          iconSize: [32, 42],
          iconAnchor: [16, 42],
          popupAnchor: [0, -42],
        });
        marker = L.marker([lat, lng], { icon: pinIcon });
      } else {
        marker = L.circleMarker([lat, lng], {
          radius: 7,
          fillColor: color,
          color: "#ffffff",
          weight: 1.5,
          opacity: 1,
          fillOpacity: 0.85,
        });
      }

      marker.bindPopup(`
        <div style="display: flex; flex-direction: column; text-align: left; padding: 4px; font-family: system-ui, -apple-system, sans-serif; min-width: 200px;">
          <span style="font-size: 8.5px; font-weight: 800; letter-spacing: 0.5px; padding: 3px 6px; border-radius: 4px; align-self: flex-start; margin-bottom: 6px; text-transform: uppercase; background-color: ${color}20; color: ${color};">${badgeLabel}: ${String(type || "UNSPECIFIED").toUpperCase()}</span>
          <h4 style="font-size: 13.5px; font-weight: 750; color: #0f172a; margin: 0 0 4px 0;">${name}</h4>
          <p style="font-size: 11px; color: #64748b; margin: 0 0 6px 0;">📍 ${item.wardName || "Unknown Ward"}</p>
          ${
            isProj
              ? `
            <div style="display: flex; flex-direction: column; gap: 3px; font-size: 10.5px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px; margin-bottom: 8px;">
              <span style="color: #475569;">🏷️ <strong>Intervention:</strong> <strong style="color: ${color};">${item.categoryInfo?.name || "Standard Solution"}</strong></span>
              <span style="color: #475569;">📍 <strong>Site Type:</strong> <strong style="color: #0f172a;">${item.siteTypeInfo?.name || "General Site"}</strong></span>
              <span style="color: #475569;">🎨 <strong>BGG:</strong> <strong style="color: ${item.bggTypeInfo?.color || "#0284c7"};">${item.bggTypeInfo?.name || "Blue Infrastructure"}</strong></span>
            </div>
          `
              : ""
          }
          ${
            isProj
              ? `
            <button onclick="window.openInterventionDetailInPlace && window.openInterventionDetailInPlace()" style="display: block; width: 100%; border: none; background-color: ${color}; color: white !important; text-align: center; padding: 7px; border-radius: 6px; font-size: 11.5px; font-weight: 750; cursor: pointer; box-shadow: 0 2px 4px ${color}20;">
              View Details →
            </button>
          `
              : ""
          }
          <span style="font-size: 9.5px; color: #94a3b8; display: block; margin-top: 6px; font-weight: 600;">Click point for full telemetry</span>
        </div>
      `);

      marker.on("click", () => {
        setSelectedItem(item);
        map.setView([lat, lng], 14);

        console.log(
          `%c📍 [ASSET CLICK] - Type: ${badgeLabel}`,
          `color: ${color}; font-weight: bold; font-size: 14px;`,
        );
        console.log("Asset Details:", item);
      });

      marker.addTo(markersGroup);
      boundsPoints.push([lat, lng]);
    });

    if (showNewProjects) {
      // ── Use live data from /api/sites ─────────────────────────────────────
      console.log(
        "🔄 Toggled Projects layer ON. Rendering all sites:",
        sitesData,
      );
      const liveProjects = sitesData.filter(
        (site) => site.latitude != null && site.longitude != null,
      );

      const visibleSites = activeWatershedId
        ? liveProjects.filter((site) => {
            const wsCoords = WATERSHEDS_POLYGONS[activeWatershedId]?.coords;
            return wsCoords
              ? pointInPolygon(site.latitude, site.longitude, wsCoords)
              : true;
          })
        : liveProjects;

      const SITE_COLOR = {
        lake: "#3b82f6",
        park: "#22c55e",
        stormdrain: "#94a3b8",
        campus: "#f59e0b",
      };
      const SITE_ICON = {
        lake: "🔵",
        park: "🟢",
        stormdrain: "⚫",
        campus: "🏢",
      };

      visibleSites.forEach((site) => {
        const lat = site.latitude;
        const lng = site.longitude;
        if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

        const color = SITE_COLOR[site.type] || "#3b82f6";
        const typeIcon = SITE_ICON[site.type] || "📍";
        const ivCount = (site.interventions || []).length;
        const ivList = (site.interventions || [])
          .map(
            (iv) =>
              `<li style="margin:2px 0">${iv.type.replace(/_/g, " ")}${iv.quantity ? ` ×${iv.quantity}` : ""}</li>`,
          )
          .join("");

        const marker = L.circleMarker([lat, lng], {
          radius: 9,
          fillColor: color,
          color: "#ffffff",
          weight: 2.5,
          opacity: 1,
          fillOpacity: 0.92,
        });

        const siteImg = getProjectImage(site);
        const imageHeader = siteImg
          ? `
          <div style="width:100%;height:105px;margin-bottom:8px;border-radius:8px;overflow:hidden;background:#f1f5f9;position:relative;box-shadow:0 1px 3px rgba(0,0,0,0.08);">
            <img 
              src="${siteImg}" 
              alt="${site.name}" 
              style="width:100%;height:100%;object-fit:cover;display:block;" 
              onerror="this.parentElement.style.display='none';" 
            />
          </div>
        `
          : "";

        const viewMoreBtn = `<button onclick="window.openSiteDetailInPlace && window.openSiteDetailInPlace('${site.site_id}')" style="display:block;width:100%;margin-top:8px;border:none;background-color:${color};color:white!important;text-align:center;padding:6px 10px;border-radius:6px;font-size:11px;font-weight:750;cursor:pointer;box-shadow:0 2px 4px rgba(0,0,0,0.1);">View Details →</button>`;

        marker.bindPopup(`
          <div style="display:flex;flex-direction:column;text-align:left;padding:4px;font-family:system-ui,-apple-system,sans-serif;min-width:200px;max-width:240px">
            ${imageHeader}
            <span style="font-size:8.5px;font-weight:800;letter-spacing:0.5px;padding:3px 6px;border-radius:4px;align-self:flex-start;margin-bottom:6px;text-transform:uppercase;background-color:${color}20;color:${color}">${typeIcon} ${(site.type || "SITE").toUpperCase()}</span>
            <h4 style="font-size:13.5px;font-weight:750;color:#0f172a;margin:0 0 4px 0">${site.name}</h4>
            ${site.watershed ? `<p style="font-size:11px;color:#64748b;margin:0 0 4px 0">🌊 ${site.watershed}</p>` : ""}
            <p style="font-size:11px;color:#475569;margin:0 0 6px 0">🔧 <strong>${ivCount}</strong> intervention${ivCount !== 1 ? "s" : ""}</p>
            ${viewMoreBtn}
          </div>
        `);

        marker.on("click", () => {
          setSelectedItem({
            isSiteProject: true,
            site_id: site.site_id,
            name: site.name,
            type: site.type,
            lat,
            lng,
            watershed: site.watershed || "",
            site_level_impact: site.site_level_impact || "",
            subcatchment_level_impact: site.subcatchment_level_impact || "",
            interventions: site.interventions || [],
            linked_intervention_ids: site.linked_intervention_ids || [],
            image_url: siteImg,
            categoryInfo: {
              id: site.type,
              name: site.name,
              color: color,
              icon: typeIcon,
            },
            _raw: site,
          });
          map.setView([lat, lng], 14);

          // ── Console output when a project marker is clicked ─────────────
          console.group(
            `%c📍 [PROJECT MARKER CLICK] ${site.name}`,
            `color:${color};font-weight:bold;font-size:14px;`,
          );
          console.log("Site ID:     ", site.site_id);
          console.log("Type:        ", site.type);
          console.log("Watershed:   ", site.watershed || "—");
          console.log("Coordinates: ", `${lat}, ${lng}`);
          console.log("Interventions count:", ivCount);
          if (site.interventions?.length) {
            console.table(
              site.interventions.map((iv) => ({
                type: iv.type,
                quantity: iv.quantity ?? "—",
                length: iv.details?.length_m ?? "—",
                width: iv.details?.width_m ?? "—",
                depth: iv.details?.depth_m ?? "—",
                area: iv.details?.area ?? "—",
              })),
            );
          }
          if (site.site_level_impact)
            console.log("Site impact:         ", site.site_level_impact);
          if (site.subcatchment_level_impact)
            console.log(
              "Subcatchment impact: ",
              site.subcatchment_level_impact,
            );
          console.log("Full site object:", site);
          console.groupEnd();
        });

        marker.addTo(markersGroup);
        boundsPoints.push([lat, lng]);
      });
    }

    // Render Projects Layer
    // (Flood Hazard is rendered via GeoJSON layer with custom polygon styles and borders)

    // Zoom automatically to active bounds containing visible points
    if (boundsPoints.length > 0) {
      const bounds = L.latLngBounds(boundsPoints);
      map.flyToBounds(bounds, {
        padding: [50, 50],
        maxZoom: 13,
        animate: true,
        duration: 1.2,
      });
    }
  }, [
    showWells,
    showProjects,
    showNewProjects,
    wells,
    projects,
    searchText,
    loading,
    interventionFilterMode,
    selectedInterventionTypes,
    selectedSiteTypes,
    selectedBGGTypes,
    sitesData,
  ]);

  const handleSelectItem = (item) => {
    setSelectedItem(item);

    const isProj = item.projName !== undefined;
    const badgeLabel = isProj ? "PROJECT" : "WELL";
    const color = isProj
      ? getProjectColor(item.status, item.tags)
      : getWellColor(item.wellType);
    console.log(
      `%c📍 [LIST ITEM SELECT] - Type: ${badgeLabel}`,
      `color: ${color}; font-weight: bold; font-size: 14px;`,
    );
    console.log("Asset Details:", item);

    if (mapRef.current) {
      mapRef.current.flyTo([item.lat, item.lng], 14, {
        animate: true,
        duration: 1,
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

  // Multi-dimensional dynamic count helper
  const getInterventionFilterCounts = () => {
    const interventionCounts = {
      lake: 0,
      flood: 0,
      groundwater: 0,
      rainwater: 0,
      iuwm: 0,
      other: 0,
    };
    const siteCounts = {
      lake: 0,
      park: 0,
      drain: 0,
      road: 0,
    };
    const bggCounts = {
      blue: 0,
      green: 0,
      grey: 0,
    };

    projects.forEach((p) => {
      // 1. Intervention Type
      const catId = p.categoryInfo?.id || "other";
      if (interventionCounts[catId] !== undefined) {
        interventionCounts[catId]++;
      }

      // 2. Site Type
      const siteId = p.siteTypeInfo?.id || "road";
      if (siteCounts[siteId] !== undefined) {
        siteCounts[siteId]++;
      }

      // 3. BGG Type
      const bggId = p.bggTypeInfo?.id || "grey";
      if (bggCounts[bggId] !== undefined) {
        bggCounts[bggId]++;
      }
    });

    return {
      intervention: interventionCounts,
      site: siteCounts,
      bgg: bggCounts,
    };
  };
  const filterCounts = getInterventionFilterCounts();

  return (
    <div className="max-w-[1650px] 2xl:max-w-[1850px] w-full mx-auto px-3 sm:px-4 lg:px-6 py-4 text-left relative">
      {activeDetailView && (
        <div className="w-full text-left animate-[fadeIn_0.2s_ease-out_forwards]">
          <button
            onClick={handleBackToMap}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-xl text-xs font-semibold shadow-sm transition-all cursor-pointer mb-4"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M19 12H5" />
              <path d="M12 19l-7-7 7-7" />
            </svg>
            <span>Back to Map</span>
          </button>
          {activeDetailView.type === "site" ? (
            <NewProjectsView initialProjectId={activeDetailView.id} />
          ) : (
            <Interventions />
          )}
        </div>
      )}

      <div
        className={
          activeDetailView
            ? "hidden"
            : "flex flex-col gap-6 w-full animate-[fadeIn_0.4s_ease-out_forwards]"
        }
      >
        <style
          dangerouslySetInnerHTML={{
            __html: `
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
      `,
          }}
        />

        {/* 
      <div>
        <p className="font-bold text-xl">Interactive Spatial Explorer</p>
      </div>

      <div className="h-[650px] bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm overflow-y-auto">
        <Analytics />
      </div>
      */}

        <div
          className={`grid grid-cols-1 ${
            showFloodingHotspots && isRightDeckOpen
              ? "xl:grid-cols-[250px_1fr_305px] 2xl:grid-cols-[265px_1fr_315px]"
              : "xl:grid-cols-[280px_1fr]"
          } gap-3.5 items-start`}
        >
          {/* Left Sidebar Control Panel - Free Dynamic Height */}
          <div className="bg-white border border-slate-200 rounded-[20px] p-5 flex flex-col gap-4 shadow-sm h-auto">
            {/* Header */}
            <div className="border-b border-slate-100 pb-2.5">
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider m-0">
                Map Exploration Layers
              </h5>
            </div>

            {/* Section 1: What's Happening in the City? */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <button
                type="button"
                onClick={() => toggleSection("happening")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/90 hover:bg-slate-100 text-left transition-colors cursor-pointer"
              >
                <span className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                  <span>What&apos;s Happening in the City?</span>
                </span>
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openSections.happening ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openSections.happening && (
                <div className="p-3.5 flex flex-col gap-3 border-t border-slate-100 animate-[slideDown_0.2s_ease-out]">
                  <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700 cursor-pointer select-none relative text-left">
                    <input
                      type="checkbox"
                      checked={showProjects}
                      onChange={(e) => setShowProjects(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-blue-600 mt-0.5"
                    />
                    <span>
                      Existing Interventions (
                      {showProjects
                        ? `${filteredItems.filter((i) => i.projName !== undefined).length} active`
                        : `${projects.length} total`}
                      )
                    </span>
                  </label>

                  {/* Sub-Filters for Existing Interventions with 3 Classification Modes */}
                  {showProjects && (
                    <div className="flex flex-col gap-2.5 pl-3.5 mt-1 animate-[slideDown_0.2s_ease-out] border-l-2 border-blue-200/80 ml-2">
                      {/* Filter Mode Selector Pills */}
                      <div className="flex items-center gap-1 p-1 bg-slate-100/90 rounded-lg text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => setInterventionFilterMode("intervention")}
                          className={`flex-1 py-1 px-1.5 rounded-md transition-all text-center cursor-pointer border-none ${
                            interventionFilterMode === "intervention"
                              ? "bg-white text-blue-700 shadow-2xs font-extrabold"
                              : "bg-transparent text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          🏷️ Type
                        </button>
                        <button
                          type="button"
                          onClick={() => setInterventionFilterMode("site")}
                          className={`flex-1 py-1 px-1.5 rounded-md transition-all text-center cursor-pointer border-none ${
                            interventionFilterMode === "site"
                              ? "bg-white text-emerald-700 shadow-2xs font-extrabold"
                              : "bg-transparent text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          📍 Site
                        </button>
                        <button
                          type="button"
                          onClick={() => setInterventionFilterMode("bgg")}
                          className={`flex-1 py-1 px-1.5 rounded-md transition-all text-center cursor-pointer border-none ${
                            interventionFilterMode === "bgg"
                              ? "bg-white text-indigo-700 shadow-2xs font-extrabold"
                              : "bg-transparent text-slate-500 hover:text-slate-800"
                          }`}
                        >
                          🎨 BGG
                        </button>
                      </div>

                      {/* Quick Select All / Clear Row */}
                      <div className="flex items-center justify-between text-[10px] px-1 text-slate-500">
                        <span className="font-semibold uppercase tracking-wider text-[9px] text-slate-400">
                          {interventionFilterMode === "intervention"
                            ? "Intervention Type (Full)"
                            : interventionFilterMode === "site"
                              ? "Site Type"
                              : "Blue-Green-Grey Type"}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              if (interventionFilterMode === "intervention") {
                                setSelectedInterventionTypes({
                                  lake: true,
                                  flood: true,
                                  groundwater: true,
                                  rainwater: true,
                                  iuwm: true,
                                  other: true,
                                });
                              } else if (interventionFilterMode === "site") {
                                setSelectedSiteTypes({
                                  lake: true,
                                  park: true,
                                  drain: true,
                                  road: true,
                                });
                              } else {
                                setSelectedBGGTypes({
                                  blue: true,
                                  green: true,
                                  grey: true,
                                });
                              }
                            }}
                            className="text-blue-600 hover:underline cursor-pointer border-none bg-transparent p-0 font-bold"
                          >
                            All
                          </button>
                          <span>·</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (interventionFilterMode === "intervention") {
                                setSelectedInterventionTypes({
                                  lake: false,
                                  flood: false,
                                  groundwater: false,
                                  rainwater: false,
                                  iuwm: false,
                                  other: false,
                                });
                              } else if (interventionFilterMode === "site") {
                                setSelectedSiteTypes({
                                  lake: false,
                                  park: false,
                                  drain: false,
                                  road: false,
                                });
                              } else {
                                setSelectedBGGTypes({
                                  blue: false,
                                  green: false,
                                  grey: false,
                                });
                              }
                            }}
                            className="text-slate-400 hover:underline cursor-pointer border-none bg-transparent p-0"
                          >
                            Clear
                          </button>
                        </div>
                      </div>

                      {/* Mode 1: Interventions Type (Full forms) */}
                      {interventionFilterMode === "intervention" && (
                        <div className="flex flex-col gap-1.5">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedInterventionTypes.lake}
                              onChange={(e) =>
                                setSelectedInterventionTypes((prev) => ({
                                  ...prev,
                                  lake: e.target.checked,
                                }))
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-sky-500 accent-[#0284c7]"
                            />
                            <span className="leading-tight text-[11px]">
                              🌊 Lake Rejuvenation ({filterCounts.intervention.lake})
                            </span>
                          </label>

                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedInterventionTypes.flood}
                              onChange={(e) =>
                                setSelectedInterventionTypes((prev) => ({
                                  ...prev,
                                  flood: e.target.checked,
                                }))
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-orange-500 accent-[#ea580c]"
                            />
                            <span className="leading-tight text-[11px]">
                              🛡️ Flood Mitigation ({filterCounts.intervention.flood})
                            </span>
                          </label>

                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedInterventionTypes.groundwater}
                              onChange={(e) =>
                                setSelectedInterventionTypes((prev) => ({
                                  ...prev,
                                  groundwater: e.target.checked,
                                }))
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-purple-500 accent-[#8b5cf6]"
                            />
                            <span className="leading-tight text-[11px]">
                              💧 Groundwater Mgmt ({filterCounts.intervention.groundwater})
                            </span>
                          </label>

                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedInterventionTypes.rainwater}
                              onChange={(e) =>
                                setSelectedInterventionTypes((prev) => ({
                                  ...prev,
                                  rainwater: e.target.checked,
                                }))
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-emerald-500 accent-[#10b981]"
                            />
                            <span className="leading-tight text-[11px]">
                              🌧️ Rainwater Harvesting ({filterCounts.intervention.rainwater})
                            </span>
                          </label>

                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedInterventionTypes.iuwm}
                              onChange={(e) =>
                                setSelectedInterventionTypes((prev) => ({
                                  ...prev,
                                  iuwm: e.target.checked,
                                }))
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-pink-500 accent-[#ec4899]"
                            />
                            <span className="leading-tight text-[11px]">
                              🔄 IUWM Systems ({filterCounts.intervention.iuwm})
                            </span>
                          </label>

                          {filterCounts.intervention.other > 0 && (
                            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                checked={selectedInterventionTypes.other}
                                onChange={(e) =>
                                  setSelectedInterventionTypes((prev) => ({
                                    ...prev,
                                    other: e.target.checked,
                                  }))
                                }
                                className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-slate-500 accent-[#64748b]"
                              />
                              <span className="leading-tight text-[11px]">
                                ⚙️ Other Infrastructure ({filterCounts.intervention.other})
                              </span>
                            </label>
                          )}
                        </div>
                      )}

                      {/* Mode 2: Site Type (Parks, Lakes, Drains, Roads) */}
                      {interventionFilterMode === "site" && (
                        <div className="flex flex-col gap-1.5">
                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedSiteTypes.lake}
                              onChange={(e) =>
                                setSelectedSiteTypes((prev) => ({
                                  ...prev,
                                  lake: e.target.checked,
                                }))
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-sky-500 accent-[#0284c7]"
                            />
                            <span className="leading-tight text-[11px]">
                              🌊 Lakes &amp; Water Bodies ({filterCounts.site.lake})
                            </span>
                          </label>

                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedSiteTypes.park}
                              onChange={(e) =>
                                setSelectedSiteTypes((prev) => ({
                                  ...prev,
                                  park: e.target.checked,
                                }))
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-emerald-500 accent-[#16a34a]"
                            />
                            <span className="leading-tight text-[11px]">
                              🟢 Parks &amp; Green Spaces ({filterCounts.site.park})
                            </span>
                          </label>

                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedSiteTypes.drain}
                              onChange={(e) =>
                                setSelectedSiteTypes((prev) => ({
                                  ...prev,
                                  drain: e.target.checked,
                                }))
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-slate-500 accent-[#475569]"
                            />
                            <span className="leading-tight text-[11px]">
                              ⚫ Storm Drains &amp; Channels ({filterCounts.site.drain})
                            </span>
                          </label>

                          <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedSiteTypes.road}
                              onChange={(e) =>
                                setSelectedSiteTypes((prev) => ({
                                  ...prev,
                                  road: e.target.checked,
                                }))
                              }
                              className="w-3.5 h-3.5 rounded border-slate-300 focus:ring-amber-500 accent-[#d97706]"
                            />
                            <span className="leading-tight text-[11px]">
                              🛣️ Roads &amp; Campuses ({filterCounts.site.road})
                            </span>
                          </label>
                        </div>
                      )}

                      {/* Mode 3: BGG Type (Blue, Green, Grey) */}
                      {interventionFilterMode === "bgg" && (
                        <div className="flex flex-col gap-1.5">
                          <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedBGGTypes.blue}
                              onChange={(e) =>
                                setSelectedBGGTypes((prev) => ({
                                  ...prev,
                                  blue: e.target.checked,
                                }))
                              }
                              className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 focus:ring-sky-500 accent-[#0284c7]"
                            />
                            <div className="flex flex-col leading-tight">
                              <span className="text-[11px] font-bold text-sky-800">
                                🔵 Blue ({filterCounts.bgg.blue})
                              </span>
                              <span className="text-[9.5px] text-slate-400 font-normal">
                                Lakes &amp; Water Bodies
                              </span>
                            </div>
                          </label>

                          <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedBGGTypes.green}
                              onChange={(e) =>
                                setSelectedBGGTypes((prev) => ({
                                  ...prev,
                                  green: e.target.checked,
                                }))
                              }
                              className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 focus:ring-emerald-500 accent-[#16a34a]"
                            />
                            <div className="flex flex-col leading-tight">
                              <span className="text-[11px] font-bold text-emerald-800">
                                🟢 Green ({filterCounts.bgg.green})
                              </span>
                              <span className="text-[9.5px] text-slate-400 font-normal">
                                Parks &amp; Green Spaces
                              </span>
                            </div>
                          </label>

                          <label className="flex items-start gap-2 text-xs font-semibold text-slate-700 hover:text-slate-900 cursor-pointer select-none">
                            <input
                              type="checkbox"
                              checked={selectedBGGTypes.grey}
                              onChange={(e) =>
                                setSelectedBGGTypes((prev) => ({
                                  ...prev,
                                  grey: e.target.checked,
                                }))
                              }
                              className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 focus:ring-slate-500 accent-[#475569]"
                            />
                            <div className="flex flex-col leading-tight">
                              <span className="text-[11px] font-bold text-slate-800">
                                ⚫ Grey ({filterCounts.bgg.grey})
                              </span>
                              <span className="text-[9.5px] text-slate-400 font-normal">
                                Roads, Layouts &amp; Campuses
                              </span>
                            </div>
                          </label>
                        </div>
                      )}
                    </div>
                  )}

                  <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                    <input
                      type="checkbox"
                      checked={showWells}
                      onChange={(e) => setShowWells(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 mt-0.5"
                    />
                    <span>
                      Recharge Wells (
                      {showWells
                        ? `${filteredItems.filter((i) => i.projName === undefined).length} active`
                        : `${wells.length} total`}
                      )
                    </span>
                  </label>
                </div>
              )}
            </div>

            {/* Section 2: What are the risks of the cities? */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <button
                type="button"
                onClick={() => toggleSection("risks")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/90 hover:bg-slate-100 text-left transition-colors cursor-pointer"
              >
                <span className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                  <span>What are the risks of the cities?</span>
                </span>
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openSections.risks ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openSections.risks && (
                <div className="p-3.5 flex flex-col gap-3.5 border-t border-slate-100 animate-[slideDown_0.2s_ease-out]">
                  {/* Flood Risk Map Layer */}
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700 cursor-pointer select-none relative text-left">
                      <input
                        type="checkbox"
                        checked={showNewFloodRisk}
                        onChange={(e) => setShowNewFloodRisk(e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-red-600 focus:ring-red-500 accent-[#ef4444] mt-0.5"
                      />
                      <span>
                        Flood Risk Map{" "}
                        {loadingFloodHazard && (
                          <span className="small-inline-spinner"></span>
                        )}
                      </span>
                    </label>
                    {showNewFloodRisk && (
                      <div className="ml-6 flex flex-col gap-1.5 text-[11px] text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-xs">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                          Flood Hazard Index Legend
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-xs bg-[#ef4444] inline-block border border-black/15"></span>{" "}
                            Very High
                          </span>
                          <strong className="font-mono text-[10.5px] text-slate-600">
                            0.543 - 0.667
                          </strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-xs bg-[#f97316] inline-block border border-black/15"></span>{" "}
                            High
                          </span>
                          <strong className="font-mono text-[10.5px] text-slate-600">
                            0.497 - 0.543
                          </strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-xs bg-[#fde047] inline-block border border-black/15"></span>{" "}
                            Moderate
                          </span>
                          <strong className="font-mono text-[10.5px] text-slate-600">
                            0.456 - 0.497
                          </strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-xs bg-[#84cc16] inline-block border border-black/15"></span>{" "}
                            Low
                          </span>
                          <strong className="font-mono text-[10.5px] text-slate-600">
                            0.416 - 0.456
                          </strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-xs bg-[#16a34a] inline-block border border-black/15"></span>{" "}
                            Very Low
                          </span>
                          <strong className="font-mono text-[10.5px] text-slate-600">
                            0.000 - 0.416
                          </strong>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Flooding Hotspots (Points) Layer */}
                  <div className="flex flex-col gap-1.5">
                    <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700 cursor-pointer select-none relative text-left">
                      <input
                        type="checkbox"
                        checked={showFloodingHotspots}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setShowFloodingHotspots(checked);
                          if (checked) setIsRightDeckOpen(true);
                        }}
                        className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 accent-[#d97706] mt-0.5"
                      />
                      <span className="flex items-center gap-1.5">
                        <span>
                          Flooding Hotspots{" "}
                          {loadingFloodingHotspots && (
                            <span className="small-inline-spinner"></span>
                          )}
                        </span>
                      </span>
                    </label>
                    {showFloodingHotspots && (
                      <div className="ml-6 flex flex-col gap-1.5 text-[11px] text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-xs animate-[slideDown_0.2s_ease-out]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                          Hotspot Vulnerability Legend
                        </span>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-[#dc2626] inline-block border border-white shadow-xs"></span>
                            High Risk Hotspots
                          </span>
                          <strong className="font-mono text-[10.5px] text-slate-600">
                            58 points
                          </strong>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-[#d97706] inline-block border border-white shadow-xs"></span>
                            Moderate Risk Hotspots
                          </span>
                          <strong className="font-mono text-[10.5px] text-slate-600">
                            143 points
                          </strong>
                        </div>
                        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                          <span className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-xs border-2 border-dashed border-[#d97706] bg-[#f59e0b]/30 inline-block"></span>
                            Delineated Catchment
                          </span>
                          <span className="text-[10.5px] font-semibold text-slate-600">
                            Borewell Rd
                          </span>
                        </div>
                        <div className="pt-1.5 mt-0.5 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                          <span>Zones Covered:</span>
                          <strong className="text-slate-700">10 Zones</strong>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Section 3: What can we do about it ? */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
              <button
                type="button"
                onClick={() => toggleSection("projects")}
                className="w-full flex items-center justify-between p-3.5 bg-slate-50/90 hover:bg-slate-100 text-left transition-colors cursor-pointer"
              >
                <span className="text-[13px] font-bold text-slate-800 flex items-center gap-2">
                  <span>Explore Potential Projects?</span>
                </span>
                <svg
                  className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${openSections.projects ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </button>
              {openSections.projects && (
                <div className="p-3.5 flex flex-col gap-3 border-t border-slate-100 animate-[slideDown_0.2s_ease-out]">
                  <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-700 cursor-pointer select-none relative text-left">
                    <input
                      type="checkbox"
                      checked={showNewProjects}
                      onChange={(e) => setShowNewProjects(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-[#3b82f6] mt-0.5"
                    />
                    <span>City Level Projects</span>
                  </label>
                  {showNewProjects && (
                    <div className="ml-6 flex flex-col gap-1.5 text-[11px] text-slate-700 font-medium bg-slate-50 border border-slate-200 rounded-xl p-2.5 shadow-xs">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">
                        Project Types Legend
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#3b82f6] inline-block border border-white shadow-xs"></span>
                        <span>Lake Interventions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#22c55e] inline-block border border-white shadow-xs"></span>
                        <span>Parks & Green Spaces</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#f59e0b] inline-block border border-white shadow-xs"></span>
                        <span>Institutional Campuses</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-[#94a3b8] inline-block border border-white shadow-xs"></span>
                        <span>Stormdrains & Drainage</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Remaining Base and Boundary Layers Openly Below */}
            {/* <div className="pt-2 border-t border-slate-200 flex flex-col gap-3">
              <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider m-0">
                Additional Base & Boundary Layers
              </h5>

              <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showWells}
                  onChange={(e) => setShowWells(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-purple-600 focus:ring-purple-500 accent-purple-600 mt-0.5"
                />
                <span>
                  Recharge Wells (
                  {showWells
                    ? `${filteredItems.filter((i) => i.projName === undefined).length} active`
                    : `${wells.length} total`}
                  )
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showWards}
                  onChange={(e) => setShowWards(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 accent-[#d97706] mt-0.5"
                />
                <span>
                  Wards Summary (
                  {
                    Object.keys(
                      wells.concat(projects).reduce((acc, item) => {
                        if (
                          item.wardName &&
                          !item.wardName.toLowerCase().includes("unknown") &&
                          item.wardName.trim() !== ""
                        ) {
                          acc[item.wardName] = true;
                        }
                        return acc;
                      }, {}),
                    ).length
                  }{" "}
                  Wards)
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showBengaluruAssembly}
                  onChange={(e) => setShowBengaluruAssembly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 accent-[#3b82f6] mt-0.5"
                />
                <span>
                  Bengaluru Assemblies{" "}
                  {loadingBengaluruAssembly && (
                    <span className="small-inline-spinner"></span>
                  )}
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showKarnatakaAssembly}
                  onChange={(e) => setShowKarnatakaAssembly(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 accent-[#10b981] mt-0.5"
                />
                <span>
                  Karnataka Assemblies{" "}
                  {loadingKarnatakaAssembly && (
                    <span className="small-inline-spinner"></span>
                  )}
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showGbaWards}
                  onChange={(e) => setShowGbaWards(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500 accent-[#f43f5e] mt-0.5"
                />
                <span>
                  GBA Wards{" "}
                  {loadingGbaWards && (
                    <span className="small-inline-spinner"></span>
                  )}
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showGbaCorporations}
                  onChange={(e) => setShowGbaCorporations(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-pink-600 focus:ring-pink-500 accent-[#ec4899] mt-0.5"
                />
                <span>
                  GBA Corporations{" "}
                  {loadingGbaCorporations && (
                    <span className="small-inline-spinner"></span>
                  )}
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showValleys}
                  onChange={(e) => setShowValleys(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 accent-[#06b6d4] mt-0.5"
                />
                <span>
                  Valleys{" "}
                  {loadingValleys && (
                    <span className="small-inline-spinner"></span>
                  )}
                </span>
              </label>

              <label className="flex items-start gap-2.5 text-[13px] font-semibold text-slate-600 cursor-pointer select-none relative text-left">
                <input
                  type="checkbox"
                  checked={showGreenspaces}
                  onChange={(e) => setShowGreenspaces(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-green-600 focus:ring-green-500 accent-[#15803d] mt-0.5"
                />
                <span>
                  Greenspaces{" "}
                  {loadingGreenspaces && (
                    <span className="small-inline-spinner"></span>
                  )}
                </span>
              </label>
            </div> */}

            {/* Search Assets inside Selected Layers */}
            <div className="flex flex-col gap-2.5 pt-3 border-slate-200">
              {(showWells || showProjects) && (
                <>
                  <div className="relative w-full">
                    <svg
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-[2]"
                      width="15"
                      height="15"
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
                      placeholder="Filter active layer assets..."
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      disabled={!showWells && !showProjects}
                      className="w-full pl-9 pr-9 py-2 text-xs border border-slate-300 rounded-xl outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/12 text-slate-900 bg-white transition-all shadow-xs"
                    />
                    {searchText && (
                      <button
                        onClick={() => setSearchText("")}
                        className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none text-sm text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: "600",
                      color: "#64748b",
                      paddingLeft: "2px",
                    }}
                  >
                    Showing {filteredItems.length} of{" "}
                    {wells.length + projects.length} items
                  </div>
                </>
              )}

              <div className="max-h-52 overflow-y-auto flex flex-col gap-2 custom-scrollbar pr-1">
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-6 gap-2 text-slate-500 text-xs">
                    <div className="w-5 h-5 border-2 border-slate-200 border-t-indigo-500 rounded-full animate-spin"></div>
                    <span>Loading GIS assets...</span>
                  </div>
                ) : !showWells && !showProjects ? (
                  <div className="text-center py-4 px-2 text-slate-400 text-xs font-medium">
                    Toggle on layers above to explore spatial points and assets.
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="text-center py-4 px-2 text-slate-400 text-xs font-medium">
                    No matching assets found.
                  </div>
                ) : (
                  filteredItems.map((item, index) => {
                    const isProj = item.projName !== undefined;
                    const name = isProj ? item.projName : item.wellName;
                    const desc = isProj ? item.status : item.wellType;
                    const color = isProj
                      ? getProjectColor(item.status, item.tags)
                      : getWellColor(item.wellType);

                    return (
                      <div
                        key={item._id || item._mb_row_id || index}
                        className={`flex items-center gap-2.5 p-2.5 bg-slate-50 hover:bg-slate-100/80 border rounded-xl cursor-pointer transition-all duration-200 text-left ${isItemSelected(item) ? "bg-indigo-500/5 border-indigo-500" : "border-slate-100 hover:border-slate-300"}`}
                        onClick={() => handleSelectItem(item)}
                      >
                        <div
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: color }}
                        ></div>
                        <div className="flex flex-col gap-0.5 overflow-hidden w-full">
                          <strong className="text-xs font-bold text-slate-800 truncate block">
                            {name}
                          </strong>
                          <span className="text-[10.5px] text-slate-500 truncate block">
                            {desc || "Open Well"} —{" "}
                            {item.wardName || "Unknown Ward"}
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Center / Right Section: Map & Details Pane */}
          <div className="flex flex-col gap-6 h-auto">
            {/* Main Leaflet Map Card with Ward / Locality Search Bar */}
            <div className="h-[480px] sm:h-[540px] xl:h-[600px] shrink-0 bg-white border border-slate-200 rounded-[20px] flex flex-col overflow-hidden shadow-sm">
              <div className="px-5 py-3 border-b border-slate-100 flex flex-wrap justify-between items-center bg-white gap-3 relative z-[1000]">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider m-0">
                    🗺️ Bengaluru Map View
                  </h4>
                  {selectedBoundaryItem && (
                    <div
                      className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold shadow-2xs animate-[fadeIn_0.2s_ease-out]"
                      style={{
                        backgroundColor: selectedBoundaryItem.categoryBg,
                        color: selectedBoundaryItem.categoryColor,
                        border: `1px solid ${selectedBoundaryItem.categoryBorder}`,
                      }}
                    >
                      <span>
                        {selectedBoundaryItem.categoryIcon}{" "}
                        {selectedBoundaryItem.name}
                      </span>
                      <button
                        type="button"
                        onClick={handleClearSelectedBoundary}
                        title="Clear border highlight"
                        className="hover:opacity-75 font-black ml-0.5 cursor-pointer border-none bg-transparent"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Enhanced Layer Search & Dropdown Box */}
                <div
                  ref={searchDropdownContainerRef}
                  className="relative max-w-lg w-full sm:w-auto"
                >
                  <form
                    onSubmit={handleLocationSearch}
                    className="flex items-center bg-slate-50 hover:bg-white focus-within:bg-white border border-slate-300 focus-within:border-indigo-500 rounded-xl transition-all shadow-xs overflow-hidden"
                  >
                    <div className="pl-3 pr-1 text-slate-400">
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <circle cx="11" cy="11" r="8" />
                        <line x1="21" y1="21" x2="16.65" y2="16.65" />
                      </svg>
                    </div>

                    <input
                      type="text"
                      placeholder={
                        selectedSearchCategory === "assembly"
                          ? "Search Bengaluru Assemblies..."
                          : selectedSearchCategory === "ward"
                            ? "Search GBA Wards..."
                            : selectedSearchCategory === "corporation"
                              ? "Search GBA Corporations..."
                              : "Search Assemblies, Wards, Corporations..."
                      }
                      value={locationSearchQuery}
                      onChange={(e) => {
                        setLocationSearchQuery(e.target.value);
                        setIsSearchDropdownOpen(true);
                      }}
                      onFocus={() => setIsSearchDropdownOpen(true)}
                      className="w-full sm:w-72 py-1.5 px-2 text-xs outline-none bg-transparent text-slate-900 placeholder:text-slate-400 font-medium"
                    />

                    {locationSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setLocationSearchQuery("")}
                        className="px-1.5 text-slate-400 hover:text-slate-600 text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    )}

                    {/* Dropdown Toggle Chevron */}
                    <button
                      type="button"
                      onClick={() => setIsSearchDropdownOpen((prev) => !prev)}
                      className="px-2.5 py-2 border-l border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 transition-colors cursor-pointer flex items-center justify-center"
                      title="Select Layer or Boundary"
                    >
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isSearchDropdownOpen ? "rotate-180 text-indigo-600" : ""}`}
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth="2.5"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>
                  </form>

                  {/* Dropdown Menu */}
                  {isSearchDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1.5 w-full sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-xl z-[1050] overflow-hidden animate-[fadeIn_0.15s_ease-out]">
                      {/* Category Filter Tabs */}
                      <div className="p-2 bg-slate-50 border-b border-slate-100 flex items-center gap-1 overflow-x-auto text-[11px]">
                        <button
                          type="button"
                          onClick={() => setSelectedSearchCategory("all")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 ${selectedSearchCategory === "all" ? "bg-indigo-600 text-white shadow-xs" : "text-slate-600 hover:bg-slate-200/70"}`}
                        >
                          All ({searchLayerItems.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSearchCategory("assembly")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${selectedSearchCategory === "assembly" ? "bg-blue-600 text-white shadow-xs" : "text-slate-600 hover:bg-blue-50 hover:text-blue-700"}`}
                        >
                          <span>🏛️ Assembly</span>
                          <span className="opacity-80">
                            (
                            {
                              searchLayerItems.filter(
                                (i) => i.category === "assembly",
                              ).length
                            }
                            )
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedSearchCategory("ward")}
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${selectedSearchCategory === "ward" ? "bg-rose-600 text-white shadow-xs" : "text-slate-600 hover:bg-rose-50 hover:text-rose-700"}`}
                        >
                          <span>📍 Wards</span>
                          <span className="opacity-80">
                            (
                            {
                              searchLayerItems.filter(
                                (i) => i.category === "ward",
                              ).length
                            }
                            )
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setSelectedSearchCategory("corporation")
                          }
                          className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer shrink-0 flex items-center gap-1 ${selectedSearchCategory === "corporation" ? "bg-pink-600 text-white shadow-xs" : "text-slate-600 hover:bg-pink-50 hover:text-pink-700"}`}
                        >
                          <span>🏢 Corporations</span>
                          <span className="opacity-80">
                            (
                            {
                              searchLayerItems.filter(
                                (i) => i.category === "corporation",
                              ).length
                            }
                            )
                          </span>
                        </button>
                      </div>

                      {/* Results / Browse List */}
                      <div className="max-h-64 overflow-y-auto custom-scrollbar p-1.5 flex flex-col gap-1 text-left">
                        {filteredSearchItems.length === 0 ? (
                          <div className="py-6 text-center text-xs text-slate-400 font-medium">
                            No matching boundaries found.
                          </div>
                        ) : (
                          filteredSearchItems.map((item) => (
                            <div
                              key={item.id}
                              onClick={() => handleSelectBoundaryItem(item)}
                              className="p-2.5 rounded-xl hover:bg-slate-50 active:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200/80 flex items-center justify-between gap-3 text-left group"
                            >
                              <div className="flex flex-col gap-0.5 overflow-hidden">
                                <div className="flex items-center gap-1.5">
                                  <span
                                    className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded leading-none shrink-0"
                                    style={{
                                      backgroundColor: item.categoryBg,
                                      color: item.categoryColor,
                                      border: `1px solid ${item.categoryBorder}`,
                                    }}
                                  >
                                    {item.categoryIcon} {item.categoryLabel}
                                  </span>
                                  <strong className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors truncate">
                                    {item.name}
                                  </strong>
                                </div>
                                <span className="text-[10.5px] text-slate-500 truncate pl-0.5">
                                  {item.subtitle}
                                </span>
                              </div>

                              <span className="text-xs font-bold text-slate-400 group-hover:text-indigo-600 shrink-0 transition-transform group-hover:translate-x-0.5">
                                →
                              </span>
                            </div>
                          ))
                        )}
                      </div>

                      {/* Footer Info */}
                      <div className="px-3 py-2 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center text-[10px] text-slate-500 font-medium">
                        <span>
                          Showing {filteredSearchItems.length} boundary items
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsSearchDropdownOpen(false)}
                          className="text-slate-500 hover:text-slate-800 font-bold cursor-pointer"
                        >
                          Close ✕
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {searchError && (
                <div className="px-5 py-1.5 bg-amber-50 text-amber-800 text-[11px] font-medium border-b border-amber-200 flex justify-between items-center">
                  <span>{searchError}</span>
                  <button
                    onClick={() => setSearchError(null)}
                    className="text-amber-600 hover:text-amber-900 font-bold cursor-pointer"
                  >
                    ✕
                  </button>
                </div>
              )}

              <div
                className="leaflet-map-wrapper-inner"
                style={{
                  position: "relative",
                  width: "100%",
                  height: "calc(100% - 54px)",
                }}
              >
                <div
                  ref={mapContainerRef}
                  className="leaflet-map-canvas"
                  style={{ width: "100%", height: "100%" }}
                ></div>
              </div>
            </div>

            {/* Details Sidebar Pane */}
            <div className="min-h-[280px] xl:flex-1 xl:h-0 overflow-y-auto bg-white border border-slate-200 rounded-[20px] p-6 shadow-sm custom-scrollbar">
              {selectedItem ? (
                <div className="flex flex-col gap-5">
                  {selectedItem.isSiteProject ? (
                    <>
                      <div className="flex justify-between items-start border-b border-slate-100 pb-3.5 flex-wrap gap-3 text-left">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className="text-[9.5px] font-extrabold tracking-wider px-2.5 py-1 rounded-md uppercase"
                            style={{
                              backgroundColor:
                                (selectedItem.categoryInfo?.color ||
                                  "#3b82f6") + "18",
                              color:
                                selectedItem.categoryInfo?.color || "#3b82f6",
                            }}
                          >
                            {selectedItem.categoryInfo?.icon}{" "}
                            {String(selectedItem.type || "SITE").toUpperCase()}
                          </span>
                          <h3 className="text-base font-bold text-slate-800 m-0 grow min-w-[200px] text-left">
                            {selectedItem.name}
                          </h3>
                        </div>
                        <button
                          onClick={() =>
                            window.openSiteDetailInPlace &&
                            window.openSiteDetailInPlace(selectedItem.site_id)
                          }
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer border-0"
                        >
                          <span>Open Project Workspace</span>
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                          >
                            <path d="M5 12h14" />
                            <path d="M12 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>

                      <div className="flex flex-col gap-5 text-left">
                        {selectedItem.image_url && (
                          <div className="w-full h-44 sm:h-52 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shadow-xs relative">
                            <img
                              src={selectedItem.image_url}
                              alt={selectedItem.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                if (e.currentTarget?.parentElement)
                                  e.currentTarget.parentElement.style.display =
                                    "none";
                              }}
                            />
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                          <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-3.5 flex flex-col gap-1 text-left">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">
                              🌱 Site Level Impact
                            </span>
                            <p className="text-xs font-semibold text-slate-700 m-0 leading-relaxed">
                              {selectedItem.site_level_impact ||
                                "Infiltration & storage modeling."}
                            </p>
                          </div>
                          <div className="bg-sky-50/70 border border-sky-100 rounded-xl p-3.5 flex flex-col gap-1 text-left">
                            <span className="text-[10px] font-extrabold uppercase tracking-wider text-sky-700">
                              🌊 Subcatchment Level Impact
                            </span>
                            <p className="text-xs font-semibold text-slate-700 m-0 leading-relaxed">
                              {selectedItem.subcatchment_level_impact ||
                                "Subcatchment runoff & infiltration telemetry."}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-slate-100 pt-3">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Watershed
                            </span>
                            <strong className="text-xs text-slate-700 font-semibold">
                              {selectedItem.watershed || "—"}
                            </strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Coordinates
                            </span>
                            <code className="font-mono text-[11px] text-slate-700 bg-white border border-slate-300 px-2 py-0.5 rounded w-fit inline-block">
                              {selectedItem.lat?.toFixed(6)}° N,{" "}
                              {selectedItem.lng?.toFixed(6)}° E
                            </code>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Total Interventions
                            </span>
                            <strong className="text-xs text-blue-600 font-bold">
                              {selectedItem.interventions?.length ||
                                selectedItem.linked_intervention_ids?.length ||
                                0}{" "}
                              planned
                            </strong>
                          </div>
                        </div>

                        {((selectedItem.interventions &&
                          selectedItem.interventions.length > 0) ||
                          (selectedItem.linked_intervention_ids &&
                            selectedItem.linked_intervention_ids.length >
                              0)) && (
                          <div className="border-t border-dashed border-slate-200 pt-3 flex flex-col gap-2">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                              Planned Nature-Based Interventions
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {selectedItem.interventions?.length > 0
                                ? selectedItem.interventions.map((iv, idx) => (
                                    <span
                                      key={idx}
                                      className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                                    >
                                      🔧 {iv.type?.replace(/_/g, " ")}{" "}
                                      {iv.quantity ? `×${iv.quantity}` : ""}
                                    </span>
                                  ))
                                : selectedItem.linked_intervention_ids.map(
                                    (id, idx) => {
                                      const parts = id.split("__");
                                      const typeName = parts[1]
                                        ? parts[1].replace(/_/g, " ")
                                        : id;
                                      return (
                                        <span
                                          key={idx}
                                          className="text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg border border-slate-200"
                                        >
                                          🔧 {typeName}
                                        </span>
                                      );
                                    },
                                  )}
                            </div>
                          </div>
                        )}
                      </div>
                    </>
                  ) : selectedItem.projName !== undefined ? (
                    <>
                      <div className="flex flex-col gap-2 border-b border-slate-100 pb-3 text-left">
                        <div className="flex justify-between items-center flex-wrap gap-2">
                          <div className="flex flex-wrap items-center gap-1.5">
                            {selectedItem.categoryInfo && (
                              <span
                                className="text-[9.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-md"
                                style={{
                                  backgroundColor:
                                    selectedItem.categoryInfo.color + "15",
                                  color: selectedItem.categoryInfo.color,
                                }}
                              >
                                {selectedItem.categoryInfo.icon}{" "}
                                {selectedItem.categoryInfo.name.toUpperCase()}
                              </span>
                            )}
                            {selectedItem.siteTypeInfo && (
                              <span className="text-[9.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {selectedItem.siteTypeInfo.icon}{" "}
                                {selectedItem.siteTypeInfo.name}
                              </span>
                            )}
                            {selectedItem.bggTypeInfo && (
                              <span className="text-[9.5px] font-extrabold tracking-wider px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                {selectedItem.bggTypeInfo.icon}{" "}
                                {selectedItem.bggTypeInfo.name}
                              </span>
                            )}
                          </div>
                          <div
                            className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border ${selectedItem.status?.toLowerCase().includes("completed") ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-indigo-500/10 border-indigo-500/20 text-indigo-600"}`}
                          >
                            {selectedItem.status || "Active"}
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-slate-900 m-0 leading-snug">
                          {selectedItem.projName}
                        </h3>
                      </div>

                      <div className="flex flex-col gap-5 text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Project Lead
                            </span>
                            <strong className="text-xs font-bold text-slate-700">
                              {selectedItem.projLead || "Not specified"}
                            </strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Budget
                            </span>
                            <strong className="text-xs font-bold text-slate-700">
                              {selectedItem.budget || "Not specified"}
                            </strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Timeline
                            </span>
                            <strong className="text-xs font-bold text-slate-700">
                              {selectedItem.timeline || "Not specified"}
                            </strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Area / Catchment
                            </span>
                            <strong className="text-xs font-bold text-slate-700">
                              {selectedItem.areaCatchment || "Not specified"}
                            </strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Drain Length
                            </span>
                            <strong className="text-xs font-bold text-slate-700">
                              {selectedItem.drainLength || "Not specified"}
                            </strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Tags
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {(selectedItem.tags || "Rejuvenation")
                                .split(",")
                                .map((t, idx) => (
                                  <span
                                    key={idx}
                                    className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded"
                                  >
                                    {t.trim()}
                                  </span>
                                ))}
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-slate-200 pt-4">
                          <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2.5">
                            📍 Geographic Telemetry
                          </h5>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">
                                Ward Name
                              </span>
                              <strong className="text-xs text-slate-700 font-bold">
                                {selectedItem.wardName || "Unknown Ward"}{" "}
                                {selectedItem.wardNameKn
                                  ? `(${selectedItem.wardNameKn})`
                                  : ""}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">
                                Corporation
                              </span>
                              <strong className="text-xs text-slate-700 font-bold">
                                {selectedItem.corporation ||
                                  "Unknown Corporation"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">
                                Coordinates
                              </span>
                              <code className="font-mono text-[11px] text-slate-700 bg-white border border-slate-300 px-2 py-1 rounded w-fit inline-block">
                                {selectedItem.lat.toFixed(6)}° N,{" "}
                                {selectedItem.lng.toFixed(6)}° E
                              </code>
                            </div>
                            {selectedItem.wardId && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Ward ID
                                </span>
                                <strong className="text-xs text-slate-700 font-bold">
                                  {selectedItem.wardId}
                                </strong>
                              </div>
                            )}
                            {selectedItem.ac && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Assembly Constituency
                                </span>
                                <strong className="text-xs text-slate-700 font-bold">
                                  {selectedItem.ac}{" "}
                                  {selectedItem.acKn
                                    ? `(${selectedItem.acKn})`
                                    : ""}
                                </strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedItem.mediaLink &&
                          selectedItem.mediaLink.trim() !== "" && (
                            <a
                              href={selectedItem.mediaLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center bg-slate-50 border border-slate-300 text-slate-600 px-4 py-2.5 rounded-xl text-xs font-semibold hover:bg-slate-100 hover:border-slate-400 hover:text-slate-900 hover:-translate-y-0.5 transition-all duration-200 self-start no-underline"
                            >
                              Read Case Report / Media Coverage
                              <svg
                                width="14"
                                height="14"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                style={{ marginLeft: "6px" }}
                              >
                                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                                <polyline points="15 3 21 3 21 9" />
                                <line x1="10" y1="14" x2="21" y2="3" />
                              </svg>
                            </a>
                          )}

                        {/* 3D Walkthrough Simulator Section */}
                        {[
                          "kadugodi_park",
                          "hoodi_lake",
                          "sheelavanthakere_lake",
                        ].includes(selectedItem.id) && (
                          <div className="mt-5 border-t border-dashed border-slate-200 pt-4 text-left">
                            <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-1.5">
                              🎮 Interactive 3D Walkthrough Simulator
                            </h5>
                            <p
                              style={{
                                fontSize: "11.5px",
                                color: "#64748b",
                                marginBottom: "12px",
                                margin: "0 0 12px 0",
                              }}
                            >
                              Simulate stormwater storage & infiltration by
                              toggling individual watershed assets.
                            </p>
                            <ThreeDWalkthrough project={selectedItem} />
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex justify-between items-center border-b border-slate-100 pb-3 flex-wrap gap-2 text-left">
                        <span className="text-[9px] font-extrabold tracking-wider px-2 py-1 rounded-md bg-purple-500/10 text-purple-500">
                          GROUND WELL
                        </span>
                        <h3 className="text-base font-bold text-slate-800 m-0 grow min-w-[200px] text-left">
                          {selectedItem.wellName}
                        </h3>
                        <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">
                          {selectedItem.wellType || "Open Well"}
                        </span>
                      </div>

                      <div className="flex flex-col gap-5 text-left">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Owner Name
                            </span>
                            <strong className="text-xs font-bold text-slate-700">
                              {selectedItem.ownerName || "Not specified"}
                            </strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Lining Material
                            </span>
                            <strong className="text-xs font-bold text-slate-700">
                              {selectedItem.lining || "Not specified"}
                            </strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Diameter
                            </span>
                            <strong className="text-xs font-bold text-slate-700">
                              {selectedItem.diameterFt
                                ? `${selectedItem.diameterFt} Ft`
                                : "Not specified"}
                            </strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Well Depth
                            </span>
                            <strong className="text-xs font-bold text-slate-700">
                              {selectedItem.depthFt
                                ? `${selectedItem.depthFt} Ft`
                                : "Not specified"}
                            </strong>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                              Water Level
                            </span>
                            <strong className="text-xs font-bold text-slate-700">
                              {selectedItem.waterLevelFt
                                ? `${selectedItem.waterLevelFt} Ft`
                                : "Not specified"}
                            </strong>
                          </div>
                        </div>

                        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 flex flex-col gap-3">
                          <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider m-0">
                            🧪 Hydrochemistry & Quality
                          </h5>
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">
                                pH Level
                              </span>
                              <strong className="text-sm text-slate-800 font-extrabold">
                                {selectedItem.ph !== null &&
                                selectedItem.ph !== undefined
                                  ? selectedItem.ph
                                  : "—"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">
                                TDS (ppm)
                              </span>
                              <strong className="text-sm text-slate-800 font-extrabold">
                                {selectedItem.tds !== null &&
                                selectedItem.tds !== undefined
                                  ? selectedItem.tds
                                  : "—"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">
                                Salinity
                              </span>
                              <strong className="text-sm text-slate-800 font-extrabold">
                                {selectedItem.salinity !== null &&
                                selectedItem.salinity !== undefined
                                  ? selectedItem.salinity
                                  : "—"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">
                                Fluoride
                              </span>
                              <span
                                className={`text-[10px] font-bold self-start px-1.5 py-0.5 rounded ${selectedItem.hasFluoride?.toLowerCase() === "true" ? "bg-red-500/10 text-red-500" : "bg-emerald-500/10 text-emerald-500"}`}
                              >
                                {selectedItem.hasFluoride?.toLowerCase() ===
                                "true"
                                  ? "Detected"
                                  : "Safe"}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="border-t border-dashed border-slate-200 pt-4">
                          <h5 className="text-[11px] font-extrabold text-slate-600 uppercase tracking-wider mb-2.5">
                            📍 Geographic Telemetry
                          </h5>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">
                                Ward Name
                              </span>
                              <strong className="text-xs text-slate-700 font-bold">
                                {selectedItem.wardName || "Unknown Ward"}{" "}
                                {selectedItem.wardNameKn
                                  ? `(${selectedItem.wardNameKn})`
                                  : ""}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">
                                Corporation
                              </span>
                              <strong className="text-xs text-slate-700 font-bold">
                                {selectedItem.corporation ||
                                  "Unknown Corporation"}
                              </strong>
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[10px] text-slate-400 font-bold">
                                Coordinates
                              </span>
                              <code className="font-mono text-[11px] text-slate-700 bg-white border border-slate-300 px-2 py-1 rounded w-fit inline-block">
                                {selectedItem.lat.toFixed(6)}° N,{" "}
                                {selectedItem.lng.toFixed(6)}° E
                              </code>
                            </div>
                            {selectedItem.wardId && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Ward ID
                                </span>
                                <strong className="text-xs text-slate-700 font-bold">
                                  {selectedItem.wardId}
                                </strong>
                              </div>
                            )}
                            {selectedItem.ac && (
                              <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-400 font-bold">
                                  Assembly Constituency
                                </span>
                                <strong className="text-xs text-slate-700 font-bold">
                                  {selectedItem.ac}{" "}
                                  {selectedItem.acKn
                                    ? `(${selectedItem.acKn})`
                                    : ""}
                                </strong>
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
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="1.5"
                  >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <p className="text-[13.5px] m-0 max-w-[380px] font-semibold">
                    Tick the &quot;Wells&quot; or
                    &quot;Existing Interventions&quot; layers and choose a
                    location to view telemetry measurements here.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Side Section: City Level Projects & Funding Deck (Compact 305px footprint) */}
          {showFloodingHotspots && isRightDeckOpen && (
            <div className="bg-white border border-slate-200/90 rounded-2xl shadow-xs flex flex-col h-[calc(100vh-80px)] min-h-[580px] sticky top-3 overflow-hidden animate-[fadeIn_0.3s_ease-out]">
              {/* Compact Panel Header */}
              <div className="shrink-0 p-3 border-b border-slate-100 bg-gradient-to-br from-slate-50 to-white flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                      Flood Mitigation
                    </span>
                  </div>
                  <button
                    onClick={() => setIsRightDeckOpen(false)}
                    className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md p-1 text-xs transition-colors cursor-pointer border-none bg-transparent leading-none"
                    title="Minimize Deck"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-baseline justify-between text-left">
                  <div>
                    <h3 className="text-sm font-extrabold text-slate-900 m-0 leading-tight">
                      City Level Projects
                    </h3>
                    <p className="text-[10.5px] text-slate-500 m-0 mt-0.5">
                      Select assets &amp; timelines to fund
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[10.5px] font-bold text-teal-700 font-mono bg-teal-50 border border-teal-200/60 px-2 py-0.5 rounded-full">
                      {cityProjectsList.length} Sites
                    </span>
                  </div>
                </div>

                {/* Quick Select Actions & Counter */}
                <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100 text-[10.5px]">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={selectAllAvailableAssets}
                      className="text-teal-700 hover:text-teal-900 font-semibold cursor-pointer underline text-[10.5px] border-none bg-transparent p-0"
                    >
                      Select All
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      onClick={clearAllSelections}
                      className="text-slate-500 hover:text-slate-700 font-semibold cursor-pointer underline text-[10.5px] border-none bg-transparent p-0"
                    >
                      Clear
                    </button>
                  </div>
                  <span className="text-slate-600 font-mono font-bold text-[10px]">
                    {fundSummary.totalAssets} sel ({rs(fundSummary.totalCost)})
                  </span>
                </div>
              </div>

              {/* Scrollable Projects Deck with min-h-0 */}
              <div className="flex-1 min-h-0 overflow-y-auto p-2.5 flex flex-col gap-2.5 custom-scrollbar">
                {cityProjectsList.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs font-semibold">
                    Loading city projects...
                  </div>
                ) : (
                  cityProjectsList.map((proj) => {
                    const projKeys = proj.assets.map(
                      (_, i) => `${proj.id}__${i}`,
                    );
                    const selectedCountInProj = projKeys.filter((k) =>
                      selectedFundPicks.has(k),
                    ).length;
                    const allInProjSelected =
                      selectedCountInProj === proj.assets.length &&
                      proj.assets.length > 0;

                    return (
                      <div
                        key={proj.id}
                        className="shrink-0 w-full bg-white border border-slate-200/90 rounded-xl overflow-hidden text-left shadow-2xs hover:border-teal-300/80"
                      >
                        {/* Compact Project Card Header */}
                        <div className="shrink-0 p-2.5 bg-slate-50/80 border-b border-slate-100 flex flex-col gap-1.5">
                          <div className="flex items-start justify-between gap-1.5">
                            <div className="flex flex-col gap-0.5 overflow-hidden">
                              <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700 truncate block">
                                {proj.loc || "City Project"}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900 m-0 leading-snug truncate block" title={proj.name}>
                                {proj.name}
                              </h4>
                            </div>
                            <button
                              onClick={() =>
                                setActiveDetailView({
                                  type: "site",
                                  id: proj.id,
                                })
                              }
                              className="shrink-0 inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 hover:text-blue-700 border border-blue-200/80 transition-colors cursor-pointer"
                            >
                              <span>Details</span>
                              <span className="text-[10px]">→</span>
                            </button>
                          </div>

                          <div className="flex items-center justify-between text-[10.5px] pt-1 border-t border-slate-200/60">
                            <button
                              onClick={() => toggleProjectAllAssets(proj)}
                              className={`text-[9.5px] font-bold px-2 py-0.5 rounded transition-colors cursor-pointer border ${
                                allInProjSelected
                                  ? "bg-teal-100 text-teal-800 border-teal-300"
                                  : selectedCountInProj > 0
                                    ? "bg-teal-50 text-teal-700 border-teal-200"
                                    : "bg-white text-slate-600 border-slate-200 hover:bg-slate-100"
                              }`}
                            >
                              {allInProjSelected
                                ? "✓ All"
                                : selectedCountInProj > 0
                                  ? `Sel (${selectedCountInProj}/${proj.assets.length})`
                                  : "Select All"}
                            </button>
                            <span className="font-mono text-[10.5px] font-bold text-slate-800">
                              {rs(proj.total)}
                            </span>
                          </div>
                        </div>

                        {/* Assets & Timelines List */}
                        <div className="p-2 flex flex-col gap-1.5 bg-white">
                          {proj.assets.map((a, idx) => {
                            const key = `${proj.id}__${idx}`;
                            const isSelected = selectedFundPicks.has(key);
                            const isCommitted = committedPicks.has(key);

                            return (
                              <div
                                key={idx}
                                onClick={() =>
                                  !isCommitted &&
                                  toggleFundPick(proj.id, idx)
                                }
                                className={`shrink-0 p-2 rounded-lg border transition-all duration-150 cursor-pointer flex flex-col gap-1 ${
                                  isCommitted
                                    ? "bg-slate-100 border-slate-200 opacity-75 cursor-default"
                                    : isSelected
                                      ? "bg-teal-50/90 border-teal-400 shadow-2xs"
                                      : "bg-slate-50/50 border-slate-200/70 hover:border-teal-300 hover:bg-slate-50"
                                }`}
                              >
                                <div className="flex items-start justify-between gap-1.5">
                                  <div className="flex items-start gap-2 overflow-hidden">
                                    <input
                                      type="checkbox"
                                      checked={isSelected || isCommitted}
                                      disabled={isCommitted}
                                      onChange={() =>
                                        !isCommitted &&
                                        toggleFundPick(proj.id, idx)
                                      }
                                      className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 accent-teal-600 cursor-pointer shrink-0"
                                    />
                                    <div className="flex flex-col overflow-hidden">
                                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1 flex-wrap leading-tight">
                                        {a.n}
                                        <span
                                          className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded ${
                                            a.t === "blue"
                                              ? "bg-[#E2EEF4] text-[#1D5E8C]"
                                              : a.t === "green"
                                                ? "bg-[#E7EFDF] text-[#3E6325]"
                                                : "bg-[#E5E9EB] text-[#475760]"
                                          }`}
                                        >
                                          {a.t}
                                        </span>
                                        {isCommitted && (
                                          <span className="text-[8px] font-extrabold uppercase px-1 py-0.2 rounded bg-purple-100 text-purple-700">
                                            Funded
                                          </span>
                                        )}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {/* Timeline & Cost Row */}
                                <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100 text-slate-600">
                                  <span className="flex items-center gap-1 font-mono text-slate-500">
                                    <span>⏱️</span>
                                    <strong className="text-slate-700">
                                      {a.timeline && a.timeline !== "—"
                                        ? `${a.timeline} ${/^\d+(\.\d+)?$/.test(String(a.timeline).trim()) ? (parseFloat(a.timeline) === 1 ? "mo" : "mos") : ""}`
                                        : "Planning"}
                                    </strong>
                                  </span>
                                  <span className="font-mono text-[11px] font-bold text-teal-800">
                                    {a.cost > 0 ? rs(a.cost) : "TBD"}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Compact Sticky Bottom Action Footer */}
              <div className="shrink-0 p-2.5 bg-white border-t border-slate-200 shadow-md flex flex-col gap-2">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-600 font-semibold">
                    {fundSummary.totalAssets} asset{fundSummary.totalAssets !== 1 ? "s" : ""}
                  </span>
                  <div className="text-right">
                    <strong className="text-xs font-bold font-mono text-teal-800">
                      {rs(fundSummary.totalCost)}
                    </strong>
                  </div>
                </div>

                <button
                  onClick={() => setShowFunderModal(true)}
                  disabled={fundSummary.totalAssets === 0}
                  className={`w-full py-2 px-3 rounded-lg text-xs font-bold text-white transition-all duration-150 cursor-pointer shadow-xs flex items-center justify-center gap-1.5 ${
                    fundSummary.totalAssets === 0
                      ? "bg-slate-300 opacity-60 cursor-not-allowed"
                      : "bg-[#C8743C] hover:bg-[#b8602c] hover:shadow active:scale-[0.99]"
                  }`}
                >
                  <span>Fund Selected</span>
                  <span>→</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Floating Re-Open Button when Deck is Minimized */}
        {showFloodingHotspots && !isRightDeckOpen && (
          <button
            onClick={() => setIsRightDeckOpen(true)}
            className="fixed bottom-6 right-6 z-[500] bg-[#C8743C] text-white px-4 py-2.5 rounded-full font-bold text-xs shadow-lg hover:shadow-xl hover:bg-[#b8602c] transition-all flex items-center gap-2 cursor-pointer border border-white/40 animate-[bounceIn_0.3s_ease-out]"
          >
            <span>🌊 View City Projects &amp; Fund Deck</span>
            <span className="bg-white/20 px-2 py-0.5 rounded-full text-[10px]">
              {fundSummary.totalAssets} selected
            </span>
          </button>
        )}

        {/* Funder Commitment & Term Sheet Modal */}
        {showFunderModal && (
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[1000] flex items-center justify-center p-4"
            onClick={() => setShowFunderModal(false)}
          >
            <div
              className="bg-white rounded-3xl shadow-2xl w-full max-w-[560px] max-h-[90vh] flex flex-col overflow-hidden animate-[fadeIn_0.2s_ease-out]"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="px-6 py-5 bg-gradient-to-br from-slate-50 to-white border-b border-slate-100 relative text-left">
                <span className="font-mono text-[10px] uppercase tracking-widest text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                  Funder Term Sheet
                </span>
                <h3 className="text-lg font-bold text-slate-900 mt-1 mb-0.5">
                  Commit CSR Funding for Flood Mitigation
                </h3>
                <p className="text-xs text-slate-500 m-0">
                  Selected {fundSummary.totalAssets} assets across{" "}
                  {fundSummary.projectsCount} projects
                </p>
                <button
                  onClick={() => setShowFunderModal(false)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 text-lg cursor-pointer border-none bg-transparent"
                >
                  ✕
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 overflow-y-auto flex flex-col gap-4 text-left custom-scrollbar">
                {commitSuccess ? (
                  <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-2xl text-center flex flex-col items-center gap-3">
                    <span className="text-4xl">🎉</span>
                    <h4 className="text-base font-bold text-emerald-900 m-0">
                      Funding Commitment Confirmed!
                    </h4>
                    <p className="text-xs text-emerald-700 leading-relaxed max-w-[380px] m-0">
                      Thank you{" "}
                      <strong>{funderFormData.orgName || "Funder"}</strong>! Your
                      commitment of{" "}
                      <strong>{rs(fundSummary.totalCost)}</strong> has been
                      recorded for the selected flood mitigation assets.
                    </p>
                    <button
                      onClick={() => {
                        setCommitSuccess(false);
                        setShowFunderModal(false);
                      }}
                      className="mt-2 px-5 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 cursor-pointer border-none"
                    >
                      Done
                    </button>
                  </div>
                ) : (
                  <>
                    {/* Selected Summary Card */}
                    <div className="p-4 rounded-2xl bg-teal-50/70 border border-teal-200/80 flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-mono uppercase font-bold text-teal-800">
                          Total Commitment Amount
                        </span>
                        <strong className="text-2xl font-bold font-mono text-teal-950">
                          {rs(fundSummary.totalCost)}
                        </strong>
                      </div>
                      <span className="text-xs font-bold text-teal-700 bg-white px-3 py-1.5 rounded-xl border border-teal-200 shadow-2xs">
                        {fundSummary.totalAssets} Interventions
                      </span>
                    </div>

                    {/* Funder Form */}
                    <div className="flex flex-col gap-3">
                      <div>
                        <label className="text-[11px] font-bold text-slate-700 block mb-1">
                          Organization / Corporate Name *
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Infosys Foundation, Wipro Cares, Tata Trusts"
                          value={funderFormData.orgName}
                          onChange={(e) =>
                            setFunderFormData({
                              ...funderFormData,
                              orgName: e.target.value,
                            })
                          }
                          className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            CSR Sector Focus
                          </label>
                          <select
                            value={funderFormData.csrSector}
                            onChange={(e) =>
                              setFunderFormData({
                                ...funderFormData,
                                csrSector: e.target.value,
                              })
                            }
                            className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                          >
                            <option value="Water Security & Flood Mitigation">
                              Water Security &amp; Flood Mitigation
                            </option>
                            <option value="Climate Resilience & Urban Ecology">
                              Climate Resilience &amp; Urban Ecology
                            </option>
                            <option value="Schedule VII - Environmental Sustainability">
                              Schedule VII - Sustainability
                            </option>
                            <option value="Community Infrastructure">
                              Community Infrastructure
                            </option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[11px] font-bold text-slate-700 block mb-1">
                            Contact Email *
                          </label>
                          <input
                            type="email"
                            placeholder="csr-lead@company.com"
                            value={funderFormData.email}
                            onChange={(e) =>
                              setFunderFormData({
                                ...funderFormData,
                                email: e.target.value,
                              })
                            }
                            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* List of Selected Assets */}
                    <div className="flex flex-col gap-1.5 mt-1">
                      <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                        Committed Allocation Breakdown:
                      </span>
                      <div className="max-h-[160px] overflow-y-auto border border-slate-200 rounded-xl p-2 bg-slate-50/50 flex flex-col gap-1.5 custom-scrollbar text-xs">
                        {cityProjectsList.map((p) => {
                          const pickedInThisProj = p.assets
                            .map((a, i) => ({ a, i }))
                            .filter(({ i }) =>
                              selectedFundPicks.has(`${p.id}__${i}`),
                            );

                          if (pickedInThisProj.length === 0) return null;

                          return (
                            <div
                              key={p.id}
                              className="p-2 bg-white rounded-lg border border-slate-200/80 flex flex-col gap-1"
                            >
                              <div className="font-bold text-slate-800 text-[11.5px]">
                                {p.name}
                              </div>
                              {pickedInThisProj.map(({ a, i }) => (
                                <div
                                  key={i}
                                  className="flex justify-between items-center text-[10.5px] text-slate-600 pl-2"
                                >
                                  <span>
                                    • {a.n} (⏱️ {a.timeline})
                                  </span>
                                  <span className="font-mono font-bold text-teal-800">
                                    {rs(a.cost)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 justify-end pt-3 border-t border-slate-100">
                      <button
                        type="button"
                        onClick={() => setShowFunderModal(false)}
                        className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer border-none bg-transparent"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Commit selected picks
                          setCommittedPicks(
                            (prev) =>
                              new Set([...prev, ...selectedFundPicks]),
                          );
                          setCommitSuccess(true);
                        }}
                        disabled={
                          !funderFormData.orgName.trim() ||
                          !funderFormData.email.trim()
                        }
                        className={`px-5 py-2.5 text-xs font-bold text-white rounded-xl cursor-pointer transition-all border-none ${
                          !funderFormData.orgName.trim() ||
                          !funderFormData.email.trim()
                            ? "bg-slate-300 cursor-not-allowed"
                            : "bg-[#C8743C] hover:bg-[#b8602c] shadow-sm"
                        }`}
                      >
                        Confirm CSR Funding →
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DataLayersView;
