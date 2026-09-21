import { parseCoordinate } from "./geoUtils";

// Category resolution based on project tags (Intervention Type full forms)
export const getProjectCategoryInfo = (tags) => {
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

// Site Typology resolution: Park, Lake, Roads
export const getProjectSiteType = (tags, projName = "", details = "", type = "") => {
  const text = `${projName} ${tags} ${details} ${type}`.toLowerCase();
  if (
    text.includes("drain") ||
    text.includes("kaluve") ||
    text.includes("swd") ||
    text.includes("channel") ||
    text.includes("culvert") ||
    text.includes("k100") ||
    text.includes("road") ||
    text.includes("layout") ||
    text.includes("street") ||
    text.includes("campus")
  ) {
    return {
      id: "road",
      name: "Roads",
      icon: "🛣️",
      color: "#d97706",
      bg: "#fef3c7",
      border: "#fde68a",
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
      name: "Park",
      icon: "🌳",
      color: "#16a34a",
      bg: "#dcfce7",
      border: "#bbf7d0",
    };
  }
  if (
    text.includes("lake") ||
    text.includes("kere") ||
    text.includes("tank") ||
    text.includes("water body") ||
    text.includes("pond")
  ) {
    return {
      id: "lake",
      name: "Lake",
      icon: "🌊",
      color: "#0284c7",
      bg: "#e0f2fe",
      border: "#bae6fd",
    };
  }
  return {
    id: "road",
    name: "Roads",
    icon: "🛣️",
    color: "#d97706",
    bg: "#fef3c7",
    border: "#fde68a",
  };
};

// Intervention Typology resolution: Bioswale, Raingarden, Detention pond
export const getProjectInterventionTypology = (tags, projName = "", details = "", type = "") => {
  const text = `${projName} ${tags} ${details} ${type}`.toLowerCase();
  if (
    text.includes("bioswale") ||
    text.includes("swale") ||
    text.includes("waterway") ||
    text.includes("k100") ||
    text.includes("drain") ||
    text.includes("channel") ||
    text.includes("kaluve") ||
    text.includes("culvert")
  ) {
    return {
      id: "bioswale",
      name: "Bioswale",
      icon: "🌱",
      color: "#16a34a",
      bg: "#dcfce7",
      border: "#bbf7d0",
    };
  }
  if (
    text.includes("raingarden") ||
    text.includes("rain garden") ||
    text.includes("rainwater") ||
    text.includes("groundwater") ||
    text.includes("iuwm") ||
    text.includes("recharge") ||
    text.includes("bioretention") ||
    text.includes("theme park")
  ) {
    return {
      id: "raingarden",
      name: "Raingarden",
      icon: "🪴",
      color: "#059669",
      bg: "#ecfdf5",
      border: "#a7f3d0",
    };
  }
  return {
    id: "detention",
    name: "Detention pond",
    icon: "💧",
    color: "#0284c7",
    bg: "#e0f2fe",
    border: "#bae6fd",
  };
};

// BGG Framework resolution directly mapped from Site Typology:
// - Blue: Lakes & Water Bodies
// - Green: Parks & Green Spaces
// - Grey: Roads, Layouts & Campuses (+ Storm Drains)
export const getProjectBGGType = (siteTypeOrTags, projName = "", details = "", type = "") => {
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
  // road maps to Grey
  return {
    id: "grey",
    name: "Grey Infrastructure",
    subtitle: "Roads & Campuses",
    icon: "⚫",
    color: "#475569",
    bg: "#f1f5f9",
    border: "#cbd5e1",
  };
};

// Normalize Project Schema from both API and Fallback JSON/CSV
export const normalizeProject = (p) => {
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
  const interventionTypologyInfo = getProjectInterventionTypology(tagsVal, projNameVal, detailsVal, typeVal);
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
    interventionTypologyInfo: interventionTypologyInfo,
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
export const normalizeWell = (w) => {
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

// Color mappings - matching the layer checkboxes exactly for differentiation
export const getProjectColor = (status, tags) => {
  if (tags) {
    return getProjectCategoryInfo(tags).color;
  }
  return "#3b82f6"; // Premium blue color matching projects checkbox
};

export const getWellColor = (wellType) => {
  return "#a855f7"; // Violet/purple color matching wells checkbox
};
