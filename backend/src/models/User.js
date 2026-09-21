const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userId: {
    type: String,
    unique: true,
    sparse: true,
  },
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    // Not required for Google SSO users
    required: function() {
      return this.authProvider !== 'google';
    },
  },
  role: {
    type: String,
    enum: ['Admin', 'Pending', 'WELL Labs1', 'WELL Labs2', 'Consultant', 'GBA', 'Donor', 'Funder', 'Citizen'],
    default: 'Pending',
    required: true,
  },
  // Core Persona selected on homepage ('govt', 'funder', 'designer', 'citizen')
  persona: {
    type: String,
    enum: ['govt', 'funder', 'designer', 'citizen', 'admin'],
    default: 'citizen',
  },
  // User Type sub-category:
  // Funder: 'CSR Fund', 'Foundations', 'Philanthropy'
  // Designer: 'NGO', 'Consultant'
  // Govt: 'Government Department', 'Municipal Agency', 'Public Sector Enterprise'
  // Citizen: 'Individual Citizen', 'Community / RWA Member'
  userType: {
    type: String,
    default: '',
  },
  phone: {
    type: String,
    default: '',
  },
  address: {
    type: String,
    default: '',
  },
  organization: {
    type: String,
    default: '',
  },
  profile: {
    type: String,
    default: '',
  },
  areasOfInterest: {
    type: mongoose.Schema.Types.Mixed,
    default: '',
  },
  focusThemes: {
    type: mongoose.Schema.Types.Mixed,
    default: '',
  },
  pastProjects: {
    type: String,
    default: '',
  },
  // Role-specific extensible fields (e.g. CIN number for funder)
  roleSpecificData: {
    cinNumber: { type: String, default: '' },
    department: { type: String, default: '' },
    notes: { type: String, default: '' },
  },
  // Google SSO & Authentication Metadata
  authProvider: {
    type: String,
    enum: ['local', 'google'],
    default: 'local',
  },
  googleId: {
    type: String,
    sparse: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  isProfileComplete: {
    type: Boolean,
    default: false,
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

