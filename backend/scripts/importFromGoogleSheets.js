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

require('dotenv').config();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const { google } = require('googleapis');
const { SecretsManagerClient, GetSecretValueCommand } = require('@aws-sdk/client-secrets-manager');

console.log('=============================================================================');
console.log('🚀 [START] INIT: importFromGoogleSheets.js executing...');
console.log(`⏱️  Timestamp: ${new Date().toISOString()}`);
console.log('=============================================================================');

const SiteProject  = require('../models/SiteProject');
const Intervention = require('../models/Intervention');

/* ─────────────────────────────────────────────────────────────────────────── */
/*  CONFIG & SECRETS MANAGER                                                   */
/* ─────────────────────────────────────────────────────────────────────────── */

async function loadConfig() {
  console.log('⚙️  [PHASE 1] Loading Configuration...');
  let config = {
    MONGO_URI: process.env.MONGO_URI,
    DB_USER: process.env.DB_USER,
    DB_PASSWORD: process.env.DB_PASSWORD,
    GOOGLE_SHEET_ID: process.env.GOOGLE_SHEET_ID,
    GOOGLE_SHEET_TAB_NAME: process.env.GOOGLE_SHEET_TAB_NAME || '0',
    GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: process.env.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS,
  };

  const secretName = process.env.AWS_SECRET_NAME;
  if (secretName) {
    console.log(`☁️  [AWS] Attempting to fetch secrets from AWS Secrets Manager (${secretName})...`);
    try {
      const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'ap-south-1' });
      const response = await client.send(
        new GetSecretValueCommand({ SecretId: secretName })
      );
      if (response.SecretString) {
        console.log('☁️  [AWS] Successfully retrieved secret from AWS! Parsing...');
        const secrets = JSON.parse(response.SecretString);
        config = { ...config, ...secrets };
      } else {
        console.warn('☁️  [AWS] Secret fetched but was empty/not a string.');
      }
    } catch (err) {
      console.error(`☁️  [AWS ERROR] Failed to fetch from Secrets Manager: ${err.message}`);
      console.log('☁️  [AWS] Falling back to standard .env variables...');
    }
  } else {
    console.log('ℹ️  [CONFIG] AWS_SECRET_NAME not provided in environment. Relying purely on .env.');
  }

  // Mask sensitive credentials for logging
  const maskedSA = config.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS ? 'HIDDEN/PRESENT' : 'MISSING';
  const maskedURI = config.MONGO_URI ? 'HIDDEN/PRESENT' : 'MISSING';
  
  console.log(`ℹ️  [CONFIG SUMMARY]`);
  console.log(`    MONGO_URI: ${maskedURI}`);
  console.log(`    GOOGLE_SHEET_ID: ${config.GOOGLE_SHEET_ID || 'MISSING'}`);
  console.log(`    GOOGLE_SERVICE_ACCOUNT_CREDENTIALS: ${maskedSA}`);
  console.log(`    GOOGLE_SHEET_TAB_NAME: ${config.GOOGLE_SHEET_TAB_NAME}`);
  
  return config;
}

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
  console.log('▶️  [MAIN] Starting main execution block...');
  
  const shouldWrite = process.argv.includes('--write');
  const shouldDrop  = process.argv.includes('--drop');
  
  console.log(`ℹ️  [FLAGS] --write: ${shouldWrite}, --drop: ${shouldDrop}`);

  // Load config from AWS Secrets Manager (or fallback to .env)
  const config = await loadConfig();

  // ── Validate config ─────────────────────────────────────────────────────────
  if (!config.GOOGLE_SHEET_ID || !config.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS) {
    console.error(
      '❌  [ERROR] Missing Google credentials or Sheet ID.\n' +
      '    Ensure GOOGLE_SHEET_ID and GOOGLE_SERVICE_ACCOUNT_CREDENTIALS\n' +
      '    are set in backend/.env or provided via AWS Secrets Manager.\n'
    );
    process.exit(1);
  }

  // ── Fetch Rows via Google API ───────────────────────────────────────────────
  console.log(`\n📥  [PHASE 2] Fetching sheet using Google Sheets API...`);
  let rows = [];
  try {
    console.log('    Parsing Service Account JSON...');
    const creds = typeof config.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS === 'string'
      ? JSON.parse(config.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS)
      : config.GOOGLE_SERVICE_ACCOUNT_CREDENTIALS;

    console.log('    Authenticating with Google...');

    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    
    let range = config.GOOGLE_SHEET_TAB_NAME;
    if (!range || range === '0') {
      console.log('    Fetching spreadsheet metadata to find first sheet name...');
      // Find the name of the first sheet
      const sheetMeta = await sheets.spreadsheets.get({ spreadsheetId: config.GOOGLE_SHEET_ID });
      range = sheetMeta.data.sheets[0].properties.title;
      console.log(`    Discovered first sheet name: "${range}"`);
    }

    console.log(`    Downloading cell values from range: "${range}"...`);
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: config.GOOGLE_SHEET_ID,
      range: range,
    });
    
    rows = response.data.values || [];
    console.log(`✅  [PHASE 2] Successfully fetched ${rows.length} rows from Google Sheets.\n`);
  } catch (err) {
    console.error(
      '\n❌  [ERROR] Could not fetch the sheet. Common causes:\n' +
      '    • The Service Account does not have read access to the sheet\n' +
      '    • GOOGLE_SHEET_ID is wrong\n' +
      '    • GOOGLE_SERVICE_ACCOUNT_CREDENTIALS JSON is malformed\n\n' +
      `    Error details: ${err.message}\n`
    );
    process.exit(1);
  }

  // ── Transform ───────────────────────────────────────────────────────────────
  console.log('⚙️  [PHASE 3] Transforming raw rows into DB models...');
  const { sites, interventions, reviewLog } = transform(rows);

  console.log(`📊  [SUMMARY] Parsing Results:`);
  console.log(`    ${sites.length} sites parsed.`);
  console.log(`    ${interventions.length} interventions parsed.`);
  console.log(`    ${reviewLog.length} rows flagged for review.`);

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
  const mongoUri = config.MONGO_URI;
  if (!mongoUri) {
    console.error('❌  [ERROR] MONGO_URI is not set. Cannot connect to MongoDB.');
    process.exit(1);
  }

  console.log('\n📡  [PHASE 4] Connecting to MongoDB...');
  console.log(`    URI: ${mongoUri.substring(0, 20)}... (truncated for security)`);
  
  const mongooseOpts = {};
  if (config.DB_USER && config.DB_PASSWORD) {
    console.log('    Using explicit DB_USER and DB_PASSWORD authentication.');
    mongooseOpts.user = config.DB_USER;
    mongooseOpts.pass = config.DB_PASSWORD;
    mongooseOpts.authSource = 'admin'; // As specified by AWS mongosh instructions
  } else {
    console.log('    No explicit DB_USER provided in config, assuming standard connection string.');
  }

  try {
    await mongoose.connect(mongoUri, mongooseOpts);
    console.log('✅  [PHASE 4] Connected to MongoDB successfully!\n');
  } catch (err) {
    console.error(`❌  [ERROR] Failed to connect to MongoDB: ${err.message}`);
    process.exit(1);
  }

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
  console.log('✅  [PHASE 5] Upserting interventions complete.');
  console.log(`    ${intOk} interventions upserted, ${intFail} failed.\n`);

  console.log('=============================================================================');
  console.log('🏁 [END] script importFromGoogleSheets.js completed successfully.');
  console.log('=============================================================================');
  process.exit(0);
}

main().catch((err) => {
  console.error('\n❌  [FATAL UNCAUGHT ERROR] importFromGoogleSheets.js crashed:');
  console.error(err);
  process.exit(1);
});
