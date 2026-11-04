const mongoose = require('mongoose');
const { Schema } = mongoose;

const ProjectSubmissionSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    type: {
      type: String,
      enum: ['lake', 'park', 'stormdrain', 'campus', 'other'],
      default: 'park',
      required: true,
    },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
    location: {
      type: { type: String, enum: ['Point'], default: 'Point' },
      coordinates: { type: [Number], required: true }, // [longitude, latitude]
    },
    ward: { type: String, default: '' },
    bbmp_zone: { type: String, default: '' },
    watershed: { type: String, default: '' },
    implementing_agency: { type: String, default: '' },
    implementation_partners: { type: String, default: '' },
    project_start_year: { type: String, default: '' },
    project_end_year: { type: String, default: '' },
    current_stage: { type: String, default: 'Proposed' },
    total_cost: { type: String, default: '' },
    pre_intervention_issues: { type: String, default: '' },
    context: { type: String, default: '' },
    site_level_impact: { type: String, default: '' },
    subcatchment_level_impact: { type: String, default: '' },
    image_url: { type: String, default: '' },
    images: [{ type: String }],
    documents: [{ name: String, url: String }],

    // Submitter Info (Captured from authenticated user)
    submittedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    submitterName: { type: String, default: '' },
    submitterEmail: { type: String, default: '' },
    submitterRole: { type: String, default: '' },
    submitterOrg: { type: String, default: '' },

    // Status & Approval Workflow
    status: {
      type: String,
      enum: ['pending_review', 'approved', 'rejected'],
      default: 'pending_review',
      index: true,
    },
    assignedLayer: {
      type: String,
      enum: ['bgg_sites', 'existing_interventions', ''],
      default: '',
    },
    approvedSiteId: { type: String, default: '' },
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    reviewedAt: { type: Date },
    adminNotes: { type: String, default: '' },
  },
  { timestamps: true }
);

ProjectSubmissionSchema.index({ location: '2dsphere' });
ProjectSubmissionSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ProjectSubmission', ProjectSubmissionSchema);

