const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Project = require('../models/Project');
const Well = require('../models/Well');

// Helper to parse coordinate string (e.g. "12.95435900° N" or "77.59416100° E") into a float
function parseCoordinate(val) {
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
}

// Find a file in data folder matching prefix
function findFileByPrefix(dir, prefix) {
  if (!fs.existsSync(dir)) return null;
  const files = fs.readdirSync(dir);
  const found = files.find(file => file.startsWith(prefix) && file.endsWith('.json'));
  return found ? path.join(dir, found) : null;
}

const importData = async () => {
  try {
    const dataDir = path.join(__dirname, '../data');
    console.log(`🔍 Scanning for JSON data files in ${dataDir}...`);

    // Ensure we can connect to MongoDB
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in your .env file!');
    }

    console.log('📡 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB!');

    // ==========================================
    // 1. IMPORT PROJECTS
    // ==========================================
    const projectsFile = findFileByPrefix(dataDir, 'v1_projects_with_wards');
    if (projectsFile) {
      console.log(`📦 Found projects file: ${path.basename(projectsFile)}`);
      const rawData = JSON.parse(fs.readFileSync(projectsFile, 'utf8'));
      console.log(`📖 Read ${rawData.length} projects from file.`);

      const formattedProjects = rawData.map((item, idx) => {
        const lat = parseCoordinate(item['Latitude']);
        const lng = parseCoordinate(item['Longitude']);

        const proj = {
          projNo: item['Proj No'] || String(idx + 1),
          projName: item['Proj Name'] || `Project ${idx + 1}`,
          latitude: lat,
          longitude: lng,
          budget: item['Budget'] || '',
          timeline: item['Timeline'] || '',
          status: item['Status'] || '',
          projLead: item['Proj Lead'] || '',
          stakeholders: item['Stakeholders'] || '',
          tags: item['Tags'] || '',
          areaCatchment: item['Area Catchment'] || '',
          drainLength: item['Drain Length'] || '',
          mediaLink: item['Media Link'] || '',
          fid: item['Fid'] !== null ? String(item['Fid']) : '',
          acNo: item['Ac No'] !== null ? String(item['Ac No']) : '',
          ac: item['Ac'] || '',
          acKn: item['Ac Kn'] || '',
          assembly: item['Assembly'] || '',
          wardId: item['Ward ID'] !== null ? String(item['Ward ID']) : '',
          corporation: item['Corporation'] || '',
          corporationId: item['Corporation ID'] !== null ? String(item['Corporation ID']) : '',
          wardName: item['Ward Name'] || '',
          wardNameKn: item['Ward Name Kn'] || '',
          corporationKn: item['Corporation Kn'] || ''
        };

        // Construct GeoJSON Point only if both coordinates are valid numbers
        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          proj.location = {
            type: 'Point',
            coordinates: [lng, lat] // [longitude, latitude]
          };
        }

        return proj;
      });

      console.log('🧹 Clearing old projects from MongoDB...');
      await Project.deleteMany({});

      console.log('💾 Inserting new projects into MongoDB...');
      const inserted = await Project.insertMany(formattedProjects);
      console.log(`🎉 Successfully imported ${inserted.length} Projects!`);
    } else {
      console.log('⚠️ No projects file starting with "v1_projects_with_wards" found.');
    }

    // ==========================================
    // 2. IMPORT WELLS
    // ==========================================
    const wellsFile = findFileByPrefix(dataDir, 'v1_wells_with_wards');
    if (wellsFile) {
      console.log(`\n📦 Found wells file: ${path.basename(wellsFile)}`);
      const rawData = JSON.parse(fs.readFileSync(wellsFile, 'utf8'));
      console.log(`📖 Read ${rawData.length} wells from file.`);

      const formattedWells = rawData.map((item, idx) => {
        const lat = parseCoordinate(item['Latitude']);
        const lng = parseCoordinate(item['Longitude']);

        // Parse numerical columns
        const phVal = item['Ph'] !== null && item['Ph'] !== '' ? parseFloat(item['Ph']) : null;
        const tdsVal = item['Tds'] !== null && item['Tds'] !== '' ? parseFloat(item['Tds']) : null;
        const ecVal = item['Ec'] !== null && item['Ec'] !== '' ? parseFloat(item['Ec']) : null;
        const salinityVal = item['Salinity'] !== null && item['Salinity'] !== '' ? parseFloat(item['Salinity']) : null;

        const well = {
          wellName: item['Well Name'] || `Well ${idx + 1}`,
          latitude: lat,
          longitude: lng,
          wellType: item['Well Type'] || '',
          ownerName: item['Owner Name'] || '',
          yearDug: item['Year Dug'] || '',
          lining: item['Lining'] || '',
          diameterFt: item['Diameter Ft'] || '',
          depthFt: item['Depth Ft'] || '',
          waterLevelFt: item['Water Level Ft'] || '',
          ph: isNaN(phVal) ? null : phVal,
          tds: isNaN(tdsVal) ? null : tdsVal,
          ec: isNaN(ecVal) ? null : ecVal,
          salinity: isNaN(salinityVal) ? null : salinityVal,
          hasFluoride: item['Has Fluoride'] || '',
          hasArsenic: item['Has Arsenic'] || '',
          surveyorName: item['Surveyor Name'] || '',
          surveyDate: item['Survey Date'] || '',
          fid: item['Fid'] !== null ? String(item['Fid']) : '',
          acNo: item['Ac No'] !== null ? String(item['Ac No']) : '',
          ac: item['Ac'] || '',
          acKn: item['Ac Kn'] || '',
          assembly: item['Assembly'] || '',
          wardId: item['Ward ID'] !== null ? String(item['Ward ID']) : '',
          corporation: item['Corporation'] || '',
          corporationId: item['Corporation ID'] !== null ? String(item['Corporation ID']) : '',
          wardName: item['Ward Name'] || '',
          wardNameKn: item['Ward Name Kn'] || '',
          corporationKn: item['Corporation Kn'] || ''
        };

        // Construct GeoJSON Point only if both coordinates are valid numbers
        if (lat !== null && lng !== null && !isNaN(lat) && !isNaN(lng)) {
          well.location = {
            type: 'Point',
            coordinates: [lng, lat] // [longitude, latitude]
          };
        }

        return well;
      });

      console.log('🧹 Clearing old wells from MongoDB...');
      await Well.deleteMany({});

      console.log('💾 Inserting new wells into MongoDB...');
      const inserted = await Well.insertMany(formattedWells);
      console.log(`🎉 Successfully imported ${inserted.length} Wells!`);
    } else {
      console.log('⚠️ No wells file starting with "v1_wells_with_wards" found.');
    }

    console.log('\n🌟 All data imports completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Data Import Failed:', error);
    process.exit(1);
  }
};

importData();
