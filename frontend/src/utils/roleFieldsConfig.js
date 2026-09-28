/**
 * Role & Field Configurations for Solution Explorer Onboarding
 * 
 * Supports 4 core personas:
 * 1. govt (Government Official)
 * 2. funder (Funder / Investor)
 * 3. designer (Designer / Urban Planner)
 * 4. citizen (Citizen / Community)
 * 
 * Sub-categories for 'userType':
 * - Under 'designer': 'NGO', 'Consultant'
 * - Under 'funder': 'CSR Fund', 'Foundations', 'Philanthropy'
 * - Under 'govt': 'Govt'
 * - Under 'citizen': 'Citizen'
 */

export const PERSONAS = {
  funder: {
    id: "funder",
    label: "Funder",
    badgeLabel: "Funder / Investor",
    icon: "💼",
    subtitle: "CSR funds, philanthropic foundations, and institutional investors financing urban resilience.",
    userTypes: ["CSR Fund", "Foundations", "Philanthropy"],
    extraFields: [
      {
        name: "cinNumber",
        label: "CIN Number (Corporate Identification Number)",
        type: "text",
        placeholder: "e.g. U72200KA2020PTC123456",
        required: true,
        helperText: "21-character alphanumeric code registered with MCA (Ministry of Corporate Affairs)",
      },
    ],
  },
  designer: {
    id: "designer",
    label: "Designer",
    badgeLabel: "Designer / Urban Planner",
    icon: "📐",
    subtitle: "NGOs, environmental consultants, landscape architects, and planning experts.",
    userTypes: ["NGO", "Consultant"],
    extraFields: [
      // Extensible: Add future designer-specific fields here
      // e.g. { name: "portfolioUrl", label: "Portfolio / Website", type: "url" }
    ],
  },
  govt: {
    id: "govt",
    label: "Govt Official",
    badgeLabel: "Government Official",
    icon: "🏛️",
    subtitle: "BBMP, BWSSB, BDA, and city administration stakeholders driving public infrastructure.",
    userTypes: ["Govt"],
    extraFields: [
      // Extensible: Add future govt-specific fields here
      // e.g. { name: "departmentCode", label: "Department Designation", type: "text" }
    ],
  },
  citizen: {
    id: "citizen",
    label: "Citizen",
    badgeLabel: "Citizen / Resident",
    icon: "🌱",
    subtitle: "Bengaluru residents, lake activists, ward committees, and local community leaders.",
    userTypes: ["Citizen"],
    extraFields: [
      // Extensible: Add future citizen-specific fields here
      // e.g. { name: "wardNumber", label: "Home Ward No.", type: "text" }
    ],
  },
};

/** Helper to generate a unique readable User ID */
export const generateReadableUserId = (role = "user") => {
  const prefix = (role || "usr").toUpperCase().slice(0, 3);
  const randomNum = Math.floor(100000 + Math.random() * 900000);
  return `USR-${prefix}-${randomNum}`;
};

