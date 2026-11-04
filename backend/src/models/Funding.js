const mongoose = require('mongoose');

// One funding commitment for one intervention (asset). Uploaded by the admin from consultant data.
const fundingSchema = new mongoose.Schema(
  {
    commitment_id: { type: String, required: true, unique: true, trim: true },
    intervention_id: { type: String, required: true, index: true, trim: true },
    site_id: { type: String, index: true, default: null },
    funder_name: { type: String, required: true, trim: true },
    funder_email: { type: String, trim: true },
    amount: { type: Number, required: true, min: 0 }, // rupees
    status: { type: String, enum: ['committed', 'received', 'completed'], default: 'committed' },
    date: { type: String },
    source: { type: String, trim: true }, // who reported it, e.g. the consultant
    notes: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Funding', fundingSchema);
