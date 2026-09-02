
const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * SiteProject Schema
 * One document per physical site (park / lake / stormdrain / campus).
 * Linked with Intervention documents via linked_intervention_ids / site_id.
 */

const SiteProjectSchema = new Schema(
  {
    /* ─────────────────────────────────────────────────────────────
     * 1. Project Details (Common for all sites)
     * ──────────────────────────────────────────────────────────── */
    site_id: { type: String, required: true, unique: true, index: true },
    type: {
      type: String,
      enum: ['lake', 'park', 'stormdrain', 'campus'],
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    ward: { type: String },
    bbmp_zone: { type: String },
    watershed: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number],
    },
    implementing_agency: { type: String },
    implementation_partners: { type: String },
    project_start_year: { type: String },
    project_end_year: { type: String },
    current_stage: { type: String },
    total_cost: { type: String },
    pre_intervention_issues: { type: String },
    context: { type: String },
    linked_intervention_ids: [{ type: String, index: true }],
    data_source: { type: String },
    last_updated: { type: String },
    site_level_impact: { type: String },
    subcatchment_level_impact: { type: String },

    /* ─────────────────────────────────────────────────────────────
     * 2. LAKES SPECIFIC FIELDS (Google Sheet Column 1)
     * ──────────────────────────────────────────────────────────── */
    water_spread_area: { type: Number },
    total_site_area: { type: Number },
    primary_function: { type: String },
    hfl: { type: Number },
    mwl: { type: Number },
    inlet_level: { type: Number },
    outlet_level: { type: Number },
    no_of_inlets: { type: Number },
    no_of_outlets: { type: Number },
    social_amenities: { type: String },

    /* ─────────────────────────────────────────────────────────────
     * 3. PARKS / FORESTS SPECIFIC FIELDS (Google Sheet Column 2)
     * ──────────────────────────────────────────────────────────── */
    area: { type: Number },
    amenities_before_intervention: { type: String },

    /* ─────────────────────────────────────────────────────────────
     * 4. STORM DRAINS / ROADS SPECIFIC FIELDS (Google Sheet Column 3)
     * ──────────────────────────────────────────────────────────── */
    start_latitude: { type: Number },
    start_longitude: { type: Number },
    end_latitude: { type: Number },
    end_longitude: { type: Number },
    length: { type: Number },
    average_width: { type: Number },
    average_depth: { type: Number },
    pre_intervention_condition: { type: String },
    designed_capacity: { type: Number },
    catchment_area_served: { type: Number },
    intervention_zone: { type: String },

    /* ─────────────────────────────────────────────────────────────
     * 5. APPLICATION MEDIA & VISUALS
     * ──────────────────────────────────────────────────────────── */
    image_url: { type: String, default: '' },
    images: [{ type: String }],
  },
  { timestamps: true }
);

SiteProjectSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SiteProject', SiteProjectSchema);
