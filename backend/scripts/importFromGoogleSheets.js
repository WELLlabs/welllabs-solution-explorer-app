/**
 * ============================================================================
 *  importFromGoogleSheets.js  — Google Sheets → SiteProject / Intervention
 * ============================================================================
 *
 *  HOW TO RUN (from the backend/ directory):
 *
 *    1. Make your Google Sheet publicly readable:
 *         File → Share → "Anyone with the link" → Viewer
 *
 *    2. Grab your Sheet ID from the URL:
 *         https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit
 *
 *    3. Add GOOGLE_SHEET_ID=<your-sheet-id> to backend/.env
 *       (also optionally GOOGLE_SHEET_TAB_ID if the data is not on the first tab)
 *
 *    4. DRY RUN — prints counts, writes review-log.json, does NOT touch MongoDB:
 *         node scripts/importFromGoogleSheets.js
 *
 *    5. When the dry-run summary looks right, WRITE to MongoDB:
 *         node scripts/importFromGoogleSheets.js --write
 *
 *    6. To WIPE the collections before re-importing (fresh start):
 *         node scripts/importFromGoogleSheets.js --write --drop
 *
 * ============================================================================
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const fs   = require('fs');
const path = require('path');
const https = require('https');
const mongoose = require('mongoose');

const SiteProject  = require('../models/SiteProject');
const Intervention = require('../models/Intervention');

/* ─────────────────────────────────────────────────────────────────────────── */
/*  CONFIG                                                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

const SHEET_ID  = process.env.GOOGLE_SHEET_ID;
// If your data is on a specific tab, set GOOGLE_SHEET_TAB_ID to that tab's gid
// (visible in the URL after #gid=XXXXXX). Leave blank to use the first/default tab.
const TAB_GID   = process.env.GOOGLE_SHEET_TAB_ID || '0';

// Raw site-type text → our SiteProject.type enum
const SITE_TYPE_MAP = {
  'green':          'park',
  'blue':           'lake',
  'grey':           'stormdrain',
  'gray':           'stormdrain',
  'green/campus level': 'campus',
  'campus':         'campus',
};

// Raw intervention name (lowercased, trimmed) → our Intervention.type enum
const INTERVENTION_TYPE_MAP = {
  'rain garden':                    'raingarden',
  'raingarden':                     'raingarden',
  'raingarden inside park':         'raingarden',
  'bioswale':                       'bioswale',
  'bioswale inside park':           'bioswale',
  'infiltration trench':            'infiltration_trench',
  'infiltration trench near bund':  'infiltration_trench',
  'infiltration trench at boundary':'infiltration_trench',
  'detention basin':                'detention_basin',
  'retention basin':                'detention_basin',
  'percolation well':               'percolation',
  'permeable pathway':              'permeable_pathway',
  'ecobloc':                        'ecobloc',
  'ecobloc- underground tank':      'underground_tank',
  'tree trenches':                  'tree_trench',
  'swd inlet placements':           'swd_inlet',
};

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STEP 1 — Fetch CSV from Google Sheets                                     */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Builds the public CSV export URL for a Google Sheet.
 * The sheet must be shared as "Anyone with the link can view".
 */
function buildCsvUrl(sheetId, tabGid) {
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv&gid=${tabGid}`;
}

/**
 * Fetches a URL and returns the body as a string.
 * Follows up to 5 redirects (Google Sheets redirects the export URL).
 */
function fetchUrl(url, redirectsLeft = 5) {
  return new Promise((resolve, reject) => {
    if (redirectsLeft === 0) {
      return reject(new Error('Too many redirects'));
    }
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(fetchUrl(res.headers.location, redirectsLeft - 1));
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`));
      }
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STEP 2 — Parse CSV                                                         */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Very simple CSV parser that handles quoted fields (including fields with
 * commas and newlines inside quotes). Returns an array of row-arrays.
 */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') { field += '"'; i++; }
      else if (ch === '"')            { inQuotes = false; }
      else                            { field += ch; }
    } else {
      if (ch === '"')  { inQuotes = true; }
      else if (ch === ',') { row.push(field.trim()); field = ''; }
      else if (ch === '\r' && next === '\n') {
        row.push(field.trim()); rows.push(row); row = []; field = ''; i++;
      } else if (ch === '\n') {
        row.push(field.trim()); rows.push(row); row = []; field = '';
      } else { field += ch; }
    }
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }

  return rows;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STEP 3 — Map CSV rows → column indices                                     */
/*                                                                             */
/*  Your sheet has a TWO-ROW header (row 1 = watershed title, row 2 = col     */
/*  headers). Google Sheets exports both. We detect the header row by looking  */
/*  for the word "Site" or "Interventions" in it.                              */
/* ─────────────────────────────────────────────────────────────────────────── */

/**
 * Expected column header keywords (case-insensitive partial match).
 * Extend this if your real sheet has slightly different header text.
 */
const HEADER_PATTERNS = {
  site_name:             /^site$/i,
  intervention_name:     /intervention/i,
  site_type_raw:         /site.?type/i,
  quantity:              /quant/i,
  length:                /^length$/i,
  width:                 /^width$/i,
  depth:                 /^depth/i,
  area:                  /^area$/i,
  latitude:              /^lat/i,
  longitude:             /^lon/i,
  tentative_cost:        /cost/i,
  tentative_timeline:    /timeline/i,
  site_level_impact:     /site.?level/i,
  subcatchment_impact:   /subcatch/i,
};

function detectHeaderRow(rows) {
  for (let i = 0; i < Math.min(rows.length, 6); i++) {
    const row = rows[i];
    // A header row will have at least 3 recognisable column names
    let hits = 0;
    for (const pat of Object.values(HEADER_PATTERNS)) {
      if (row.some((cell) => pat.test(cell || ''))) hits++;
    }
    if (hits >= 3) return i;
  }
  return -1;
}

function buildColumnIndex(headerRow) {
  const idx = {};
  headerRow.forEach((cell, colIdx) => {
    for (const [field, pat] of Object.entries(HEADER_PATTERNS)) {
      if (pat.test(cell || '')) {
        idx[field] = colIdx;
      }
    }
  });
  return idx;
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STEP 4 — Transform rows → SiteProject / Intervention documents            */
/* ─────────────────────────────────────────────────────────────────────────── */

function get(row, colIdx, field) {
  const i = colIdx[field];
  return i !== undefined ? (row[i] || '').trim() : '';
}

function toNumber(val) {
  if (!val) return null;
  const n = parseFloat(String(val).replace(/[^0-9.]/g, ''));
  return isNaN(n) ? null : n;
}

/**
 * Parses a coordinate string like " 12°59'11.70\"N" or "77°44'41.42\"E"
 * and returns a decimal-degree float.
 */
function parseCoord(raw) {
  if (!raw) return null;
  const s = String(raw).trim();

  // DMS: degrees° minutes' seconds" [NSEW]
  const dms = s.match(/(\d+)[°\s]+(\d+)'?\s*([\d.]+)"?\s*([NSEW]?)/i);
  if (dms) {
    let deg = parseFloat(dms[1]) + parseFloat(dms[2]) / 60 + parseFloat(dms[3]) / 3600;
    if (/[SW]/i.test(dms[4])) deg = -deg;
    return parseFloat(deg.toFixed(7));
  }

  // Try plain decimal fallback
  const plain = parseFloat(s);
  if (!isNaN(plain)) return plain;

  return null;
}

function slugify(str) {
  return String(str).trim().toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function transform(rows) {
  const headerRowIdx = detectHeaderRow(rows);
  if (headerRowIdx === -1) {
    throw new Error(
      'Could not detect the header row in the sheet. ' +
      'Check that the sheet is shared as "Anyone with the link → Viewer" ' +
      'and that GOOGLE_SHEET_ID is correct.'
    );
  }

  console.log(`  ℹ Header row detected at CSV row ${headerRowIdx + 1}`);
  const colIdx = buildColumnIndex(rows[headerRowIdx]);
  console.log('  ℹ Column mapping:', colIdx);

  const dataRows = rows.slice(headerRowIdx + 1);

  const sites       = new Map();   // site_id → doc
  const interventions = [];
  const reviewLog   = [];

  // Forward-fill values that only appear on the first row of a merged group
  let lastSiteName  = '';
  let lastSiteType  = '';
  let lastLat       = null;
  let lastLng       = null;
  let lastImpact    = '';
  let lastSubImpact = '';
  // Watershed heading rows look like "Nallurhalli Micro Watershed…"
  let currentWatershed = '';

  dataRows.forEach((row, i) => {
    const csvLine = headerRowIdx + 2 + i; // 1-based for logging

    // ── Detect watershed/section heading rows ────────────────────────────────
    // These rows have no site_type and the first recognisable cell spans across
    // columns — the simplest heuristic: the row has a value in the very first
    // non-empty cell but nothing in the intervention column and site column.
    const firstCell = (row[0] || row[1] || '').trim();
    const siteCell  = get(row, colIdx, 'site_name');
    const intCell   = get(row, colIdx, 'intervention_name');

    if (!siteCell && !intCell && firstCell && firstCell.length > 4) {
      currentWatershed = firstCell;
      return; // skip heading row
    }

    // ── Forward-fill ─────────────────────────────────────────────────────────
    const siteName   = siteCell  || lastSiteName;
    const siteType   = get(row, colIdx, 'site_type_raw') || lastSiteType;
    const latRaw     = get(row, colIdx, 'latitude');
    const lngRaw     = get(row, colIdx, 'longitude');
    const lat        = latRaw  ? parseCoord(latRaw)  : lastLat;
    const lng        = lngRaw  ? parseCoord(lngRaw)  : lastLng;
    const impact     = get(row, colIdx, 'site_level_impact')    || lastImpact;
    const subImpact  = get(row, colIdx, 'subcatchment_impact')  || lastSubImpact;

    if (siteName)   lastSiteName  = siteName;
    if (siteType)   lastSiteType  = siteType;
    if (lat != null) lastLat = lat;
    if (lng != null) lastLng = lng;
    if (impact)     lastImpact    = impact;
    if (subImpact)  lastSubImpact = subImpact;

    const interventionNameRaw = get(row, colIdx, 'intervention_name');
    if (!siteName && !interventionNameRaw) return; // blank row

    // ── Resolve site type ────────────────────────────────────────────────────
    const siteTypeKey = siteType.toLowerCase().trim();
    const mappedType  = SITE_TYPE_MAP[siteTypeKey];
    const siteId      = slugify(siteName);

    if (!sites.has(siteId) && siteName) {
      if (!mappedType) {
        reviewLog.push({
          csvLine,
          issue: `Unrecognized site type "${siteType}" for site "${siteName}"`,
        });
      }
      const siteDoc = {
        site_id:   siteId,
        type:      mappedType || 'park',
        name:      siteName,
        watershed: currentWatershed,
        latitude:  lat,
        longitude: lng,
        site_level_impact:         impact   || undefined,
        subcatchment_level_impact: subImpact || undefined,
        needs_review:  !mappedType,
        review_reason: !mappedType ? `Unmapped site type "${siteType}"` : undefined,
        linked_intervention_ids: [],
      };
      // GeoJSON
      if (lat != null && lng != null) {
        siteDoc.location = { type: 'Point', coordinates: [lng, lat] };
      }
      sites.set(siteId, siteDoc);
    }

    // ── Resolve intervention type ─────────────────────────────────────────────
    if (!interventionNameRaw) return;

    const intKey      = interventionNameRaw.toLowerCase().trim();
    const mappedIntType = INTERVENTION_TYPE_MAP[intKey];
    const interventionId = `${siteId}__${slugify(interventionNameRaw)}__${csvLine}`;

    if (!mappedIntType) {
      reviewLog.push({
        csvLine,
        issue: `Unrecognized intervention type "${interventionNameRaw}" at site "${siteName}"`,
      });
    }

    const intDoc = {
      intervention_id: interventionId,
      type:            mappedIntType || 'other',
      site_id:         siteId,
      site_name:       siteName,
      latitude:        lat,
      longitude:       lng,
      quantity:        toNumber(get(row, colIdx, 'quantity')),
      needs_review:    !mappedIntType,
      review_reason:   !mappedIntType
        ? `Unmapped intervention "${interventionNameRaw}"`
        : undefined,
      details: {
        length_m:  get(row, colIdx, 'length') || null,
        width_m:   get(row, colIdx, 'width')  || null,
        depth_m:   get(row, colIdx, 'depth')  || null,
        area:      get(row, colIdx, 'area')   || null,
        tentative_cost:     get(row, colIdx, 'tentative_cost')     || null,
        tentative_timeline: get(row, colIdx, 'tentative_timeline') || null,
      },
    };

    // GeoJSON
    if (lat != null && lng != null) {
      intDoc.location = { type: 'Point', coordinates: [lng, lat] };
    }

    interventions.push(intDoc);
    if (sites.has(siteId)) {
      sites.get(siteId).linked_intervention_ids.push(interventionId);
    }
  });

  return { sites: [...sites.values()], interventions, reviewLog };
}

/* ─────────────────────────────────────────────────────────────────────────── */
/*  STEP 5 — Main                                                              */
/* ─────────────────────────────────────────────────────────────────────────── */

async function main() {
  const shouldWrite = process.argv.includes('--write');
  const shouldDrop  = process.argv.includes('--drop');

  // ── Validate config ─────────────────────────────────────────────────────────
  if (!SHEET_ID) {
    console.error(
      '\n❌  GOOGLE_SHEET_ID is not set in backend/.env\n' +
      '    1. Open your Google Sheet\n' +
      '    2. Copy the ID from the URL:\n' +
      '       https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit\n' +
      '    3. Add this line to backend/.env:\n' +
      '       GOOGLE_SHEET_ID=<your-sheet-id>\n'
    );
    process.exit(1);
  }

  // ── Fetch CSV ───────────────────────────────────────────────────────────────
  const url = buildCsvUrl(SHEET_ID, TAB_GID);
  console.log(`\n📥  Fetching sheet from:\n    ${url}\n`);

  let csv;
  try {
    csv = await fetchUrl(url);
  } catch (err) {
    console.error(
      '\n❌  Could not fetch the sheet. Common causes:\n' +
      '    • The sheet is NOT shared as "Anyone with the link → Viewer"\n' +
      '    • GOOGLE_SHEET_ID is wrong\n' +
      '    • GOOGLE_SHEET_TAB_ID points to a non-existent tab\n\n' +
      `    Error: ${err.message}\n`
    );
    process.exit(1);
  }

  const rows = parseCsv(csv);
  console.log(`✅  Fetched ${rows.length} raw CSV rows.\n`);

  // ── Transform ───────────────────────────────────────────────────────────────
  const { sites, interventions, reviewLog } = transform(rows);

  console.log(`\n📊  Summary:`);
  console.log(`    ${sites.length} sites`);
  console.log(`    ${interventions.length} interventions`);
  console.log(`    ${reviewLog.length} rows flagged for review`);

  // Always write the review log
  const logPath = path.join(__dirname, 'review-log.json');
  fs.writeFileSync(logPath, JSON.stringify(reviewLog, null, 2));
  console.log(`\n📝  Review log → ${logPath}`);

  if (reviewLog.length > 0) {
    console.log('\n⚠️   Rows needing review:');
    reviewLog.forEach((r) => console.log(`    Line ${r.csvLine}: ${r.issue}`));
  }

  // ── Dry-run bail-out ────────────────────────────────────────────────────────
  if (!shouldWrite) {
    console.log(
      '\n🔍  DRY RUN — MongoDB was NOT touched.\n' +
      '    Inspect review-log.json, then re-run with --write:\n\n' +
      '    node scripts/importFromGoogleSheets.js --write\n'
    );
    return;
  }

  // ── Connect + write ─────────────────────────────────────────────────────────
  if (!process.env.MONGO_URI) {
    console.error('\n❌  MONGO_URI is not set in backend/.env\n');
    process.exit(1);
  }

  console.log('\n📡  Connecting to MongoDB...');
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅  Connected!\n');

  if (shouldDrop) {
    console.log('🗑   --drop flag set: clearing existing collections...');
    await SiteProject.deleteMany({});
    await Intervention.deleteMany({});
    console.log('    Cleared SiteProject and Intervention collections.\n');
  }

  console.log('💾  Upserting sites...');
  let siteOk = 0, siteFail = 0;
  for (const s of sites) {
    try {
      await SiteProject.updateOne(
        { site_id: s.site_id },
        { $set: s },
        { upsert: true }
      );
      siteOk++;
    } catch (err) {
      console.error(`    ⚠ Site "${s.site_id}": ${err.message}`);
      siteFail++;
    }
  }
  console.log(`    ✅  ${siteOk} sites upserted${siteFail ? `, ${siteFail} failed` : ''}.`);

  console.log('\n💾  Upserting interventions...');
  let intOk = 0, intFail = 0;
  for (const iv of interventions) {
    try {
      await Intervention.updateOne(
        { intervention_id: iv.intervention_id },
        { $set: iv },
        { upsert: true }
      );
      intOk++;
    } catch (err) {
      console.error(`    ⚠ Intervention "${iv.intervention_id}": ${err.message}`);
      intFail++;
    }
  }
  console.log(`    ✅  ${intOk} interventions upserted${intFail ? `, ${intFail} failed` : ''}.`);

  console.log('\n🎉  Import complete!\n');
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('\n❌  Unexpected error:', err);
  process.exit(1);
});
