import gbaCorporationsGeo from "@/data/gba_corporations.json";

// Utility helper to parse a CSV text string into an array of objects, handling quoted values correctly
export const parseCSV = (csvText) => {
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
export const parseCoordinate = (val) => {
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
export const pointInPolygon = (lat, lng, polygonCoords) => {
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
export const isPointInGeometry = (lat, lng, geometry) => {
  if (!geometry) return false;
  const { type, coordinates } = geometry;
  if (type === "Polygon") {
    return pointInPolygon(lat, lng, coordinates[0]);
  } else if (type === "MultiPolygon") {
    return coordinates.some((polygon) => pointInPolygon(lat, lng, polygon[0]));
  }
  return false;
};

// Helper to get corporation name ('East' | 'West' | 'North' | 'South' | 'Central') for a given lat, lng
export const getCorporationForPoint = (lat, lng, fallbackZone = "") => {
  if (lat == null || lng == null || isNaN(lat) || isNaN(lng)) return "Central";

  if (gbaCorporationsGeo && gbaCorporationsGeo.features) {
    for (const feat of gbaCorporationsGeo.features) {
      if (isPointInGeometry(lat, lng, feat.geometry)) {
        return feat.properties.name;
      }
    }
  }

  // Heuristic fallback if on edge of boundary or unmapped
  const z = String(fallbackZone || "").toLowerCase();
  if (z.includes("east") || z.includes("mahadevapura")) return "East";
  if (z.includes("west") || z.includes("rr nagar") || z.includes("dasarahalli")) return "West";
  if (z.includes("north") || z.includes("yelahanka")) return "North";
  if (z.includes("south") || z.includes("bommanahalli")) return "South";
  return "Central";
};
