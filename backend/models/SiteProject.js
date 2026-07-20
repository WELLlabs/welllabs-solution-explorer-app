const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * SiteProject — one document per physical site (park / lake / stormdrain).
 * Multiple interventions can belong to one site via linked_intervention_ids.
 */
const SiteProjectSchema = new Schema(
  {
    site_id: { type: String, required: true, unique: true, index: true },

    // 'park' = Green, 'lake' = Blue, 'stormdrain' = Grey
    type: {
      type: String,
      enum: ['lake', 'park', 'stormdrain', 'campus'],
      required: true,
      index: true,
    },

    name: String,
    latitude: Number,
    longitude: Number,

    // GeoJSON point — populated when lat/lng are valid
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number], // [lng, lat]
    },

    watershed: String,           // e.g. "Nallurhalli Micro Watershed"
    site_level_impact: String,
    subcatchment_level_impact: String,

    linked_intervention_ids: [{ type: String, index: true }],

    // flagged if site type couldn't be mapped confidently
    needs_review: { type: Boolean, default: false },
    review_reason: String,
  },
  { timestamps: true }
);

SiteProjectSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('SiteProject', SiteProjectSchema);
