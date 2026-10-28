export const PROJECT_STAGES = [
  {
    id: 0,
    status: "Open for funding",
    description: "The project has been identified through city-wide stormwater modelling and is listed on the platform, but no funder has committed yet.",
  },
  {
    id: 1,
    status: "Funder interest received",
    description: "A funder has expressed interest in the project and initial discussions have begun.",
  },
  {
    id: 2,
    status: "Consultant engaged",
    description: "A consultant has been selected to carry out site assessment, surveys and feasibility studies.",
  },
  {
    id: 3,
    status: "Detailed design and DPR prepared",
    description: "The Detailed Project Report (DPR), including designs, cost estimates and projected impact, has been prepared.",
  },
  {
    id: 4,
    status: "Approvals and NOCs obtained",
    description: "Necessary approvals have been received from the relevant authorities, such as the Greater Bengaluru Authority or the concerned city corporation, BWSSB, the Karnataka Lake Conservation and Development Authority (for lake-related works), and the Tree Officer or Forest Department where trees are affected.",
  },
  {
    id: 5,
    status: "MoU signed",
    description: "A Memorandum of Understanding has been signed between the funder and the implementing government agency, defining roles, responsibilities, timelines and maintenance obligations.",
  },
  {
    id: 6,
    status: "Funds released",
    description: "The funder has released the first tranche of funds, as per the MoU.",
  },
  {
    id: 7,
    status: "Work order issued",
    description: "The implementing contractor has been appointed and the work order issued.",
  },
  {
    id: 8,
    status: "Under implementation",
    description: "Construction is in progress. This stage can show the percentage of work completed and photographs from site visits.",
  },
  {
    id: 9,
    status: "Completed on [date]",
    description: "Construction is complete and the completion date is recorded.",
  },
  {
    id: 10,
    status: "Handed over and under monitoring",
    description: "The project has been handed over to the responsible agency for operation and maintenance, and its actual impact (runoff managed and increase in infiltration) is being monitored against the projected figures.",
  },
];

// Replace a project's entry when its stage, dates, owners, or documents change.
const PROJECT_STATUS_BY_ID = {};

const DEFAULT_STATUS = {
  currentStage: 0,
  events: {
    0: {
      date: "Listed on the platform",
      party: "City-wide stormwater modelling",
      documents: [],
    },
  },
};

export function statusForProject(projectId) {
  return PROJECT_STATUS_BY_ID[projectId] || DEFAULT_STATUS;
}

export function stageTitle(stage, event) {
  if (stage.id === 9 && event?.date && event.date !== "Listed on the platform") {
    return `Completed on ${event.date}`;
  }
  return stage.status;
}
