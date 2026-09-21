export const SITE_TYPOLOGY_OPTIONS = [
  { id: "park", label: "Park" },
  { id: "lake", label: "Lake" },
  { id: "road", label: "Roads" },
  { id: "stormwater_drain", label: "Stormwater drain" },
  { id: "foreshore", label: "Foreshore" },
  { id: "street_tree_avenue", label: "Street tree avenue" },
  { id: "residential_building", label: "Residential building" },
  { id: "institutional_campus", label: "Institutional campus" },
  { id: "sewage_treatment_plant", label: "Sewage treatment plant" },
  { id: "stream", label: "Stream" },
  { id: "floodplain", label: "Floodplain" },
  { id: "recharge_pit", label: "Recharge pit" },
  { id: "reservoir", label: "Reservoir" },
  { id: "parking_lot", label: "Parking lot" },
];

export const INTERVENTION_TYPOLOGY_OPTIONS = [
  { id: "bioswale", label: "Bioswale" },
  { id: "raingarden", label: "Rain Garden" },
  { id: "detention", label: "Detention Basin" },
  { id: "infiltration_trench", label: "Infiltration Trench" },
  { id: "percolation", label: "Percolation" },
  { id: "constructed_wetlands", label: "Constructed Wetlands" },
  { id: "rainwater_harvesting", label: "Rainwater Harvesting" },
  { id: "retention_basin", label: "Retention Basin" },
];

export const NEW_PROJECTS_DATA = [
  {
    id: "kasavanahalli",
    name: "Kasavanahalli Lake",
    stage: "Design",
    phase: "Phase 2",
    progress: 34,
    cost: "₹4.20 Cr",
    committed: "₹4.20 Cr",
    lat: 12.903973,
    lng: 77.667712,
    watershedId: "kasavanahalli_ws",
    details:
      "Rejuvenation of the lake. Focuses on setting up wetland systems, desilting, channel restoration, improving water quality index, and constructing perimeter walking pathways for the local community.",
  },
  {
    id: "doddakannelli",
    name: "Doddakannelli Lake",
    stage: "Design",
    phase: "Phase 1",
    progress: 11,
    cost: "₹2.10 Cr",
    committed: "₹2.10 Cr",
    lat: 12.9126,
    lng: 77.6896,
    watershedId: "kasavanahalli_ws",
    details:
      "Diagnosing sewage inlet points and catchment siltation. A detailed project report (DPR) is underway to divert raw sewage from entering the main lake body.",
  },
  {
    id: "varthur",
    name: "Varthur Lake — Zone 1",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 10,
    cost: "₹9.60 Cr",
    committed: "₹9.60 Cr",
    lat: 12.9431,
    lng: 77.7471,
    watershedId: "kadugodi_ws",
    details:
      "Comprehensive catchment mapping and water quality monitoring. Focuses on sediment analysis and planning massive de-weeding and aeration systems to restore the lake's ecological balance.",
  },
  {
    id: "halanayakanahalli",
    name: "Halanayakanahalli Lake",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 0,
    cost: "₹2.80 Cr",
    committed: "₹2.80 Cr",
    lat: 12.8988,
    lng: 77.6922,
    watershedId: "kasavanahalli_ws",
    details:
      "Preliminary environmental baseline assessment. Project kicked off to map the incoming storm-water drains and outline encroachment boundaries for eviction and preservation.",
  },
  {
    id: "saulkere",
    name: "Saul Kere",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 0,
    cost: "₹3.60 Cr",
    committed: "₹3.60 Cr",
    lat: 12.9238,
    lng: 77.6787,
    watershedId: "saulkere_ws",
    details:
      "Diagnosis stage to analyze catchment runoff and identify point sources of heavy metal pollution. Planning installation of trash racks and silt traps at key inlet channels.",
  },
  {
    id: "kadugodi_park",
    name: "Kadugodi Tree & Forest Parks",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 5,
    cost: "₹1.40 Cr",
    committed: "₹0.00 Cr",
    lat: 12.9904,
    lng: 77.7608,
    watershedId: "kadugodi_ws",
    details:
      "Integrated nature-based solutions across Kadugodi Tree Park, Children Park, and Inner Circle Park. Implementing rain gardens, infiltration trenches, and bioswales to capture catchment runoff.",
  },
  {
    id: "hoodi_lake",
    name: "Hoodi Lake & KTPO Campus",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 5,
    cost: "₹3.20 Cr",
    committed: "₹0.00 Cr",
    lat: 12.9938,
    lng: 77.7163,
    watershedId: "hoodi_ws",
    details:
      "Recharging solutions at Hoodi Lake and the KTPO office campus. Implements bioretention rain gardens, bioswales, detention basins, and EcoBloc underground storm water storage cells.",
  },
  {
    id: "sheelavanthakere_lake",
    name: "Sheelavanthakere Lake & Parks",
    stage: "Diagnosis",
    phase: "Phase 1",
    progress: 5,
    cost: "₹1.90 Cr",
    committed: "₹0.00 Cr",
    lat: 12.9554,
    lng: 77.7287,
    watershedId: "sheelavanthakere_ws",
    details:
      "Storm runoff absorption and buffer recovery around Sheelavanthakere Lake and Nallurhalli Park. Focuses on bund infiltration trenches, rain gardens, and perimeter bioswales.",
  },
];

export const FLOOD_SPOTS_DATA = [
  {
    id: "spot-1",
    name: "Kadugodi Road Intersection",
    lat: 12.9985,
    lng: 77.7612,
    watershedId: "kadugodi_ws",
    details:
      "Severe flooding occurs under heavy downpours due to high surface runoff from the surrounding tree parks and paved layouts.",
  },
  {
    id: "spot-2",
    name: "Whitefield Station Approach Road",
    lat: 12.995,
    lng: 77.751,
    watershedId: "kadugodi_ws",
    details:
      "Water logging up to 2 feet occurs during design storms, blocking transit routes.",
  },
  {
    id: "spot-3",
    name: "Hoodi Circle Underpass",
    lat: 12.9912,
    lng: 77.712,
    watershedId: "hoodi_ws",
    details:
      "Depressed underpass acts as a sink for runoff flowing from the industrial blocks.",
  },
  {
    id: "spot-4",
    name: "KTPO Intersection Road",
    lat: 12.989,
    lng: 77.728,
    watershedId: "hoodi_ws",
    details:
      "High percentage of built-up area causes instant peak discharge onto roads.",
  },
  {
    id: "spot-5",
    name: "Sheelavanthakere Low Layouts",
    lat: 12.959,
    lng: 77.732,
    watershedId: "sheelavanthakere_ws",
    details:
      "Backwater effect from lake overflow during intense events impacts surrounding houses.",
  },
  {
    id: "spot-6",
    name: "Nallurhalli Junction",
    lat: 12.964,
    lng: 77.741,
    watershedId: "sheelavanthakere_ws",
    details:
      "Encroached channels and blocked drains cause storm runoff to spill onto roads.",
  },
  {
    id: "spot-7",
    name: "Outer Ring Road (ORR) Saul Kere segment",
    lat: 12.9245,
    lng: 77.682,
    watershedId: "saulkere_ws",
    details:
      "Low elevation segment adjacent to the lake outlet, prone to gridlock under storm events.",
  },
  {
    id: "spot-8",
    name: "Sarjapur Road - HSR link",
    lat: 12.9055,
    lng: 77.671,
    watershedId: "kasavanahalli_ws",
    details:
      "Flooding at low points due to lack of adequate storm water disposal infrastructure.",
  },
];

export const WATERSHEDS_POLYGONS = {
  kadugodi_ws: {
    name: "Kadugodi Watershed (East)",
    color: "#10b981",
    coords: [
      [13.006, 77.745],
      [13.008, 77.775],
      [12.98, 77.778],
      [12.982, 77.74],
    ],
  },
  hoodi_ws: {
    name: "Hoodi Watershed (Central-North)",
    color: "#8b5cf6",
    coords: [
      [13.002, 77.7],
      [13.005, 77.735],
      [12.978, 77.738],
      [12.975, 77.702],
    ],
  },
  sheelavanthakere_ws: {
    name: "Sheelavanthakere Watershed (Central-South)",
    color: "#0284c7",
    coords: [
      [12.972, 77.72],
      [12.975, 77.755],
      [12.948, 77.758],
      [12.945, 77.722],
    ],
  },
  kasavanahalli_ws: {
    name: "Kasavanahalli Lake Watershed",
    color: "#ec4899",
    coords: [
      [12.922, 77.655],
      [12.925, 77.7],
      [12.892, 77.705],
      [12.89, 77.66],
    ],
  },
  saulkere_ws: {
    name: "Saul Kere Watershed",
    color: "#ea580c",
    coords: [
      [12.935, 77.665],
      [12.938, 77.695],
      [12.912, 77.698],
      [12.91, 77.668],
    ],
  },
};
