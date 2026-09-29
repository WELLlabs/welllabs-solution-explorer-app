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
    // Not required for Google SSO users or invited users who haven't set one yet
    required: function() {
      return this.authProvider !== 'google' && this.status !== 'invited';
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
  // Account lifecycle: 'invited' users have not set a password yet
  status: {
    type: String,
    enum: ['active', 'suspended', 'invited'],
    default: 'active',
  },
  suspendedAt: { type: Date, default: null },
  suspendedReason: { type: String, default: '' },
  // Bumped to invalidate every token issued before (force logout)
  tokenVersion: { type: Number, default: 0 },
  lastLoginAt: { type: Date, default: null },
  invitedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  // One-time link for password reset or invite acceptance (only the hash is stored)
  passwordTokenHash: { type: String, default: null, select: false },
  passwordTokenPurpose: { type: String, enum: ['reset', 'invite', null], default: null, select: false },
  passwordTokenExpires: { type: Date, default: null, select: false },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);

