const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Intervention Schema
 * Linked back to a SiteProject via site_id (or standalone).
 */

const InterventionSchema = new Schema(
  {
    /* ─────────────────────────────────────────────────────────────
     * 1. Intervention Details (Common - Google Sheet Column 5)
     * ──────────────────────────────────────────────────────────── */
    intervention_id: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: [
        'bioswale',
        'raingarden',
        'infiltration_trench',
        'percolation',
        'detention_basin',
        'constructed_wetlands',
        'rainwater_harvesting',
        'permeable_pathway',
        'ecobloc',
        'tree_trench',
        'swd_inlet',
        'underground_tank',
        'other',
      ],
      required: true,
      index: true,
    },
    site_typology: { type: String },
    site_id: { type: String, index: true, default: null },
    site_name: { type: String },
    location_typology: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    ward: { type: String },
    bbmp_zone: { type: String },
    year_implemented: { type: String },
    status: { type: String },
    implementing_agency: { type: String },
    notes: { type: String },
    quantity: { type: Number, default: 1 },

    /* ─────────────────────────────────────────────────────────────
     * 2. Bioswale Specific Fields (Google Sheet Column 7)
     * ──────────────────────────────────────────────────────────── */
    length: { type: Number },
    width: { type: Number },
    depth: { type: Number },
    catchment_area_served_ha: { type: Number },
    baseline_peak_flow: { type: String },
    post_intervention_peak_flow: { type: String },
    plant_species_used: { type: String },

    /* ─────────────────────────────────────────────────────────────
     * 3. Rain Garden Specific Fields (Google Sheet Column 8)
     * ──────────────────────────────────────────────────────────── */
    area: { type: Number },
    ponding_depth: { type: Number },
    filter_media_depth: { type: Number },
    catchment_area_served_sqm: { type: Number },
    baseline_runoff: { type: String },
    runoff_captured: { type: Number },

    /* ─────────────────────────────────────────────────────────────
     * 4. Infiltration Trench Specific Fields (Google Sheet Column 9)
     * ──────────────────────────────────────────────────────────── */
    infiltration_rate: { type: Number },
    catchment_served_sqm: { type: Number },
    recharge_volume_kl_yr: { type: Number },

    /* ─────────────────────────────────────────────────────────────
     * 5. Percolation Well Specific Fields (Google Sheet Column 10)
     * ──────────────────────────────────────────────────────────── */
    diameter: { type: Number },
    number_of_wells: { type: Number },

    /* ─────────────────────────────────────────────────────────────
     * 6. Detention Basin Specific Fields (Google Sheet Column 11)
     * ──────────────────────────────────────────────────────────── */
    storage_volume: { type: Number },
    surface_area: { type: Number },
    peak_flow_attenuation: { type: Number },

    /* ─────────────────────────────────────────────────────────────
     * 7. Constructed Wetlands Specific Fields (Google Sheet Column 12)
     * ──────────────────────────────────────────────────────────── */
    retention_time: { type: String },
    catchment_served: { type: String },
    water_treated: { type: Number },
    bod_reduction: { type: Number },
    cod_reduction: { type: Number },

    /* ─────────────────────────────────────────────────────────────
     * 8. Rainwater Harvesting Specific Fields (Google Sheet Column 13)
     * ──────────────────────────────────────────────────────────── */
    number_of_structures: { type: Number },
    catchment_roof_area: { type: Number },
    storage_capacity: { type: Number },
    water_harvested: { type: Number },
    recharge_vs_storage_use: { type: String },

    /* ─────────────────────────────────────────────────────────────
     * 9. Flexible Details Store (Optional for custom/extended fields)
     * ──────────────────────────────────────────────────────────── */
    details: { type: Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

InterventionSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Intervention', InterventionSchema);
