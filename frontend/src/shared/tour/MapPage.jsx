/**
 * MAP_TOUR_STEPS — 7 Complete Guided Walkthrough Steps
 * Exactly matching all 8 images provided.
 */

export const MAP_TOUR_STEPS = [
  // 1. Screenshot 1 — "What's Happening in the City?" Intro
  {
    id: "whats-happening",
    targets: ["whats-happening-row"],
    placement: "right",
    title: "Do you want to see what kind of interventions are happening in your city?",
    body: [
      { text: "Click here to explore by site typology and intervention typology all across the city!" },
      { text: "Explore allocated budgets and spent budgets within the city." },
    ],
  },

  // 2. Screenshot 2 — Map View with Markers & Project Telemetry Popup
  {
    id: "project-telemetry",
    targets: ["project-popup"],
    placement: "right",
    title: "Do you want to see what kind of interventions are happening in your city?",
    body: [
      {
        text: "Click here to explore by site typology and intervention typology all across the city! Explore allocated budgets and spent budgets within the city.",
      },
    ],
  },

  // 3. Screenshot 3 — "Water Risks of the City?" (Flood Risk)
  {
    id: "water-risks",
    targets: ["flood-risk-row"],
    placement: "right",
    title: "Do you want to see what kind of issues are happening in your city and which areas are more prone to them?",
    body: [
      {
        arrow: true,
        text: "Click here to explore a flood risk map of the city which shows the severity of flooding across the city",
      },
    ],
  },

  // 4. Screenshot 4 — Assessing Project Placement Against Risk Layers (Overlay)
  {
    id: "assess-placement",
    targets: ["existing-interventions-full"],
    placement: "right",
    title: "Do you want to assess whether the existing projects are in the right location for maximum impact?",
    body: [
      {
        arrow: true,
        text: "Explore existing projects with its typology, site, and Blue-Green-Grey classifications across the city.",
      },
      {
        arrow: false,
        text: "Switch on risk layer. You can switch on either flooding or groundwater risk layer depending upon which issue you want to address.",
      },
      {
        arrow: false,
        text: "For instance a recharge well should be more prioritized in an area of groundwater risk- If you click on the projects you can see their main benefits and co benefits. Click more to compare!",
      },
    ],
  },

  // 5. Screenshot 5 — "Explore Potential Projects?" (City wide BGG projects)
  {
    id: "explore-potential-projects",
    targets: ["citywide-bgg-row"],
    placement: "right",
    title: "Do you want to see what kind of interventions can happen in your city to have maximum impact?",
    body: [
      {
        text: "Click here to explore city wide blue green grey plan (menu card of city wide projects) or search projects by corporation/area/ward.",
      },
      {
        text: "These projects are available to fund, design, implement and volunteer!",
      },
    ],
  },

  // 6. Screenshot 6 — Flooding Hotspot Map & Catchment Delineation
  {
    id: "flood-hotspot-map",
    targets: ["hotspot-popup", "hotspot-map-target"],
    placement: "right",
    title: "Do you want to explore which projects can be taken up to tackle a particular flooding hotspot?",
    body: [
      {
        text: "You can click on the hotspot or the watershed you are interested in to see the projects associated to it!",
      },
    ],
  },

  // 7. Screenshots 7 & 8 — Candidate Sites / Funding Deck Drawer
  {
    id: "fund-projects",
    targets: ["funding-panel"],
    placement: "left",
    title: "Do you want to fund projects to help city mitigate the issue?",
    body: [
      {
        text: "You can select multiple project or a single projects to fund! You can click on the project to see more details!",
      },
      {
        text: "See bottom to understand the impact and costing of a set or projects or an individual project.",
      },
    ],
  },
];