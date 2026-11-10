// Consultant / agency inboxes for "Show interest" emails. Keys match AG in
// frontend/src/components/NewProjectsView.jsx. An agency without an email cannot be contacted.
// Each address can be overridden with an env var, e.g. CONSULTANT_EMAIL_WELLLABS.
const CONSULTANTS = {
  // welllabs: { name: 'WELL Labs', email: 'welllabs.jaltol@ifmr.ac.in' },
  welllabs: { name: 'WELL Labs', email: 'welllabs.jaltol@ifmr.ac.in' },
  fol: { name: 'Friends of Lakes', email: '' },
  malligavad: { name: 'Malligavad Foundation', email: '' },
  biome: { name: 'Biome Environmental Trust', email: '' },
  unitedway: { name: 'United Way Bengaluru', email: '' },
  trust: { name: 'Lake committee trust', email: '' },
};

const consultantById = (id) => {
  const entry = CONSULTANTS[id];
  if (!entry) return null;
  const override = process.env[`CONSULTANT_EMAIL_${String(id).toUpperCase()}`];
  return { ...entry, email: (override || entry.email || '').trim() };
};

module.exports = { CONSULTANTS, consultantById };
