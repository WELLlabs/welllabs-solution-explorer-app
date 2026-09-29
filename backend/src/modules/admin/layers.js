const Project = require('../../models/Project');
const Well = require('../../models/Well');
const SiteProject = require('../../models/SiteProject');
const Intervention = require('../../models/Intervention');
const FloodHotspot = require('../../models/FloodHotspot');

const LAT = { key: 'latitude', label: 'Latitude', type: 'number', required: true, aliases: ['lat', 'y'] };
const LNG = { key: 'longitude', label: 'Longitude', type: 'number', required: true, aliases: ['lng', 'lon', 'long', 'x'] };

/**
 * Map layers that can receive imported data.
 * `aliases` are alternative column / property names accepted in CSV and GeoJSON.
 * `uniqueKey` rows are updated in place when the key already exists; layers
 * without one always insert new records.
 */
const LAYERS = {
  existing_interventions: {
    label: 'Existing Interventions',
    description: 'Points in the "What\'s happening in the city" layer.',
    model: Project,
    geoField: 'location',
    uniqueKey: 'projNo',
    fields: [
      { key: 'projName', label: 'Project name', type: 'string', required: true, aliases: ['proj_name', 'name'] },
      { key: 'projNo', label: 'Project number', type: 'string', aliases: ['proj_no', 'id'] },
      LAT,
      LNG,
      { key: 'status', label: 'Status', type: 'string', aliases: [] },
      { key: 'budget', label: 'Budget', type: 'string' },
      { key: 'timeline', label: 'Timeline', type: 'string' },
      { key: 'projLead', label: 'Project lead', type: 'string', aliases: ['proj_lead'] },
      { key: 'stakeholders', label: 'Stakeholders', type: 'string' },
      { key: 'tags', label: 'Tags', type: 'string' },
      { key: 'areaCatchment', label: 'Catchment area', type: 'string', aliases: ['area_catchment'] },
      { key: 'drainLength', label: 'Drain length', type: 'string', aliases: ['drain_length'] },
      { key: 'mediaLink', label: 'Media link', type: 'string', aliases: ['media_link'] },
      { key: 'wardName', label: 'Ward name', type: 'string', aliases: ['ward_name', 'ward'] },
      { key: 'corporation', label: 'Corporation', type: 'string' },
      { key: 'assembly', label: 'Assembly', type: 'string' },
    ],
  },
  wells: {
    label: 'Ground water wells',
    description: 'Points in the "Ground water risk in the city" layer.',
    model: Well,
    geoField: 'location',
    uniqueKey: null,
    fields: [
      { key: 'wellName', label: 'Well name', type: 'string', required: true, aliases: ['well_name', 'name'] },
      LAT,
      LNG,
      { key: 'wellType', label: 'Well type', type: 'string', aliases: ['well_type', 'type'] },
      { key: 'ownerName', label: 'Owner name', type: 'string', aliases: ['owner_name', 'owner'] },
      { key: 'yearDug', label: 'Year dug', type: 'string', aliases: ['year_dug'] },
      { key: 'lining', label: 'Lining', type: 'string' },
      { key: 'diameterFt', label: 'Diameter (ft)', type: 'string', aliases: ['diameter_ft'] },
      { key: 'depthFt', label: 'Depth (ft)', type: 'string', aliases: ['depth_ft'] },
      { key: 'waterLevelFt', label: 'Water level (ft)', type: 'string', aliases: ['water_level_ft'] },
      { key: 'ph', label: 'pH', type: 'number' },
      { key: 'tds', label: 'TDS', type: 'number' },
      { key: 'ec', label: 'EC', type: 'number' },
      { key: 'surveyorName', label: 'Surveyor name', type: 'string', aliases: ['surveyor_name'] },
      { key: 'surveyDate', label: 'Survey date', type: 'string', aliases: ['survey_date'] },
      { key: 'wardName', label: 'Ward name', type: 'string', aliases: ['ward_name', 'ward'] },
      { key: 'corporation', label: 'Corporation', type: 'string' },
    ],
  },
  bgg_sites: {
    label: 'City wide BGG projects (sites)',
    description: 'Sites in the "City wide BGG projects" layer. Rows whose site_id also exists in the Google Sheet are overwritten by the sheet when the server restarts.',
    model: SiteProject,
    geoField: 'location',
    uniqueKey: 'site_id',
    fields: [
      { key: 'site_id', label: 'Site ID', type: 'string', required: true, aliases: ['siteid', 'id'] },
      { key: 'name', label: 'Site name', type: 'string', required: true },
      { key: 'type', label: 'Site type', type: 'enum', required: true, options: ['lake', 'park', 'stormdrain', 'campus'] },
      LAT,
      LNG,
      { key: 'ward', label: 'Ward', type: 'string' },
      { key: 'bbmp_zone', label: 'BBMP zone', type: 'string', aliases: ['zone'] },
      { key: 'watershed', label: 'Watershed', type: 'string' },
      { key: 'implementing_agency', label: 'Implementing agency', type: 'string' },
      { key: 'current_stage', label: 'Current stage', type: 'string', aliases: ['stage'] },
      { key: 'total_cost', label: 'Total cost', type: 'string', aliases: ['cost'] },
      { key: 'project_start_year', label: 'Start year', type: 'string' },
      { key: 'project_end_year', label: 'End year', type: 'string' },
      { key: 'site_level_impact', label: 'Site level impact', type: 'string' },
      { key: 'context', label: 'Context', type: 'string' },
      { key: 'image_url', label: 'Image URL', type: 'string' },
    ],
  },
  bgg_interventions: {
    label: 'City wide BGG interventions',
    description: 'Interventions linked to a BGG site through site_id. Rows whose intervention_id also exists in the Google Sheet are overwritten by the sheet when the server restarts.',
    model: Intervention,
    geoField: 'location',
    uniqueKey: 'intervention_id',
    fields: [
      { key: 'intervention_id', label: 'Intervention ID', type: 'string', required: true, aliases: ['id'] },
      {
        key: 'type',
        label: 'Intervention type',
        type: 'enum',
        required: true,
        options: [
          'bioswale', 'raingarden', 'infiltration_trench', 'percolation', 'detention_basin',
          'constructed_wetlands', 'rainwater_harvesting', 'permeable_pathway', 'ecobloc',
          'tree_trench', 'swd_inlet', 'underground_tank', 'other',
        ],
      },
      { key: 'site_id', label: 'Site ID', type: 'string' },
      { key: 'site_name', label: 'Site name', type: 'string' },
      { ...LAT, required: false },
      { ...LNG, required: false },
      { key: 'ward', label: 'Ward', type: 'string' },
      { key: 'status', label: 'Status', type: 'string' },
      { key: 'year_implemented', label: 'Year implemented', type: 'string', aliases: ['year'] },
      { key: 'quantity', label: 'Quantity', type: 'number' },
      { key: 'notes', label: 'Notes', type: 'string' },
    ],
  },
  flood_hotspots: {
    label: 'Flooding hotspots',
    description: 'Points in the "Flooding Hotspots" layer, shown together with the built-in hotspots.',
    model: FloodHotspot,
    geoField: 'geo',
    uniqueKey: 'hotspotId',
    fields: [
      { key: 'hotspotId', label: 'Hotspot ID', type: 'string', required: true, aliases: ['id', 'hotspot_id'] },
      { key: 'location', label: 'Location name', type: 'string', required: true, aliases: ['name'] },
      LAT,
      LNG,
      { key: 'zone', label: 'Zone', type: 'string' },
      { key: 'vulnerabilityLevel', label: 'Vulnerability level', type: 'enum', options: ['High', 'Medium', 'Low'], aliases: ['vulnerability_level', 'vulnerability'] },
      { key: 'vulnerabilityMeasure', label: 'Vulnerability measure', type: 'string', aliases: ['vulnerability_measure'] },
      { key: 'remarks', label: 'Remarks', type: 'string' },
    ],
  },
};

const normKey = (k) => String(k).toLowerCase().replace(/[^a-z0-9]/g, '');

/** Validate and convert one raw record into a document for the layer's model. */
const normalizeRecord = (layer, raw) => {
  const errors = [];
  const doc = {};
  const lookup = {};
  Object.entries(raw || {}).forEach(([k, v]) => { lookup[normKey(k)] = v; });

  for (const field of layer.fields) {
    const names = [field.key, ...(field.aliases || [])].map(normKey);
    const found = names.find((n) => lookup[n] !== undefined && lookup[n] !== null && String(lookup[n]).trim() !== '');
    const value = found === undefined ? undefined : lookup[found];

    if (value === undefined) {
      if (field.required) errors.push(`${field.label} is required`);
      continue;
    }

    if (field.type === 'number') {
      const num = Number(value);
      if (Number.isNaN(num)) {
        errors.push(`${field.label} must be a number`);
        continue;
      }
      doc[field.key] = num;
    } else if (field.type === 'enum') {
      const match = field.options.find((o) => o.toLowerCase() === String(value).trim().toLowerCase());
      if (!match) {
        errors.push(`${field.label} must be one of: ${field.options.join(', ')}`);
        continue;
      }
      doc[field.key] = match;
    } else {
      doc[field.key] = String(value).trim();
    }
  }

  if (doc.latitude !== undefined && (doc.latitude < -90 || doc.latitude > 90)) errors.push('Latitude must be between -90 and 90');
  if (doc.longitude !== undefined && (doc.longitude < -180 || doc.longitude > 180)) errors.push('Longitude must be between -180 and 180');
  if (doc.latitude !== undefined && doc.longitude !== undefined) {
    doc[layer.geoField] = { type: 'Point', coordinates: [doc.longitude, doc.latitude] };
  }

  return { doc, errors };
};

const describeLayers = async () =>
  Promise.all(
    Object.entries(LAYERS).map(async ([id, layer]) => ({
      id,
      label: layer.label,
      description: layer.description,
      uniqueKey: layer.uniqueKey,
      fields: layer.fields.map(({ key, label, type, required, options }) => ({ key, label, type, required: !!required, options })),
      count: await layer.model.estimatedDocumentCount(),
    }))
  );

module.exports = { LAYERS, normalizeRecord, describeLayers };
