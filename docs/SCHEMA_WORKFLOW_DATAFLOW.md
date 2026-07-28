# Schema, Workflow & Dataflow — Solution Explorer

This document consolidates the complete **Database Schemas**, **Operational Workflows**, and **Dataflow Systems** for the **WELL Labs Solution Explorer**.

---

## 🗄️ Part 1: Database Entity Relationship & Linkage Model

```mermaid
erDiagram
    SiteProject ||--o{ Intervention : "contains multiple"
    SiteProject {
        string site_id PK
        string type "lake | park | stormdrain | campus"
        string name
        number latitude
        number longitude
        object location "GeoJSON Point [lng, lat]"
        string watershed
        string site_level_impact
        string subcatchment_level_impact
        array linked_intervention_ids
    }

    Intervention {
        string intervention_id PK
        string type "bioswale | raingarden | percolation | ecobloc | etc."
        string site_id FK "References SiteProject.site_id"
        string site_name
        number latitude
        number longitude
        object location "GeoJSON Point [lng, lat]"
        number quantity
        object details "Flexible dimensions & attributes"
    }

    Well {
        string _id PK
        string wellName
        string wellType
        number latitude
        number longitude
        object location "GeoJSON Point [lng, lat]"
        number ph
        number tds
        number ec
        number salinity
        string hasFluoride
        string hasArsenic
        string wardName
        string corporation
    }

    Project {
        string _id PK
        string projNo
        string projName
        number latitude
        number longitude
        object location "GeoJSON Point [lng, lat]"
        string budget
        string timeline
        string status
        string projLead
        string wardName
    }

    User {
        string _id PK
        string name
        string email UK
        string password "Hashed"
        string role "Admin | Pending | WELL Labs1 | WELL Labs2 | Consultant | GBA | Donor"
    }
```

---

## 📋 Part 2: Collection Schemas & Data Dictionary

### 1. `SiteProject` Collection
Represents physical sites where Blue-Green-Grey interventions are planned or deployed.

| Field | Type | Index | Description |
| :--- | :--- | :--- | :--- |
| `site_id` | String | Unique, Indexed | Unique identifier for the site (e.g., `PARK_001`, `LAKE_002`). |
| `type` | String | Indexed | Category: `'park'` (Green), `'lake'` (Blue), `'stormdrain'` (Grey), or `'campus'`. |
| `name` | String | - | Name of the site or landmark. |
| `latitude` | Number | - | Decimal latitude. |
| `longitude` | Number | - | Decimal longitude. |
| `location` | GeoJSON Point | `2dsphere` | `{ type: "Point", coordinates: [lng, lat] }` for spatial queries. |
| `watershed` | String | - | Micro-watershed name (e.g., `"Nallurhalli Micro Watershed"`). |
| `site_level_impact` | String | - | Expected site-level environmental/water impact description. |
| `subcatchment_level_impact` | String | - | Expected subcatchment impact description. |
| `linked_intervention_ids` | Array[String] | Indexed | Array of `intervention_id` values associated with this site. |
| `needs_review` | Boolean | - | Flag indicating manual verification required. |
| `review_reason` | String | - | Reason for review flag. |

---

### 2. `Intervention` Collection
Represents individual nature-based or engineering interventions within a site.

| Field | Type | Index | Description |
| :--- | :--- | :--- | :--- |
| `intervention_id` | String | Unique, Indexed | Unique identifier for the intervention. |
| `type` | String | Indexed | Category: `bioswale`, `raingarden`, `infiltration_trench`, `percolation`, `detention_basin`, `constructed_wetlands`, `rainwater_harvesting`, `permeable_pathway`, `ecobloc`, `tree_trench`, `swd_inlet`, `underground_tank`, `other`. |
| `site_id` | String | Indexed | Foreign key linking to parent `SiteProject.site_id`. |
| `site_name` | String | - | Denormalized parent site name for fast retrieval. |
| `latitude` | Number | - | Decimal latitude. |
| `longitude` | Number | - | Decimal longitude. |
| `location` | GeoJSON Point | `2dsphere` | `{ type: "Point", coordinates: [lng, lat] }`. |
| `quantity` | Number | - | Number of units installed/planned. |
| `details` | Mixed Object | - | Dynamic key-value pairs (length, width, depth, area, tentative cost). |

---

### 3. `Well` Collection
Stores open well and bore well monitoring data across Bengaluru.

| Field | Type | Index | Description |
| :--- | :--- | :--- | :--- |
| `wellName` | String | - | Name/Identifier of the well. |
| `latitude` / `longitude` | Number | - | Coordinates of the well location. |
| `location` | GeoJSON Point | `2dsphere` | Spatial index point. |
| `wellType` | String | - | Type of well (e.g., Open Well, Borewell). |
| `ph`, `tds`, `ec`, `salinity` | Number | - | Water quality chemical parameters. |
| `hasFluoride`, `hasArsenic` | String | - | Chemical contamination indicators. |
| `wardName`, `corporation` | String | - | Administrative division and municipal corporation details. |

---

### 4. `Project` Collection
Stores municipal drainage, lake rejuvenation, and rainwater harvesting projects.

| Field | Type | Index | Description |
| :--- | :--- | :--- | :--- |
| `projNo` / `projName` | String | - | Project number and name. |
| `budget`, `timeline`, `status`| String | - | Financial budget, execution timeline, and current status. |
| `projLead`, `stakeholders` | String | - | Lead entity and project stakeholders. |
| `areaCatchment`, `drainLength`| String | - | Catchment area covered and drain length constructed. |

---

### 5. `User` Collection
Stores user authentication credentials and Role-Based Access Control (RBAC).

| Field | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `name` | String | Required | Full name of the user. |
| `email` | String | Unique, Required | User email address. |
| `password` | String | Required | Encrypted password string. |
| `role` | String | Enum, Default: `'Pending'` | Access level: `'Admin'`, `'Pending'`, `'WELL Labs1'`, `'WELL Labs2'`, `'Consultant'`, `'GBA'`, `'Donor'`. |

---

## 🔄 Part 3: Data Ingestion & ETL Workflow (Google Sheets → MongoDB)

```mermaid
sequenceDiagram
    autonumber
    participant GS as Google Sheet (Shared CSV)
    participant Script as ETL Script (importFromGoogleSheets.js)
    participant Log as Review Log (review-log.json)
    participant Mongo as MongoDB Atlas

    Note over Script: Execution: npm run import:sheets [-- --write] [-- --drop]
    Script->>GS: Fetch public CSV via HTTPS Export URL
    GS-->>Script: Raw CSV string response
    Script->>Script: Detect header row & column index matching
    
    loop For each row in CSV
        Script->>Script: Parse DMS/Decimal coordinates (e.g. 12°59'11"N → 12.986)
        Script->>Script: Map site type & intervention type enums
        alt Parsing issue detected
            Script->>Log: Push issue to review-log.json
        else Valid Record
            Script->>Script: Transform to SiteProject & Intervention schemas
        end
    end

    alt Dry-Run Mode (No --write flag)
        Script->>Log: Save review-log.json & print summary statistics
        Note over Script: Exit without modifying MongoDB
    else Write Mode (--write flag)
        opt --drop flag provided
            Script->>Mongo: Clear SiteProject & Intervention collections
        end
        Script->>Mongo: Upsert SiteProject documents ($set, upsert: true)
        Script->>Mongo: Upsert Intervention documents ($set, upsert: true)
        Mongo-->>Script: Operation confirmation
    end
```

---

## 🌐 Part 4: API Request Dataflow (Frontend → Backend → DB)

```mermaid
sequenceDiagram
    autonumber
    participant UI as React Client Component (DataLayersView / NewProjectsView)
    participant API as Express Router (/api/sites, /api/analytics)
    participant Auth as Auth Middleware (protect)
    participant DB as MongoDB Instance

    UI->>API: GET /api/sites
    API->>DB: SiteProject.find({}).lean()
    DB-->>API: Array of SiteProjects
    API->>DB: Intervention.find({ site_id: { $in: siteIds } }).lean()
    DB-->>API: Array of Interventions
    API->>API: Group & embed interventions into site objects
    API-->>UI: JSON Payload (Sites with embedded Interventions array)

    UI->>UI: Update React state & re-render spatial GIS map markers
```

---

## 🗺️ Part 5: GIS Interactive User Workflow

```mermaid
graph TD
    A["User Opens Solution Explorer Web App"] --> B["Default View: GIS Map loaded with Ward Boundaries & BGG Layers"]
    
    B --> C{"User Interaction"}
    
    C -->|Toggle Layers| D["Show/Hide Blue Lakes, Green Parks, Grey Drains, Groundwater Wells"]
    C -->|Select Administrative Filter| E["Filter View by Corporation / Ward Name"]
    C -->|Click Map Marker| F["Open Site Detail Modal"]
    
    D --> G["Client-Side Spatial Filtering & Leaflet Marker Re-render"]
    E --> H["Trigger /api/analytics/ward API Call & Update Summary Metrics"]
    F --> I["Display Site Impact, Linked Interventions, Quantity & Dimensions"]
```
