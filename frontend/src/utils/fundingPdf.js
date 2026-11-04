import { jsPDF } from "jspdf";

const PAGE_W = 595;
const PAGE_H = 842;
const MARGIN = 40;
const BOTTOM = 40;

const C = {
  green: [52, 119, 69],
  ink: [31, 42, 36],
  muted: [110, 100, 85],
  white: [255, 255, 255],
  rule: [199, 214, 189],
  barBg: [242, 247, 240],
  edge: [96, 84, 66],
  grassTop: [168, 200, 126],
  grassEdge: [110, 146, 80],
  soilCut: [204, 170, 128],
  soilSide: [176, 140, 100],
  // Rain garden
  rgFloor: [128, 94, 64],
  rgSlopeFar: [140, 178, 100],
  rgSlopeEnd: [126, 166, 90],
  rgSlopeNear: [152, 188, 112],
  bushDark: [52, 116, 62],
  bush: [74, 144, 76],
  bushLight: [122, 178, 86],
  flower: [214, 118, 150],
  flowerAlt: [240, 196, 80],
  // Bioswale
  bsFloor: [112, 156, 80],
  bsWallFar: [134, 174, 96],
  bsWallNear: [150, 188, 110],
  bsStone: [166, 162, 152],
  // Infiltration pit
  gravelTop: [196, 194, 186],
  gravelCut: [182, 180, 172],
  stoneEdge: [120, 118, 110],
  // Detention / retention basin
  dbFloor: [118, 98, 74],
  dbSlopeNear: [146, 182, 108],
  dbSlopeFar: [130, 170, 96],
  dbSlopeEnd: [120, 160, 88],
  waterTop: [124, 176, 214],
  waterCut: [98, 152, 198],
  waterEdge: [70, 120, 170],
  ripple: [196, 224, 242],
  // Percolation well
  concrete: [196, 194, 188],
  concreteEdge: [128, 126, 120],
  wellInner: [96, 102, 104],
  topsoil: [160, 122, 84],
  flow: [46, 110, 180],
  // Detail table
  rowAlt: [248, 250, 246],
};

const EMOJI = /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}]|\u{FE0F}|\u{200D}/gu;

// Removes emoji and fixes spacing such as "Watershed- Borewell"
const tidy = (value) =>
  String(value ?? "")
    .replace(EMOJI, "")
    .replace(/(\w)-\s+/g, "$1 - ")
    .replace(/\s*·\s*(·\s*)+/g, " · ")
    .replace(/\s{2,}/g, " ")
    .trim();

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

// Writes amounts in words: 30,00,000 or "₹30 L" becomes ₹30 Lakh and
// 2,50,00,000 or "₹2.50 Cr" becomes ₹2.5 Crore. Amounts below one lakh stay
// in full. Text without a number (TBD) is shown as it is.
function shortAmount(value) {
  if (value == null || value === "") return "";
  const trim = (n) => Number(n.toFixed(2)).toString();
  if (typeof value === "string") {
    const unit = value.match(/^\s*(?:₹|rs\.?)?\s*([\d,]+(?:\.\d+)?)\s*(cr|crore|crores|l|lakh|lakhs|lac)\b\.?\s*$/i);
    if (unit) {
      const amount = trim(Number(unit[1].replace(/,/g, "")));
      return `₹${amount} ${/^c/i.test(unit[2]) ? "Crore" : "Lakh"}`;
    }
    if (/[a-z]/i.test(value.replace(/^\s*(₹|rs\.?)\s*/i, ""))) return value;
  }
  const digits = String(value).replace(/[^0-9.]/g, "");
  const num = typeof value === "number" ? value : Number(digits);
  if (!digits && typeof value !== "number") return String(value);
  if (!Number.isFinite(num)) return String(value);
  if (num >= 1e7) return `₹${trim(num / 1e7)} Crore`;
  if (num >= 1e5) return `₹${trim(num / 1e5)} Lakh`;
  return `₹${num.toLocaleString("en-IN")}`;
}

function dimensionLabel(label, metres) {
  if (label) return label;
  if (metres == null) return "";
  return `${metres} m`;
}

// Maps the asset type in your data to one of the drawings
function assetKind(type) {
  const key = String(type || "").toLowerCase().replace(/[^a-z]/g, "");
  if (key === "raingarden") return "raingarden";
  if (key === "bioswale") return "bioswale";
  if (key.startsWith("infiltration")) return "infiltration";
  if (key.includes("detention") || key.includes("retention")) return "basin";
  if (key.startsWith("percolation")) return "well";
  return null;
}

const KIND_INFO = {
  raingarden: { title: "Rain garden", lMin: 0.8, lMax: 1.5, lDefault: 1.3, dMin: 0.3, dMax: 0.5, dDefault: 0.35 },
  bioswale: { title: "Bioswale", lMin: 2.4, lMax: 3.2, lDefault: 2.8, dMin: 0.38, dMax: 0.6, dDefault: 0.45 },
  infiltration: { title: "Infiltration pit", lMin: 0.7, lMax: 1.8, lDefault: 1, dMin: 0.6, dMax: 1.4, dDefault: 1 },
  basin: { title: "Detention / retention basin", lMin: 0.8, lMax: 1.4, lDefault: 1, dMin: 0.2, dMax: 0.4, dDefault: 0.3 },
  well: { title: "Percolation well", dMin: 1.6, dMax: 2.6, dDefault: 2 },
};

function seededRandom(text) {
  let seed = 0;
  for (const ch of String(text)) seed = (seed * 31 + ch.charCodeAt(0)) % 233280;
  seed = seed || 7;
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}

// Converts a font file (for example /fonts/Poppins-Regular.ttf) into the
// base64 text jsPDF needs. Use a font that includes the rupee sign.
export async function loadFontBase64(url) {
  const bytes = new Uint8Array(await (await fetch(url)).arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

const FONT_BASE = `${import.meta.env?.BASE_URL ?? "/"}fonts/`;
let defaultFonts = null;

// Loads Poppins from public/fonts once. Falls back to the built-in font if it cannot be fetched.
function loadDefaultFonts() {
  if (!defaultFonts) {
    defaultFonts = Promise.all([
      loadFontBase64(`${FONT_BASE}Poppins-Regular.ttf`),
      loadFontBase64(`${FONT_BASE}Poppins-SemiBold.ttf`),
    ])
      .then(([regular, bold]) => ({ regular, bold }))
      .catch(() => {
        defaultFonts = null;
        return null;
      });
  }
  return defaultFonts;
}

export function createFundingDoc({
  heading = "Funding commitment",
  meta = [],
  projects = [],
  totalLabel = "Total commitment",
  totalAmount = "",
  fonts = null, // { regular: base64, bold: base64 }
} = {}) {
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });

  let family = "helvetica";
  let rupee = false;
  if (fonts?.regular) {
    doc.addFileToVFS("Body-Regular.ttf", fonts.regular);
    doc.addFont("Body-Regular.ttf", "Body", "normal");
    doc.addFileToVFS("Body-Bold.ttf", fonts.bold || fonts.regular);
    doc.addFont("Body-Bold.ttf", "Body", "bold");
    family = "Body";
    rupee = true;
  }
  const clean = (value) => {
    const plain = String(value ?? "").replace(EMOJI, "");
    return rupee ? plain : plain.replace(/₹\s?/g, "Rs ");
  };

  // ---------- primitives ----------
  const setFill = (c) => doc.setFillColor(c[0], c[1], c[2]);
  const setDraw = (c) => doc.setDrawColor(c[0], c[1], c[2]);
  const setFont = (size, bold) => {
    doc.setFont(family, bold ? "bold" : "normal");
    doc.setFontSize(size);
  };
  const text = (value, x, yy, { size = 10, bold = false, color = C.ink, align = "left" } = {}) => {
    setFont(size, bold);
    doc.setTextColor(color[0], color[1], color[2]);
    doc.text(clean(value), x, yy, { align });
  };
  const textWidth = (value, size, bold) => {
    setFont(size, bold);
    return doc.getTextWidth(clean(value));
  };
  const poly = (pts, fill, stroke = null, width = 0.5) => {
    if (pts.length < 3) return;
    const segments = [];
    for (let i = 1; i < pts.length; i += 1) segments.push([pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]]);
    if (fill) setFill(fill);
    if (stroke) {
      setDraw(stroke);
      doc.setLineWidth(width);
    }
    doc.lines(segments, pts[0][0], pts[0][1], [1, 1], fill && stroke ? "FD" : fill ? "F" : "S", true);
  };
  const seg = (a, b, color, width = 0.5, dash = null) => {
    setDraw(color);
    doc.setLineWidth(width);
    if (dash) doc.setLineDashPattern(dash, 0);
    doc.line(a[0], a[1], b[0], b[1]);
    if (dash) doc.setLineDashPattern([], 0);
  };
  const arrowHead = (tip, from, color, size = 5, half = 2.2) => {
    const dx = tip[0] - from[0];
    const dy = tip[1] - from[1];
    const len = Math.hypot(dx, dy) || 1;
    const ux = dx / len;
    const uy = dy / len;
    const bx = tip[0] - ux * size;
    const by = tip[1] - uy * size;
    poly([tip, [bx - uy * half, by + ux * half], [bx + uy * half, by - ux * half]], color);
  };
  const dimensionLine = (a, b) => {
    seg(a, b, C.ink, 0.8);
    arrowHead(a, b, C.ink);
    arrowHead(b, a, C.ink);
  };
  const chip = (value, x, yy, align = "left") => {
    const w = textWidth(value, 8.5, true) + 12;
    const h = 16;
    const left = align === "right" ? x - w : align === "center" ? x - w / 2 : x;
    setFill(C.white);
    setDraw(C.green);
    doc.setLineWidth(0.8);
    doc.roundedRect(left, yy - h / 2, w, h, 3, 3, "FD");
    text(value, left + 6, yy + 3, { size: 8.5, bold: true });
  };

  // ---------- page flow ----------
  let y = 0;
  const header = () => {
    setFill(C.green);
    doc.rect(0, 0, PAGE_W, 28, "F");
    text("CLIMATE SOLUTIONS", MARGIN, 18, { size: 9, bold: true, color: C.white });
    text(heading, PAGE_W - MARGIN, 18, { size: 9, color: C.white, align: "right" });
    y = 52;
  };
  const ensure = (height) => {
    if (y + height > PAGE_H - BOTTOM) {
      doc.addPage();
      header();
    }
  };
  const write = (value, size = 10, bold = false, color = C.ink, indent = 0) => {
    setFont(size, bold);
    doc.splitTextToSize(clean(value), PAGE_W - MARGIN * 2 - indent).forEach((lineText) => {
      ensure(size + 5);
      y += size + 4;
      text(lineText, MARGIN + indent, y, { size, bold, color });
    });
  };
  const rule = () => {
    ensure(12);
    y += 4;
    seg([MARGIN, y], [PAGE_W - MARGIN, y], C.rule, 0.6);
    y += 10;
  };
  const LABEL_W = 110;
  const ROW_LINE = 13;
  const detailLines = (value) => {
    setFont(9.5, true);
    return doc.splitTextToSize(clean(value), PAGE_W - MARGIN * 2 - LABEL_W - 24);
  };
  const detailsHeight = (rows) => rows.reduce((sum, [, value]) => sum + detailLines(value).length * ROW_LINE + 8, 0);
  // One label and value per row, with alternating shading
  const details = (rows) => {
    rows.forEach(([label, value], index) => {
      const lines = detailLines(value);
      const h = lines.length * ROW_LINE + 8;
      ensure(h);
      if (index % 2 === 0) {
        setFill(C.rowAlt);
        doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, h, "F");
      }
      text(label, MARGIN + 8, y + 14, { size: 9, color: C.muted });
      lines.forEach((lineText, i) => text(lineText, MARGIN + 8 + LABEL_W, y + 14 + i * ROW_LINE, { size: 9.5, bold: true }));
      y += h;
      seg([MARGIN, y], [PAGE_W - MARGIN, y], C.rule, 0.4);
    });
  };

  // ---------- isometric drawing ----------
  // Axes: x = length (towards the back right), y = width (towards the back left), z = up.
  // The block is cut at x = 0, so the lower-left face shows the profile across the width.
  const c30 = Math.cos(Math.PI / 6);
  const raw = (x, yy, z) => [(x - yy) * c30, (x + yy) * 0.5 + z];
  const scene = (title, xs, ys, zs, { maxH = 230, padT = 8, padB = 36 } = {}) => {
    const corners = [];
    xs.forEach((x) => ys.forEach((yy) => zs.forEach((z) => corners.push(raw(x, yy, z)))));
    const us = corners.map((p) => p[0]);
    const vs = corners.map((p) => p[1]);
    const minU = Math.min(...us);
    const maxU = Math.max(...us);
    const minV = Math.min(...vs);
    const maxV = Math.max(...vs);
    const padL = 84;
    const padR = 40;
    const sceneW = PAGE_W - MARGIN * 2;
    const k = Math.min((sceneW - padL - padR) / (maxU - minU), (maxH - padT - padB) / (maxV - minV));
    const sceneH = (maxV - minV) * k + padT + padB;

    ensure(sceneH + 20);
    y += 2;
    write(title, 9.5, true, C.green);

    const top = y + 4;
    const spare = sceneW - padL - padR - (maxU - minU) * k;
    const ox = MARGIN + padL + spare / 2 - minU * k;
    const oy = top + padT + maxV * k;
    const S = (x, yy, z) => {
      const [u, v] = raw(x, yy, z);
      return [ox + u * k, oy - v * k];
    };
    const face = (pts, fill, stroke = C.edge, width = 0.45) => poly(pts.map((p) => S(...p)), fill, stroke, width);
    return { S, face, k, done: () => { y = top + sceneH; } };
  };
  const pebbles = (S, k, rand, y0, y1, z0, z1, density = 14) => {
    const n = Math.min(400, Math.round(((y1 - y0) * (z1 - z0) * k * k) / density));
    for (let i = 0; i < n; i += 1) {
      const r = 1 + rand() * 1.4;
      const yy = y0 + r / k + rand() * Math.max(0, y1 - y0 - (2 * r) / k);
      const z = z0 + r / k + rand() * Math.max(0, z1 - z0 - (2 * r) / k);
      const p = S(0, yy, z);
      const g = 145 + Math.round(rand() * 75);
      setFill([g, g - 2, g - 8]);
      setDraw(C.stoneEdge);
      doc.setLineWidth(0.2);
      doc.circle(p[0], p[1], r, "FD");
    }
  };
  const flowArrow = (a, b) => {
    seg(a, b, C.flow, 0.9);
    arrowHead(b, a, C.flow, 4, 1.8);
  };

  const drawAsset3D = (asset, kind) => {
    const info = KIND_INFO[kind];
    const rand = seededRandom(`${asset.name}|${kind}`);
    const W = asset.widthM;
    const L = asset.lengthM > 0 ? asset.lengthM : null;
    const D = asset.depthM > 0 ? asset.depthM : null;
    const widthLabel = dimensionLabel(asset.widthLabel, asset.widthM);
    const depthLabel = dimensionLabel(asset.depthLabel, asset.depthM);
    const lengthLabel = dimensionLabel(asset.lengthLabel, asset.lengthM);

    const Lreal = L ?? W * info.lDefault;
    const Ld = clamp(Lreal, W * info.lMin, W * info.lMax);
    const Dreal = D ?? W * info.dDefault;
    const Dd = clamp(Dreal, W * info.dMin, W * info.dMax);

    const m = W * 0.3; // ground beside the asset
    const mx = kind === "bioswale" ? 0 : W * 0.3; // ground behind the asset
    const Lb = Ld + mx;
    const T = Dd + W * (kind === "infiltration" ? 0.18 : 0.24);
    const sloped = kind === "raingarden" || kind === "basin";
    const iy = kind === "raingarden" ? Math.min(Dd * 1.6, W * 0.3) : kind === "basin" ? Math.min(Dd * 1.2, W * 0.26) : kind === "bioswale" ? W * 0.28 : 0;
    const ix = kind === "raingarden" ? Math.min(Dd * 1.6, Ld * 0.22) : kind === "basin" ? Math.min(Dd * 1.2, Ld * 0.26) : 0;
    const bushH = kind === "raingarden" ? Dd * 0.95 : 0;
    const wet = 0.55; // water stands in the lower part of the basin
    const zw = -Dd * wet;

    const { S, face, k, done } = scene(info.title, [0, Lb], [-m, W + m], [-T, Math.max(0, -Dd + bushH)]);

    // Faint ground shadow
    face([[0, -m, -T], [Lb, -m, -T], [Lb, W + m, -T], [0, W + m, -T]], [236, 236, 230], null);

    if (sloped) {
      // Basin with gently sloped sides on all closed edges
      const pal = kind === "basin"
        ? { near: C.dbSlopeNear, floor: C.dbFloor, far: C.dbSlopeFar, end: C.dbSlopeEnd }
        : { near: C.rgSlopeNear, floor: C.rgFloor, far: C.rgSlopeFar, end: C.rgSlopeEnd };
      face([[0, 0, 0], [Ld, 0, 0], [Ld - ix, iy, -Dd], [0, iy, -Dd]], pal.near);
      face([[0, iy, -Dd], [Ld - ix, iy, -Dd], [Ld - ix, W - iy, -Dd], [0, W - iy, -Dd]], pal.floor);
      face([[0, W, 0], [Ld, W, 0], [Ld - ix, W - iy, -Dd], [0, W - iy, -Dd]], pal.far);
      face([[Ld, 0, 0], [Ld, W, 0], [Ld - ix, W - iy, -Dd], [Ld - ix, iy, -Dd]], pal.end);
    }
    if (kind === "basin") {
      // Inlet pipe on the far slope, with rock protection below it
      const pipe = S(Ld * 0.55, W - iy * 0.2, -Dd * 0.2);
      const pr = clamp(W * 0.05 * k, 4, 9);
      for (let i = 0; i < 9; i += 1) {
        const f = 0.25 + rand() * (wet - 0.25);
        const p = S(Ld * 0.55 + (rand() - 0.5) * W * 0.16, W - iy * f, -Dd * f);
        const r = 1.4 + rand() * 1.6;
        setFill(C.bsStone);
        setDraw(C.stoneEdge);
        doc.setLineWidth(0.25);
        doc.ellipse(p[0], p[1], r, r * 0.62, "FD");
      }
      setFill(C.concrete);
      setDraw(C.concreteEdge);
      doc.setLineWidth(0.5);
      doc.ellipse(pipe[0], pipe[1], pr, pr * 0.8, "FD");
      setFill(C.wellInner);
      doc.ellipse(pipe[0], pipe[1], pr * 0.62, pr * 0.5, "F");
      // Standing water
      face([[0, iy * wet, zw], [Ld - ix * wet, iy * wet, zw], [Ld - ix * wet, W - iy * wet, zw], [0, W - iy * wet, zw]], C.waterTop, C.waterEdge, 0.5);
      for (let i = 0; i < 5; i += 1) {
        const x0 = (Ld - ix) * (0.15 + rand() * 0.6);
        const y0 = iy + (W - 2 * iy) * (0.15 + rand() * 0.7);
        seg(S(x0, y0, zw), S(x0 + Ld * 0.08, y0, zw), C.ripple, 0.8);
      }
      flowArrow(S(Ld * 0.55, W - iy * 0.3, -Dd * 0.3 + 6 / k), S(Ld * 0.5, W - iy * 0.75, zw + 2 / k));
    } else if (kind === "bioswale") {
      // Long grass-lined channel with a trapezoidal profile, running through the block
      face([[0, 0, 0], [Lb, 0, 0], [Lb, iy, -Dd], [0, iy, -Dd]], C.bsWallNear);
      face([[0, iy, -Dd], [Lb, iy, -Dd], [Lb, W - iy, -Dd], [0, W - iy, -Dd]], C.bsFloor);
      face([[0, W, 0], [Lb, W, 0], [Lb, W - iy, -Dd], [0, W - iy, -Dd]], C.bsWallFar);
      // A line of small stones along the channel bed
      const stones = Math.round(Lb / (W * 0.12));
      for (let i = 0; i < stones; i += 1) {
        const p = S((i + 0.5 + (rand() - 0.5) * 0.4) * (Lb / stones), W / 2 + (rand() - 0.5) * (W - 2 * iy) * 0.5, -Dd);
        const r = (0.7 + rand() * 0.6) * Math.max(1.2, W * 0.025 * k);
        setFill(C.bsStone);
        setDraw(C.stoneEdge);
        doc.setLineWidth(0.25);
        doc.ellipse(p[0], p[1], r, r * 0.58, "FD");
      }
    }

    // Ground surface
    if (kind === "bioswale") {
      face([[0, -m, 0], [Lb, -m, 0], [Lb, 0, 0], [0, 0, 0]], C.grassTop, C.grassEdge);
      face([[0, W, 0], [Lb, W, 0], [Lb, W + m, 0], [0, W + m, 0]], C.grassTop, C.grassEdge);
    } else {
      face([[0, -m, 0], [Lb, -m, 0], [Lb, W + m, 0], [0, W + m, 0], [0, W, 0], [Ld, W, 0], [Ld, 0, 0], [0, 0, 0]], C.grassTop, C.grassEdge);
    }

    if (kind === "infiltration") {
      face([[0, 0, 0], [Ld, 0, 0], [Ld, W, 0], [0, W, 0]], C.gravelTop);
      const n = Math.round((Ld * W) / (W * W) * 70);
      for (let i = 0; i < n; i += 1) {
        const p = S(Ld * (0.03 + rand() * 0.94), W * (0.03 + rand() * 0.94), 0);
        const r = 1.1 + rand() * 1.3;
        const g = 150 + Math.round(rand() * 70);
        setFill([g, g - 2, g - 8]);
        setDraw(C.stoneEdge);
        doc.setLineWidth(0.2);
        doc.ellipse(p[0], p[1], r, r * 0.58, "FD");
      }
    }

    // Side face (right)
    face([[0, -m, 0], [Lb, -m, 0], [Lb, -m, -T], [0, -m, -T]], C.soilSide);

    // Planting in the rain garden, back to front
    if (kind === "raingarden") {
      const spots = [];
      const cols = 4;
      const rows = 3;
      for (let r = 0; r < rows; r += 1) {
        for (let cIdx = 0; cIdx < cols; cIdx += 1) {
          const x = (Ld - ix) * ((cIdx + 0.5 + (r % 2 ? 0.25 : -0.1)) / cols);
          const yy = Math.max(iy, Dd) + (W - iy - Math.max(iy, Dd)) * ((r + 0.5) / rows);
          spots.push([clamp(x, (Ld - ix) * 0.08, (Ld - ix) * 0.92), yy]);
        }
      }
      spots.sort((a, b) => b[0] + b[1] - (a[0] + a[1]));
      const r0 = clamp(W * 0.075 * k, 3, 9);
      spots.forEach(([x, yy], index) => {
        const b = S(x, yy, -Dd);
        const r = r0 * (0.85 + rand() * 0.3);
        setFill(C.bushDark);
        doc.circle(b[0] - r * 0.55, b[1] - r * 0.7, r * 0.8, "F");
        setFill(C.bush);
        doc.circle(b[0] + r * 0.5, b[1] - r * 0.75, r * 0.78, "F");
        setFill(C.bushLight);
        doc.circle(b[0], b[1] - r * 1.25, r * 0.85, "F");
        if (index % 2 === 0) {
          setFill(index % 4 === 0 ? C.flower : C.flowerAlt);
          doc.circle(b[0] - r * 0.25, b[1] - r * 1.55, r * 0.2, "F");
          doc.circle(b[0] + r * 0.35, b[1] - r * 1.35, r * 0.18, "F");
        }
      });
    }

    // Cut face (left), showing the profile across the width
    if (kind === "infiltration") {
      face([[0, -m, -T], [0, W + m, -T], [0, W + m, 0], [0, -m, 0]], C.soilCut);
      face([[0, 0, 0], [0, W, 0], [0, W, -Dd], [0, 0, -Dd]], C.gravelCut);
      const area = W * Dd * k * k;
      const n = Math.min(500, Math.round(area / 14));
      for (let i = 0; i < n; i += 1) {
        const r = 1.2 + rand() * 1.6;
        const yy = r / k + rand() * (W - (2 * r) / k);
        const z = -Dd + r / k + rand() * (Dd - (2 * r) / k);
        const p = S(0, yy, z);
        const g = 145 + Math.round(rand() * 75);
        setFill([g, g - 2, g - 8]);
        setDraw(C.stoneEdge);
        doc.setLineWidth(0.2);
        doc.circle(p[0], p[1], r, "FD");
      }
    } else {
      face(
        [[0, -m, -T], [0, W + m, -T], [0, W + m, 0], [0, W, 0], [0, W - iy, -Dd], [0, iy, -Dd], [0, 0, 0], [0, -m, 0]],
        C.soilCut
      );
      if (kind === "basin") {
        face([[0, iy * wet, zw], [0, W - iy * wet, zw], [0, W - iy, -Dd], [0, iy, -Dd]], C.waterCut, C.waterEdge, 0.5);
      }
      const lining = { raingarden: [C.rgFloor, C.rgSlopeNear, C.rgSlopeFar], basin: [C.dbFloor, C.dbSlopeNear, C.dbSlopeFar] }[kind] || [C.bsFloor, C.bsWallNear, C.bsWallFar];
      seg(S(0, iy, -Dd), S(0, W - iy, -Dd), lining[0], 2.2);
      seg(S(0, 0, 0), S(0, iy, -Dd), lining[1], 2.2);
      seg(S(0, W, 0), S(0, W - iy, -Dd), lining[2], 2.2);
    }

    // Dimensions
    const zW = -T - 16 / k;
    seg(S(0, 0, 0), S(0, 0, zW - 4 / k), C.muted, 0.45, [2, 2]);
    seg(S(0, W, 0), S(0, W, zW - 4 / k), C.muted, 0.45, [2, 2]);
    dimensionLine(S(0, 0, zW), S(0, W, zW));
    const wMid = S(0, W / 2, zW);
    chip(`Width ${widthLabel}`, wMid[0], wMid[1] + 13, "center");

    if (D != null) {
      const yd = W + m * 0.5;
      seg(S(0, W - iy, -Dd), S(0, W + m * 0.72, -Dd), C.muted, 0.45, [2, 2]);
      seg(S(0, W, 0), S(0, W + m * 0.72, 0), C.muted, 0.45, [2, 2]);
      dimensionLine(S(0, yd, 0), S(0, yd, -Dd));
      const edge = S(0, W + m, -Dd / 2);
      chip(`Depth ${depthLabel}`, edge[0] - 8, edge[1], "right");
    }

    if (L != null) {
      const yl = -m * 0.5;
      seg(S(Ld, 0, 0), S(Ld, -m * 0.72, 0), C.muted, 0.45, [2, 2]);
      dimensionLine(S(0, yl, 0), S(Ld, yl, 0));
      const lMid = S(Ld / 2, -m, 0);
      chip(`Length ${lengthLabel}`, lMid[0] + 10, lMid[1] + 12, "left");
    }

    done();
    if (L == null) write("Length is not recorded, so it is not dimensioned.", 8, false, C.muted);
  };

  // Circular shaft lined with perforated concrete rings, wrapped in a gravel pack.
  // The block is cut through the centre of the well.
  const drawWell = (asset) => {
    const info = KIND_INFO.well;
    const rand = seededRandom(`${asset.name}|well`);
    const W = asset.widthM;
    const D = asset.depthM > 0 ? asset.depthM : null;
    const Dd = clamp(D ?? W * info.dDefault, W * info.dMin, W * info.dMax);
    const widthLabel = dimensionLabel(asset.widthLabel, asset.widthM);
    const depthLabel = dimensionLabel(asset.depthLabel, asset.depthM);

    const R = W / 2;
    const rim = W * 0.08;
    const pack = W * 0.2;
    const base = W * 0.16;
    const By = W * 2.8;
    const Bx = W * 1.4;
    const cy = By / 2;
    const T = Dd + base + W * 0.3;

    const { S, face, k, done } = scene(info.title, [0, Bx], [0, By], [-T, 0], { maxH: 290 });
    const half = (r, z = 0) => {
      const pts = [];
      for (let i = 0; i <= 24; i += 1) {
        const t = (Math.PI * i) / 24;
        pts.push([r * Math.sin(t), cy + r * Math.cos(t), z]);
      }
      return pts;
    };

    face([[0, 0, -T], [Bx, 0, -T], [Bx, By, -T], [0, By, -T]], [236, 236, 230], null);
    face([[0, 0, 0], [Bx, 0, 0], [Bx, By, 0], [0, By, 0]], C.grassTop, C.grassEdge);
    face(half(R + rim + pack), C.gravelTop);
    face(half(R + rim), C.concrete, C.concreteEdge);
    face(half(R), C.wellInner, C.concreteEdge);
    face([[0, 0, 0], [Bx, 0, 0], [Bx, 0, -T], [0, 0, -T]], C.soilSide);

    // Cut face
    const yOut0 = cy - R - rim - pack;
    const yOut1 = cy + R + rim + pack;
    face([[0, 0, -T], [0, By, -T], [0, By, 0], [0, 0, 0]], C.soilCut);
    face([[0, 0, 0], [0, By, 0], [0, By, -W * 0.12], [0, 0, -W * 0.12]], C.topsoil, null);
    face([[0, yOut0, -Dd], [0, yOut1, -Dd], [0, yOut1, -Dd - base], [0, yOut0, -Dd - base]], C.gravelCut);
    pebbles(S, k, rand, yOut0, yOut1, -Dd - base, -Dd);
    [[yOut0, cy - R - rim], [cy + R + rim, yOut1]].forEach(([a, b]) => {
      face([[0, a, 0], [0, b, 0], [0, b, -Dd], [0, a, -Dd]], C.gravelCut);
      pebbles(S, k, rand, a, b, -Dd, 0);
    });
    face([[0, cy - R, 0], [0, cy + R, 0], [0, cy + R, -Dd], [0, cy - R, -Dd]], C.wellInner);
    face([[0, cy - R, -Dd * 0.72], [0, cy + R, -Dd * 0.72], [0, cy + R, -Dd], [0, cy - R, -Dd]], C.waterCut, C.waterEdge, 0.5);
    [[cy - R - rim, cy - R], [cy + R, cy + R + rim]].forEach(([a, b]) => {
      face([[0, a, 0], [0, b, 0], [0, b, -Dd], [0, a, -Dd]], C.concrete, C.concreteEdge);
    });

    // Ring joints and perforations
    const rings = clamp(Math.round(D ?? Dd), 3, 8);
    for (let i = 1; i < rings; i += 1) {
      const z = (-Dd * i) / rings;
      seg(S(0, cy - R - rim, z), S(0, cy + R + rim, z), C.concreteEdge, 0.5);
    }
    for (let i = 0; i < rings; i += 1) {
      const z = (-Dd * (i + 0.5)) / rings;
      if (i < rings / 3) continue;
      [cy - R - rim / 2, cy + R + rim / 2].forEach((yy) => {
        const p = S(0, yy, z);
        setFill(C.wellInner);
        doc.circle(p[0], p[1], clamp(rim * k * 0.28, 0.8, 1.8), "F");
      });
    }

    // Water spreading into the soil
    [0.55, 0.75, 0.92].forEach((f) => {
      flowArrow(S(0, yOut0, -Dd * f), S(0, yOut0 - W * 0.34, -Dd * f));
      flowArrow(S(0, yOut1, -Dd * f), S(0, yOut1 + W * 0.34, -Dd * f));
    });
    flowArrow(S(0, cy, -Dd - base), S(0, cy, -Dd - base - W * 0.22));

    // Diameter
    const zd = -T - 16 / k;
    seg(S(0, cy - R, -Dd - base), S(0, cy - R, zd - 4 / k), C.muted, 0.45, [2, 2]);
    seg(S(0, cy + R, -Dd - base), S(0, cy + R, zd - 4 / k), C.muted, 0.45, [2, 2]);
    dimensionLine(S(0, cy - R, zd), S(0, cy + R, zd));
    const dMid = S(0, cy, zd);
    chip(`Diameter ${widthLabel}`, dMid[0], dMid[1] + 13, "center");

    if (D != null) {
      const yd = yOut1 + (By - yOut1) * 0.6;
      seg(S(0, yOut1, -Dd), S(0, yd + (By - yOut1) * 0.2, -Dd), C.muted, 0.45, [2, 2]);
      dimensionLine(S(0, yd, 0), S(0, yd, -Dd));
      const edge = S(0, By, -Dd / 2);
      chip(`Depth ${depthLabel}`, edge[0] - 8, edge[1], "right");
    }

    done();
  };

  const drawAssetDesign = (asset) => {
    const kind = assetKind(asset.type);
    if (!kind) return;
    if (!(asset.widthM > 0)) {
      write("Drawing omitted. Width is not recorded.", 9, false, C.muted);
      return;
    }
    if (kind === "well") drawWell(asset);
    else drawAsset3D(asset, kind);
    if (!(asset.depthM > 0)) {
      write(asset.depthLabel ? `Depth is recorded as ${asset.depthLabel}, so it is not dimensioned.` : "Depth is not recorded, so it is not dimensioned.", 8, false, C.muted);
    }
    if (asset.plants) write(`Planting recorded: ${asset.plants}`, 9);
  };

  // ---------- document body ----------
  header();
  write(new Date().toLocaleDateString("en-IN"), 9, false, C.muted);
  meta.filter(Boolean).forEach((lineText) => write(lineText, 10));
  y += 4;

  projects.forEach((project) => {
    ensure(78);
    rule();
    write(project.name || "Project", 14, true);
    if (project.location) write(tidy(project.location), 9, false, C.muted);
    if (project.detail) write(project.detail, 9);
    y += 4;
    write("Funding breakdown", 10, true, C.green);

    (project.assets || []).forEach((asset) => {
      setFont(11, true);
      const nameLines = doc.splitTextToSize(clean(asset.name || "Asset"), PAGE_W - MARGIN * 2 - 16);
      const lineH = 16;
      const barH = nameLines.length * lineH + 10;
      const kind = assetKind(asset.type);
      const rows = [
        asset.quantity != null ? ["Quantity", String(asset.quantity)] : null,
        asset.timeline ? ["Duration", asset.timeline] : null,
        asset.amount ? ["Amount", shortAmount(asset.amount)] : null,
        asset.lengthLabel && kind !== "well" ? ["Length", asset.lengthLabel] : null,
        asset.widthLabel ? [kind === "well" ? "Diameter" : "Width", asset.widthLabel] : null,
        asset.depthLabel ? ["Depth", asset.depthLabel] : null,
        asset.areaLabel ? ["Area", asset.areaLabel] : null,
      ].filter(Boolean);
      // Keep an asset's heading on the same page as its details and drawing
      ensure(barH + 8 + detailsHeight(rows) + (kind && asset.widthM > 0 ? 260 : 0));
      y += 8;
      setFill(C.barBg);
      doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, barH, "F");
      setFill(C.green);
      doc.rect(MARGIN, y, 3, barH, "F");
      nameLines.forEach((lineText, index) => text(lineText, MARGIN + 10, y + 16 + index * lineH, { size: 11, bold: true }));
      y += barH;
      details(rows);
      if (kind && !asset.lengthLabel && !asset.widthLabel && !asset.depthLabel && !asset.areaLabel) {
        write("Dimensions are not recorded for this asset.", 9, false, C.muted);
      }
      y += 6;
      drawAssetDesign(asset);
    });

    if (project.subtotal) {
      y += 4;
      write(`Project total: ${shortAmount(project.subtotal)}`, 11, true);
    }
  });

  ensure(40);
  y += 10;
  setFill(C.green);
  doc.rect(MARGIN, y, PAGE_W - MARGIN * 2, 22, "F");
  text(`${totalLabel}: ${shortAmount(totalAmount)}`, MARGIN + 10, y + 15, { size: 11, bold: true, color: C.white });

  return doc;
}

export function renderFundingPdf(options = {}) {
  return createFundingDoc(options).output("arraybuffer");
}

export async function downloadFundingPdf({ filename = "funding-commitment.pdf", fonts, ...options } = {}) {
  const loaded = fonts ?? (await loadDefaultFonts());
  createFundingDoc({ ...options, fonts: loaded }).save(filename.endsWith(".pdf") ? filename : `${filename}.pdf`);
}
