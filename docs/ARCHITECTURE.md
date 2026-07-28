# Solution Architecture & Tech Stack — Solution Explorer

The **WELL Labs Solution Explorer** is an open-source geospatial decision-support platform designed to visualize, track, and model **Blue-Green-Grey (BGG)** infrastructure, groundwater wells, and municipal rainwater harvesting projects across Bengaluru.

---

## 🏛 High-Level Architecture Overview

```mermaid
graph TD
    subgraph Data Sources & Ingestion
        GS[Google Sheets Data] -->|CSV Export| ETL[Node.js Import Script /importFromGoogleSheets.js]
    end

    subgraph Database Layer
        ETL -->|Upsert Documents| Mongo[(MongoDB Atlas / AWS DocumentDB)]
    end

    subgraph Backend API Services
        Mongo <-->|Mongoose 2dsphere Queries| Express[Node.js + Express 5.x REST API]
        Express --> Auth[JWT & Auth Middleware]
        Express --> SitesAPI[/api/sites - SiteProjects & Interventions]
        Express --> AnalyticsAPI[/api/analytics - Overview, Wards & Projects]
    end

    subgraph Frontend Application
        Express <-->|JSON REST Endpoints| React[React 18 + Vite SPA]
        React --> MapEngine[Leaflet / GIS Map Layer Renderers]
        React --> Dashboards[DataLayersView / NewProjectsView / BGG Intro]
        React --> StateManager[React Context API]
    end
```

---

## 🛠 Technology Stack

### 1. Frontend Architecture
* **Core Framework**: React 18 with Vite for ultra-fast builds and module bundling.
* **Styling**: Tailwind CSS for responsive UI design system and layout components.
* **Iconography**: Lucide React for consistent UI icons.
* **Map & GIS Rendering**: Leaflet / Custom GeoJSON renderers for interactive spatial visualizers (Parks, Lakes, Storm Drains, Wells, Ward Boundaries).
* **State Management**: React Context API (`AuthContext`, Data Layer State) for global user authentication and spatial filtering state.

### 2. Backend API Architecture
* **Runtime**: Node.js (v18+).
* **Framework**: Express.js 5.x for lightweight, asynchronous REST APIs.
* **Database Driver / ORM**: Mongoose 9.x for structured schema validation and geospatial index operations.
* **Security & Auth**: `jsonwebtoken` (JWT) for session control, `bcryptjs` for secure password hashing, and CORS/cookie-parser middleware.

### 3. Database & Spatial Indexing
* **Database Engine**: MongoDB (AWS Hosted / Atlas / Self-Hosted EC2).
* **Geospatial Engine**: MongoDB `2dsphere` spatial indexing on GeoJSON Point arrays (`coordinates: [longitude, latitude]`) enabling spatial distance calculations and boundary queries.

### 4. Data Pipeline & ETL (Extract, Transform, Load)
* **Script**: `backend/scripts/importFromGoogleSheets.js`.
* **Capabilities**:
  * Automated CSV fetching directly from shared Google Sheets.
  * Coordinate Parser converting Degrees-Minutes-Seconds (DMS) `12°59'11.70"N` to decimal floating points `12.9865833`.
  * Dry-run mode (`node scripts/importFromGoogleSheets.js`) with issue logging (`review-log.json`).
  * Live MongoDB upsert engine (`--write` and optional `--drop` flag).

---

## 📁 Repository Structure

```
bangalore mern application/
├── backend/
│   ├── config/             # DB & App Configuration
│   ├── controllers/        # Business logic (analyticsController, authController)
│   ├── middleware/         # Auth & validation middlewares
│   ├── models/             # Mongoose schemas (SiteProject, Intervention, Well, Project, User)
│   ├── routes/             # REST API endpoints (/api/sites, /api/analytics, /api/auth)
│   ├── scripts/            # ETL scripts (importFromGoogleSheets.js)
│   └── server.js           # Server entry point
├── frontend/
│   ├── src/
│   │   ├── assets/         # Static visual assets & map icons
│   │   ├── components/     # UI & Dashboard components (DataLayersView, NewProjectsView, etc.)
│   │   ├── context/        # React Context providers
│   │   ├── pages/          # Top-level pages
│   │   └── App.jsx         # App router & layout container
│   └── package.json
└── docs/                   # Open-source technical documentation
```
