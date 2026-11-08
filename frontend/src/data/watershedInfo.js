// Copy for the catchment note. Replace this text when the watershed descriptions are final.
export const WATERSHED_INFO_EYEBROW = "Catchment note";
export const WATERSHED_INFO_TITLE = "What a watershed and its impact mean";

// Short definition shown at the top of the popup
export const WATERSHED_INFO_SUMMARY =
  "Watersheds on this platform are sub-catchments produced by city-wide stormwater modelling. Each one is an area of land whose rainfall runoff drains to a common outlet in the drainage network, so runoff, flow routing and intervention performance can be assessed at a meaningful local scale.";

// The two impact figures, shown as cards. `tone` picks the colour: "blue" | "green"
export const WATERSHED_INFO_METRICS = [
  {
    id: "runoff",
    tone: "blue",
    label: "Runoff managed",
    description:
      "Volume of surface runoff that would be intercepted, retained or attenuated if interventions are built on the available open spaces in the sub-catchment.",
  },
  {
    id: "infiltration",
    tone: "green",
    label: "Added infiltration",
    description:
      "Additional share of rainfall that soaks into the ground instead of becoming surface runoff.",
  },
];

export const WATERSHED_INFO_CONCLUSION =
  "Together, these figures show how far interventions can reduce peak flows and restore a more natural infiltration regime in each catchment.";

// Full explanation (revealed by "Read full explanation"). Kept from the original copy.
export const WATERSHED_INFO_PARAGRAPHS = [
  "A watershed, in the context of this platform, refers to the sub-catchments generated through city-wide stormwater modelling. Each sub-catchment is a discrete area of land that drains rainfall runoff to a common outlet or point within the drainage network. Delineating the city into these units allows runoff generation, flow routing, and the performance of potential interventions to be assessed at a spatially meaningful scale.",
  "The impact figures presented for each watershed indicate two hydrological outcomes. The first is the volume of stormwater runoff that can be managed, meaning the quantity of surface runoff that would be intercepted, retained, or attenuated if interventions are implemented in the available open spaces within that sub-catchment. The second is the associated increase in infiltration, representing the additional proportion of rainfall that would percolate into the ground rather than contributing to surface runoff. Together, these metrics quantify how effectively the proposed interventions can reduce peak flows and restore a more natural infiltration regime within each catchment.",
];