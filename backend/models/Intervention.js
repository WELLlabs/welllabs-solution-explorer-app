const mongoose = require('mongoose');
const { Schema } = mongoose;

/**
 * Intervention — one document per intervention row in the sheet.
 * Linked back to a SiteProject via site_id.
 */
const InterventionSchema = new Schema(
  {
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

    // back-reference to parent SiteProject
    site_id: { type: String, index: true, default: null },
    site_name: String,

    latitude: Number,
    longitude: Number,

    // GeoJSON point
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: [Number], // [lng, lat]
    },

    quantity: Number,

    // raw dimension fields (actual values from the sheet)
    details: { type: Schema.Types.Mixed, default: {} },

    needs_review: { type: Boolean, default: false },
    review_reason: String,
  },
  { timestamps: true }
);

InterventionSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Intervention', InterventionSchema);
