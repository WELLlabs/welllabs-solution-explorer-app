# Workflow & Dataflow Architecture — Solution Explorer

This document details the operational dataflows, ETL ingestion pipelines, API request-response lifecycles, and GIS user interaction workflows in the **WELL Labs Solution Explorer**.

---

## 🔄 1. Data Ingestion & ETL Workflow (Google Sheets → MongoDB)

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

## 🌐 2. API Request Dataflow (Frontend → Backend → DB)

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

## 🗺 3. GIS Interactive User Workflow

```mermaid
graph TD
    A[User Opens Solution Explorer Web App] --> B[Default View: GIS Map loaded with Ward Boundaries & BGG Layers]
    
    B --> C{User Interaction}
    
    C -->|Toggle Layers| D[Show/Hide Blue Lakes, Green Parks, Grey Drains, Groundwater Wells]
    C -->|Select Administrative Filter| E[Filter View by Corporation / Ward Name]
    C -->|Click Map Marker| F[Open Site Detail Modal]
    
    D --> G[Client-Side Spatial Filtering & Leaflet Marker Re-render]
    E --> H[Trigger /api/analytics/ward API Call & Update Summary Metrics]
    F --> I[Display Site Impact, Linked Interventions, Quantity & Dimensions]
```

---

## ⚡ 4. Error Handling & Reliability Principles

1. **Defensive Coordinate Parsing**:
   * Accepts both DMS (`12°59'11.70"N`) and decimal float formats (`12.9865833`).
   * Fallback values prevent broken spatial geometries from disrupting map rendering.

2. **Geospatial Safety**:
   * GeoJSON points are only created when both valid latitude and longitude are present.

3. **Data Integrity via Upserts**:
   * Re-running imports updates existing documents based on `site_id` and `intervention_id` rather than creating duplicates.
