const mongoose = require('mongoose');

/**
 * Flood hotspots added from the admin panel. They are shown on the map
 * together with the built-in hotspots in frontend/src/data/flood_points.json.
 */
const floodHotspotSchema = new mongoose.Schema({
  hotspotId: { type: String, required: true, unique: true },
  location: { type: String, required: true },
  zone: { type: String, default: '' },
  vulnerabilityLevel: { type: String, enum: ['High', 'Medium', 'Low'], default: 'Medium' },
  vulnerabilityMeasure: { type: String, default: '' },
  remarks: { type: String, default: '' },
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  geo: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: [Number],
  },
}, { timestamps: true });

module.exports = mongoose.model('FloodHotspot', floodHotspotSchema);
