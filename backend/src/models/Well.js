const mongoose = require('mongoose');

const wellSchema = new mongoose.Schema({
  wellName: { type: String, required: true },
  latitude: { type: Number },
  longitude: { type: Number },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number] } // [longitude, latitude] - optional
  },
  wellType: { type: String },
  ownerName: { type: String },
  yearDug: { type: String },
  lining: { type: String },
  diameterFt: { type: String },
  depthFt: { type: String },
  waterLevelFt: { type: String },
  ph: { type: Number, default: null },
  tds: { type: Number, default: null },
  ec: { type: Number, default: null },
  salinity: { type: Number, default: null },
  hasFluoride: { type: String },
  hasArsenic: { type: String },
  surveyorName: { type: String },
  surveyDate: { type: String },
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
wellSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Well', wellSchema);
