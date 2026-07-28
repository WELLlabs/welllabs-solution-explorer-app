# Use-Case Mapping Document — Solution Explorer

The **WELL Labs Solution Explorer** serves multiple stakeholders involved in urban climate resilience, rainwater harvesting, flood risk reduction, and groundwater management in Bengaluru.

---

## 🎯 Target User Personas & Use-Case Matrix

| Target Persona | Key Pain Points | Platform Solutions & Capabilities | Relevant Modules / Views |
| :--- | :--- | :--- | :--- |
| **Urban Planners & Engineers** | Difficulty identifying optimal locations for nature-based interventions (bioswales, rain gardens). | Spatial mapping of existing Blue-Green-Grey infrastructure with watershed impact metrics. | `DataLayersView.jsx`, `BggIntroduction.jsx` |
| **Municipal Authorities (BBMP / GBA)** | Fragmented tracking of rainwater harvesting projects, budgets, and ward-level coverage. | Ward-level aggregated analytics dashboard, project budget tracking, and status reports. | `NewProjectsView.jsx`, `/api/analytics/ward` |
| **Environmental Researchers & Hydrologists** | Lack of consolidated groundwater quality data (pH, TDS, Fluoride, Arsenic contamination). | Spatial GIS layer mapping open wells and borewells with chemical quality parameters. | `DataLayersView.jsx` (Wells Layer), `/api/analytics/wells` |
| **Donors, CSR & NGO Partners** | Need transparent verification of site interventions and measurable catchment impacts. | Case study showcases, site-level & subcatchment-level impact documentation. | `CaseStudies.jsx`, `Interventions.jsx` |
| **Field Surveyors & Data Teams** | Difficulty syncing spreadsheet survey data with production databases. | Automated Google Sheets ETL importer with dry-run verification logs. | `backend/scripts/importFromGoogleSheets.js` |

---

## 💡 Detailed Core Use Cases

### 1. Spatial Infrastructure & GIS Layer Discovery
* **Description**: Users can interactively toggle overlay layers across Bengaluru:
  * 🟢 **Green Infrastructure**: Parks, urban campus greens, rain gardens, bioswales.
  * 🔵 **Blue Infrastructure**: Lakes, wetlands, retention/detention basins.
  * ⚪ **Grey Infrastructure**: Stormwater drains (SWDs), permeable pathways, ecobloc underground tanks.
  * 🚰 **Groundwater Wells**: Open wells and bore wells with quality metrics.
* **Value Provided**: Eliminates data silos and provides holistic spatial context.

---

### 2. Ward-Level & Catchment Impact Analytics
* **Description**: Municipal administrators can filter projects by **Corporation** or **Ward ID / Name** to view:
  * Total number of active and completed projects.
  * Aggregate financial budget allocated and spent.
  * Catchment area covered and drain length constructed.
* **Value Provided**: Enables evidence-based municipal budgeting and resource allocation.

---

### 3. Open Well Water Quality Monitoring
* **Description**: Provides detailed field survey data on open wells across wards:
  * Chemical health indicators: pH level, Total Dissolved Solids (TDS), Electrical Conductivity (EC), Salinity.
  * Contamination flags: Fluoride and Arsenic presence.
  * Well physical attributes: Depth (ft), diameter (ft), lining, water level.
* **Value Provided**: Assists public health and water security interventions.

---

### 4. Open-Source Data Contribution & Automation
* **Description**: Allows non-technical field workers to update Google Sheets, which can then be safely ingested into MongoDB with validation logs.
* **Value Provided**: Reduces software maintenance overhead and empowers non-developer team members.
