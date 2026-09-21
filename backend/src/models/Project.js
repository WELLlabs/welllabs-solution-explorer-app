const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  projNo: { type: String },
  projName: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [longitude, latitude] - optional
  },
  budget: { type: String },
  timeline: { type: String },
  status: { type: String },
  projLead: { type: String },
  stakeholders: { type: String },
  tags: { type: String },
  areaCatchment: { type: String },
  drainLength: { type: String },
  mediaLink: { type: String },
  fid: { type: String },
  acNo: { type: String },
  ac: { type: String },
  acKn: { type: String },
  assembly: { type: String },
  wardId: { type: String },
  corporation: { type: String },
  corporationId: { type: String },
  wardName: { type: String },
  wardNameKn: { type: String },
  corporationKn: { type: String }
}, { timestamps: true });

// Create geospatial index for map queries
projectSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Project', projectSchema);
