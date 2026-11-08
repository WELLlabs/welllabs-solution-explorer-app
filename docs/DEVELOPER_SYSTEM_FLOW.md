# Developer System Architecture & Interaction Flow Manual

> **Document Scope**: Pure technical architecture, folder structure, user roles & UI permissions, map layer click-flows, backend modules, and database schemas.  
> **Audience**: Frontend, Backend, and Database Developers maintaining or extending this platform.

---

## 1. Project Directory Structure

```
bangalore-mern-application/
├── backend/
│   ├── scripts/
│   │   ├── importFromGoogleSheets.js     # ETL: Fetches public Google Sheets, parses DMS coords, syncs to Mongo
│   │   └── importData.js                 # Fallback seed script from local JSON files
│   ├── src/
│   │   ├── config/
│   │   │   ├── db.js                     # Mongoose connection logic
│   │   │   └── cors.js                   # CORS whitelist & regex origin matcher
│   │   ├── middleware/
│   │   │   └── authMiddleware.js         # JWT verification (protect) & role check (admin)
│   │   ├── models/                       # 8 Mongoose Schemas (see Section 5)
│   │   │   ├── SiteProject.js
│   │   │   ├── Intervention.js
│   │   │   ├── Well.js
│   │   │   ├── Project.js
│   │   │   ├── FloodHotspot.js
│   │   │   ├── User.js
│   │   │   ├── AuditLog.js
│   │   │   └── FailedLogin.js
│   │   ├── modules/                      # Modular Domain Services & Controllers
│   │   │   ├── auth/                     # Register, Login, Token lifecycle, Password reset
│   │   │   ├── sites/                    # SiteProjects & linked Interventions CRUD
│   │   │   ├── designCalculator/         # Runoff volume calculation engine
│   │   │   ├── analytics/                # City-wide, Corporation, and Ward aggregation APIs
│   │   │   └── admin/                    # User management, layer imports, audit & failed login telemetry
│   │   ├── utils/                        # Audit logging, role migration scripts
│   │   ├── app.js                        # Express setup, middleware, and route mounting
│   │   └── server.js                     # HTTP listener & DB connection startup
│   ├── server.js                         # Root entrypoint delegating to src/server.js
│   └── package.json
│
├── frontend/
│   ├── public/fonts/                     # Poppins TTF font (for Rupee ₹ rendering in jsPDF)
│   ├── src/
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Global user authentication & token state
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx             # Main application layout shell (handles tab routing)
│   │   │   ├── DesignCalculator.jsx      # Runoff calculation page (subcatchment + storm event)
│   │   │   ├── Login.jsx                 # Public user login
│   │   │   ├── Register.jsx              # User self-registration
│   │   │   ├── AdminLogin.jsx            # Obfuscated admin login (/welllabs-admin-portal)
│   │   │   └── SetPassword.jsx           # Password setup via single-use token
│   │   ├── components/
│   │   │   ├── Header.jsx                # Global navigation bar & user profile badge
│   │   │   ├── DataLayersView.jsx        # PRIMARY GIS ENGINE (Leaflet map, layer toggles, click handlers)
│   │   │   ├── LayerControlSidebar.jsx   # Map layer visibility controls & counters
│   │   │   ├── ItemDetailsPane.jsx       # Right slide-out drawer on map marker click
│   │   │   ├── NewProjectsView.jsx       # BGG project workspace (Overview, Assets, Impact, Funding)
│   │   │   ├── FundAProjectModal.jsx     # 3-step CSR funder questionnaire modal
│   │   │   ├── CatchmentProjectsPanel.jsx# Watershed catchment drawer on polygon click
│   │   │   ├── WatershedInfoPopup.jsx    # Hydrological popup for watershed lines
│   │   │   ├── MapBoundarySearch.jsx     # Search bar for wards, places, and coordinates
│   │   │   ├── AdminPanel.jsx            # Master admin layout
│   │   │   ├── UserManagement.jsx        # User table: change roles, suspend, reset password, invite
│   │   │   ├── AdminAuditLog.jsx         # Administrative action audit table
│   │   │   ├── AdminFailedLogins.jsx     # Failed login monitoring table
│   │   │   ├── AdminDataImport.jsx       # GeoJSON/CSV layer uploader
│   │   │   ├── RoleScreen.jsx            # Dedicated placeholder screen for Govt, NGO, Citizen
│   │   │   └── BggIntroduction.jsx       # Home tab (/home) overview
│   │   ├── hooks/
│   │   │   ├── useBoundaryLayers.js      # Loads & renders 10+ GeoJSON vector/polygon boundaries
│   │   │   └── useFloodHotspots.js       # Live flood hotspot query & cache
│   │   ├── utils/
│   │   │   ├── api.js                    # Axios instance with auto Authorization Bearer header
│   │   │   ├── geoUtils.js               # Point-in-polygon ray casting & coordinate conversions
│   │   │   ├── fundingPdf.js             # Client-side 3D isometric cutaways & PDF generation
│   │   │   └── projectHelpers.js         # Color markers, field formatters, currency logic
│   │   ├── data/                         # Bundled GeoJSON & fallback JSON datasets
│   │   ├── App.jsx                       # Root React router
│   │   └── main.jsx                      # DOM mount point
│   ├── vite.config.js
│   └── package.json
│
├── devops/                               # AWS deployment configurations (systemd, Nginx, hooks)
└── docs/                                 # Technical architecture & manuals
```

---

## 2. System User Roles & Flow Matrix

There are **9 Roles** defined in `backend/src/models/User.js`:

```
['Admin', 'WELL Labs1', 'WELL Labs2', 'Consultant', 'NGO', 'GBA', 'Donor', 'Funder', 'Citizen']
```

*(Note: `Donor` is automatically normalized to `Funder` in `AuthContext.jsx` and backend routes).*

### Role-by-Role Screen & Navigation Flow

```
                      ┌──────────────────────┐
                      │ User Logs In / Token │
                      └──────────┬───────────┘
                                 │
     ┌───────────────────────────┼───────────────────────────┐
     ▼                           ▼                           ▼
[ GBA / NGO / Citizen ]     [ Consultant ]         [ Funder / WELL Labs / Admin ]
     │                           │                           │
     ▼                           ▼                           ▼
Shows RoleScreen:           Dashboard Map:              Dashboard Map:
- Govt Screen (GBA)         - Groundwater HIDDEN        - All Layers Enabled
- NGO Screen (NGO)          - Header Actions:           - Header Action:
- Citizen Screen (Citizen)    * Upload Site (Coming)      * "Fund a Project"
  (Restricted view)           * Design Calculator         * Full workspace
                              * BGG Guidelines          Project Workspace:
                            Project Workspace:          - Overview, Assets, Impact
                            - Overview, Assets, Impact  - "Proceed to Funding ->"
                            - "See Cost ->"               * Custom CSR budget entry
                              * Detailed CostTable        * Portfolio allocation
                            - "Match with Funders"        * Funding PDF download
                                                        Admin Portal (Admin only):
                                                        - User Management & RBAC
                                                        - Audit Log & Failed Logins
                                                        - Layer Data Ingestion
```

| User Role | Map / UI Capabilities | Project Workspace Flow | Administrative Privileges |
| :--- | :--- | :--- | :--- |
| **Admin** | Full access to all map layers, boundaries, and groundwater telemetry. | Full access to Overview, Assets, Impact, and Funding tabs. | **Full Admin Portal**: Invite users, change roles, force logout (`tokenVersion++`), suspend/activate accounts, view audit trails, upload data layers. |
| **WELL Labs** (`WELL Labs1`, `WELL Labs2`) | Full access to all map layers (Groundwater, Projects, Flood Risk, Wards, Corporations, Valleys). | Full access to Overview, Assets, Impact, and Funding tabs. | Can inspect ingestion logs and raw watershed data; no user management. |
| **Funder** (or **Donor**) | Full access to map layers and the prominent **"Fund a Project"** header action. | 1. Overview $\rightarrow$ 2. Assets & Timelines $\rightarrow$ 3. Impact $\rightarrow$ 4. **Funding Tab**: Enters custom CSR budget $\rightarrow$ auto-allocates to project assets $\rightarrow$ downloads signed **Funding Commitment PDF**. | None. |
| **Consultant** | Map access with **Groundwater layer HIDDEN** (`showGroundwaterSection = false`). Top bar displays: **Upload Site**, **Design Calculator**, **BGG Guidelines**. | 1. Overview $\rightarrow$ 2. Assets & Timelines $\rightarrow$ 3. Impact $\rightarrow$ 4. **See Cost Tab** (renders `<CostTable />` with BOQ line items) $\rightarrow$ 5. **Match with Funders Tab**. | None. |
| **GBA** (Govt) | Renders dedicated **Govt Screen** (`<RoleScreen title="Govt Screen" />`). | Restricted from direct funder allocation tools. | None. |
| **NGO** | Renders dedicated **NGO Screen** (`<RoleScreen title="NGO Screen" />`). | Focused on site implementation and fieldwork coordination. | None. |
| **Citizen** | Renders dedicated **Citizen Screen** (`<RoleScreen title="Citizen Screen" />`). Default fallback role for self-registered users. | Public exploration and educational case study views. | None. |

---

## 3. Map Layer Architecture & Click Interaction Flows

The map runs inside [`DataLayersView.jsx`](file:///Users/mansoor/Desktop/climate%20solutions/bangalore%20mern%20application/frontend/src/components/DataLayersView.jsx) using Leaflet 1.9.4 and [`useBoundaryLayers.js`](file:///Users/mansoor/Desktop/climate%20solutions/bangalore%20mern%20application/frontend/src/hooks/useBoundaryLayers.js).

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              MAP INTERACTION FLOWCHART                                  │
├───────────────────────┬───────────────────────────┬────────────────────────────────────┤
│ Map Layer Clicked     │ State Mutation            │ Visible Result on Screen           │
├───────────────────────┼───────────────────────────┼────────────────────────────────────┤
│ BGG Project Marker    │ setSelectedItem({         │ Right slide-out ItemDetailsPane    │
│ (Green/Blue/Grey pin) │   type: 'project',        │ appears. Clicking "Open Full       │
│                       │   data: project           │ Workspace" navigates to:           │
│                       │ })                        │ /newprojects?id=<site_id>          │
├───────────────────────┼───────────────────────────┼────────────────────────────────────┤
│ Groundwater Well Pin  │ setSelectedItem({         │ ItemDetailsPane opens with water   │
│ (Blue circular pin)   │   type: 'well',           │ telemetry: depth, water table level│
│                       │   data: well              │ pH, TDS, EC, Fluoride/Arsenic.     │
├───────────────────────┼───────────────────────────┼────────────────────────────────────┤
│ Flood Hotspot Marker  │ setSelectedItem({         │ ItemDetailsPane opens with flood   │
│ (Red/Amber warning)   │   type: 'hotspot',        │ depth/history + button:            │
│                       │   data: hotspot           │ "Open in Design Calculator"        │
│                       │ })                        │ -> /design-calculator?lat=&lng=    │
├───────────────────────┼───────────────────────────┼────────────────────────────────────┤
│ Delineated Catchment  │ setSelectedCatchment(c)   │ Bottom/side CatchmentProjectsPanel │
│ Polygon               │                           │ opens: shows catchment area, valley│
│                       │                           │ connection, and all BGG sites in it│
├───────────────────────┼───────────────────────────┼────────────────────────────────────┤
│ GBA Corporation       │ setSelectedCorpRegions()  │ Map zooms to boundary (fitBounds); │
│ Polygon               │                           │ sidebar counters filter by corp.   │
├───────────────────────┼───────────────────────────┼────────────────────────────────────┤
│ GBA Ward Polygon      │ setActiveWardFilter(ward) │ Ward border highlights; map filters│
│                       │                           │ projects located inside that ward. │
├───────────────────────┼───────────────────────────┼────────────────────────────────────┤
│ "Fund a Project"      │ setIsFundModalOpen(true)  │ Opens 3-step modal wizard:         │
│ Header Button         │                           │ 1. Area -> 2. Typology -> 3. Flood │
│                       │                           │ -> Filters map to matching sites   │
└───────────────────────┴───────────────────────────┴────────────────────────────────────┘
```

### Detailed Step-by-Step for Key Click Flows

#### Flow A: Project Marker $\rightarrow$ Full Workspace $\rightarrow$ Funding PDF
1. **User clicks a Project marker** on the map.
2. `DataLayersView.jsx` sets `selectedItem = { type: 'project', data: proj }`.
3. **`ItemDetailsPane.jsx`** slides out from the right:
   - Displays project title, ward, implementing agency, estimated cost, and photos.
   - Shows blue button: **"Open Full Project Workspace"**.
4. User clicks **"Open Full Project Workspace"**:
   - URL updates to `/newprojects?id=<site_id>`.
   - **`NewProjectsView.jsx`** renders with 4 tabs:
     - **Tab 1: Overview**: Photos, baseline problem, implementing partner.
     - **Tab 2: Assets & Timelines**: Granular breakdown of individual assets (bioswales, rain gardens, recharge wells) with physical dimensions ($L \times W \times D$) and timelines.
     - **Tab 3: Impact**: Captured runoff volume ($m^3$), infiltration to aquifer, peak flow attenuation %.
     - **Tab 4: Funding**:
       - Funder enters a custom amount (e.g. `₹50 Lakh`).
       - Capital auto-allocates across unfunded assets.
       - User clicks **"Download Funding Commitment PDF"**.
       - `frontend/src/utils/fundingPdf.js` compiles client-side jsPDF document with embedded 3D isometric cutaways and ₹ rupee formatting.

#### Flow B: Flood Hotspot $\rightarrow$ Hydrological Sizing
1. **User clicks a Flood Hotspot pin** (Red/Amber exclamation icon).
2. `ItemDetailsPane.jsx` opens, displaying historical waterlogging depth (e.g. `> 0.5m for 2 hours`).
3. User clicks **"Open in Design Calculator"**.
4. App navigates to `/design-calculator?lat=12.93&lng=77.61`.
5. **`DesignCalculator.jsx`**:
   - Pre-selects the 2 km subcatchment polygon containing those coordinates.
   - User picks a storm return period (e.g., `5 Year Rain Event - 129.78 mm`).
   - Dispatches `GET /api/design-calculator/runoff?fid=...&event=5yr`.
   - Backend calculates runoff volume using the Rational Method and renders the required storage volume in $m^3$.

#### Flow C: "Fund a Project" Questionnaire Wizard
1. User clicks **"Fund a Project"** in the top header.
2. **`FundAProjectModal.jsx`** opens:
   - **Step 1 (Area)**: Select Corporation (North, South, East, West, Central) or specific Ward.
   - **Step 2 (Typology)**: Checkboxes for Park, Lake, Road / Stormdrain.
   - **Step 3 (Flooding Priority)**: Toggle "Solve Flooding First" (`yes` / `no`).
3. User clicks **"Apply Filters"**:
   - Map updates immediately: non-matching project markers are hidden.
   - Layer sidebar shows count of matching shovel-ready sites.

---

## 4. Backend Architecture & Route Dispatcher

The backend runs on **Node.js 20** and **Express 5.2.1** (`backend/src/app.js`):

```
HTTP Request
     │
     ▼
cors(corsOptions) ───────────────> Matches whitelisted domains (climatesolutions.ai, localhost)
     │
     ▼
express.json({ limit: '10mb' }) ─> High limit for GeoJSON / CSV layer imports
     │
     ▼
cookieParser()
     │
     ▼
app.set('trust proxy', 1) ───────> Preserves real client IP from Nginx for rate limiters
     │
     ├── /api/auth               ─> modules/auth/auth.routes.js
     ├── /api/admin              ─> modules/admin/admin.routes.js (Protected + Admin only)
     ├── /api/sites              ─> modules/sites/sites.routes.js
     ├── /api/design-calculator  ─> modules/designCalculator/designCalculator.routes.js
     ├── /api/analytics          ─> modules/analytics/analytics.routes.js
     └── /api/flood-hotspots     ─> modules/admin/admin.controller.js (getFloodHotspots)
```

### Route & Controller Reference

```
/api/auth
  POST   /register             -> auth.controller.register
  POST   /login                -> auth.controller.login
  POST   /admin/login          -> (Rate limited: 5 / 15m) auth.controller.adminLogin
  POST   /admin/forgot-password-> (Rate limited: 3 / 15m) auth.controller.forgotAdminPassword
  GET    /password-token/:token-> (Rate limited: 20 / 15m) auth.controller.getPasswordTokenInfo
  POST   /set-password         -> auth.controller.setPasswordWithToken
  POST   /google               -> auth.controller.googleAuth
  POST   /complete-profile     -> auth.controller.completeProfile
  GET    /me                   -> [protect] auth.controller.getMe
  POST   /logout               -> auth.controller.logout
  GET    /users                -> [protect, admin] auth.controller.getAllUsers
  PUT    /users/:id/role       -> [protect, admin] auth.controller.updateUserRole
  PUT    /users/:id            -> [protect, admin] auth.controller.updateUser
  DELETE /users/:id            -> [protect, admin] auth.controller.deleteUser

/api/admin (All routes require [protect, admin])
  POST   /users/invite         -> admin.controller.inviteUser
  POST   /users/:id/suspend    -> admin.controller.suspendUser
  POST   /users/:id/activate   -> admin.controller.activateUser
  POST   /users/:id/reset-link -> admin.controller.createResetLink
  POST   /users/:id/force-logout-> admin.controller.forceLogout (increments tokenVersion)
  GET    /audit                -> admin.controller.getAuditLogs
  GET    /failed-logins        -> admin.controller.getFailedLogins
  GET    /layers               -> admin.controller.listLayers
  POST   /layers/:layer/import -> admin.controller.importLayer

/api/sites
  GET    /                     -> sites.controller.getAllSites (returns SiteProjects + interventions)
  GET    /:site_id             -> sites.controller.getSiteById

/api/design-calculator
  GET    /runoff               -> designCalculator.controller.getRunoff (?fid=&event=)

/api/analytics
  GET    /overview             -> analytics.controller.getOverviewSummary
  GET    /corporation          -> analytics.controller.getCorporationSummary
  GET    /ward                 -> analytics.controller.getWardSummary
  GET    /projects             -> analytics.controller.getProjectsList
  GET    /wells                -> analytics.controller.getWellsList
```

---

## 5. Database Schemas: Exactly How Many & What They Cover

There are **8 Mongoose Schemas** in `backend/src/models/`:

```
┌────────────────────────────────────────────────────────────────────────┐
│                        8 MONGOOSE SCHEMAS                              │
├─────┬──────────────────┬─────────────────┬─────────────────────────────┤
│ #   │ Schema / Model   │ Primary Key     │ Core Purpose                │
├─────┼──────────────────┼─────────────────┼─────────────────────────────┤
│ 1   │ SiteProject      │ site_id (String)│ BGG Site (Lake, Park, Drain)│
│ 2   │ Intervention     │ intervention_id │ Sized Engineering Component │
│ 3   │ Well             │ _id (ObjectId)  │ Groundwater & Water Quality │
│ 4   │ Project          │ _id (ObjectId)  │ Legacy Municipal Projects   │
│ 5   │ FloodHotspot     │ hotspotId       │ Inundation Hotspot Points   │
│ 6   │ User             │ _id / email     │ Authentication & RBAC       │
│ 7   │ AuditLog         │ _id (ObjectId)  │ Admin Audit Trail           │
│ 8   │ FailedLogin      │ _id (ObjectId)  │ 90-day Threat Telemetry     │
└─────┴──────────────────┴─────────────────┴─────────────────────────────┘
```

### Complete Schema Field Breakdown

#### 1. `SiteProject` (`backend/src/models/SiteProject.js`)
*Represents a physical project boundary location.*
- **Identity & Type**: `site_id` (String, unique, indexed), `type` (Enum: `lake`, `park`, `stormdrain`, `campus`), `name` (String).
- **Geography**: `ward`, `bbmp_zone`, `watershed`, `latitude`, `longitude`, `location` (`{ type: "Point", coordinates: [lng, lat] }` with **`2dsphere`** index).
- **Execution**: `implementing_agency`, `implementation_partners`, `project_start_year`, `project_end_year`, `current_stage`, `total_cost`, `pre_intervention_issues`, `context`.
- **Linkages**: `linked_intervention_ids` (`[String]` array of IDs referencing `Intervention` collection).
- **Impact**: `site_level_impact`, `subcatchment_level_impact`.
- **Lake-Specific**: `water_spread_area`, `total_site_area`, `primary_function`, `hfl`, `mwl`, `inlet_level`, `outlet_level`, `no_of_inlets`, `no_of_outlets`, `social_amenities`.
- **Park-Specific**: `area`, `amenities_before_intervention`.
- **Drain-Specific**: `start_latitude`, `start_longitude`, `end_latitude`, `end_longitude`, `length`, `average_width`, `average_depth`, `designed_capacity`, `catchment_area_served`, `intervention_zone`.
- **Media**: `image_url`, `images` (`[String]`).

#### 2. `Intervention` (`backend/src/models/Intervention.js`)
*Represents a specific nature-based engineering structure within a site.*
- **Identity**: `intervention_id` (String, unique, indexed), `type` (Enum: `bioswale`, `raingarden`, `percolation`, `ecobloc`, `infiltration_trench`, `detention_basin`, `constructed_wetland`, `rainwater_harvesting`).
- **Foreign Linkage**: `site_id` (String, indexed), `site_name`.
- **Location**: `latitude`, `longitude`, `location` (`{ type: "Point", coordinates: [lng, lat] }` with **`2dsphere`** index).
- **Quantities & Dimensions**: `quantity`, `length`, `width`, `depth`, `diameter`, `area`, `storage_volume`, `surface_area`.
- **Hydrological Performance**:
  - Bioswale: `catchment_area_served_ha`, `baseline_peak_flow`, `post_intervention_peak_flow`, `plant_species_used`.
  - Rain Garden: `ponding_depth`, `filter_media_depth`, `catchment_area_served_sqm`, `baseline_runoff`, `runoff_captured`.
  - Infiltration Trench: `infiltration_rate`, `recharge_volume_kl_yr`.
  - Detention Basin: `peak_flow_attenuation`.
  - Constructed Wetland: `retention_time`, `water_treated`, `bod_reduction`, `cod_reduction`.
  - RWH: `number_of_structures`, `catchment_roof_area`, `storage_capacity`, `water_harvested`.
- **Extended Fields**: `details` (Schema.Types.Mixed schemaless object).

#### 3. `Well` (`backend/src/models/Well.js`)
*Monitors shallow aquifer depth and water quality parameters.*
- **Identity & Structure**: `wellName`, `wellType` (Open Dug Well / Borewell), `ownerName`, `yearDug`, `lining`, `diameterFt`, `depthFt`, `waterLevelFt`.
- **Hydrochemistry**: `ph` (Number), `tds` (Total Dissolved Solids, Number), `ec` (Electrical Conductivity, Number), `salinity` (Number), `hasFluoride` (String), `hasArsenic` (String).
- **Administrative Location**: `wardName`, `wardId`, `corporation`, `corporationId`, `assembly`, `acNo`, `latitude`, `longitude`, `location` (`{ type: "Point", coordinates: [lng, lat] }` with **`2dsphere`** index).

#### 4. `Project` (`backend/src/models/Project.js`)
*Stores municipal government works, civil stormwater interventions, and historical tenders.*
- **Fields**: `projNo`, `projName`, `budget`, `timeline`, `status`, `projLead`, `stakeholders`, `tags`, `areaCatchment`, `drainLength`, `mediaLink`, `wardName`, `corporation`, `assembly`, `latitude`, `longitude`, `location` (`2dsphere`).

#### 5. `FloodHotspot` (`backend/src/models/FloodHotspot.js`)
*Stores chronic waterlogging points across Bengaluru roads and intersections.*
- **Fields**: `hotspotId` (String, unique), `location` (String landmark), `zone`, `vulnerabilityLevel` (`High`, `Medium`, `Low`), `vulnerabilityMeasure` (recorded water depth/duration), `remarks`, `latitude`, `longitude`, `geo` (`{ type: "Point", coordinates: [lng, lat] }`).

#### 6. `User` (`backend/src/models/User.js`)
*Handles credentials, personas, and session invalidation.*
- **Core Identity**: `name`, `email` (unique, lowercase), `password` (bcrypt hash), `phone`, `organization`, `address`.
- **Role & Persona**: `role` (`Admin`, `WELL Labs1`, `WELL Labs2`, `Consultant`, `NGO`, `GBA`, `Donor`, `Funder`, `Citizen`), `persona` (`govt`, `funder`, `designer`, `citizen`, `admin`), `userType` (CSR Fund, Foundation, Municipal Agency, etc.).
- **Security & Session Control**:
  - `status`: `active`, `suspended`, `invited`.
  - `tokenVersion`: Number (incremented on forced logout or password change).
  - `passwordTokenHash`, `passwordTokenPurpose` (`reset`, `invite`, `admin-setup`), `passwordTokenExpires`.
  - `authProvider`: `local`, `google`.
  - `googleId`, `avatar`.

#### 7. `AuditLog` (`backend/src/models/AuditLog.js`)
*Immutable security ledger recording every administrative modification.*
- **Fields**: `admin` (ObjectId ref User), `adminEmail`, `action` (e.g. `USER_ROLE_UPDATE`, `USER_SUSPEND`), `targetType` (`user`, `layer`), `targetId`, `targetLabel`, `changes` (Mixed object with before/after state), `ip` (client IP).
- **Index**: `{ createdAt: -1 }`.

#### 8. `FailedLogin` (`backend/src/models/FailedLogin.js`)
*Tracks malicious or failed login attempts to trigger IP rate-limiting.*
- **Fields**: `email`, `ip`, `userAgent`, `reason`, `route` (`admin` or `user`).
- **TTL Index**: `{ createdAt: 1 }, { expireAfterSeconds: 7776000 }` (automatically purges records after 90 days).

---

## 6. Calculation Logic: Rational Method Runoff Engine

Implemented in `backend/src/modules/designCalculator/designCalculator.controller.js`:

$$\text{Runoff Volume } (m^3) = \frac{C \times A \times P}{1000}$$

```javascript
function runoffVolume(coefficient, areaM2, rainfallMm) {
  return Math.round((coefficient * areaM2 * rainfallMm) / 1000 * 100) / 100;
}
```

- **`coefficient` ($C$)**: Stored per 2 km subcatchment polygon (`fid`) in `backend/src/data/designCalculator.json` (ranges from 0.30 for vegetated areas to 0.85 for heavily concretized urban wards).
- **`areaM2` ($A$)**: Surface area of the subcatchment in square meters.
- **`rainfallMm` ($P$)**: Rain event precipitation depth:
  - `1in`: 25.4 mm (Water Quality Capture)
  - `90th`: 40.0 mm (Standard NBS storm)
  - `5yr`: 129.78 mm (5-year recurrence event)
  - `10yr`: 148.49 mm (10-year recurrence event)

---

## 7. Client-Side PDF Engine: 3D Vector Cutaways

In `frontend/src/utils/fundingPdf.js`:
- Does **not** use raster images or screenshots.
- Calculates **3D isometric vector polygons** using jsPDF:
  - $x_{\text{iso}} = x_0 + (x - y) \cos(30^\circ)$
  - $y_{\text{iso}} = y_0 + (x + y) \sin(30^\circ) - z$
- Renders cutaway views for:
  1. **Rain Garden**: Infiltration floor, filter media bed, ponding reservoir, side embankments.
  2. **Bioswale**: Trapezoidal ditch cross-section, rock check-dam barriers, inflow direction.
  3. **Infiltration Trench**: Stone aggregate fill and geotextile fabric side lining.
  4. **Percolation Well**: Concentric concrete rings with external gravel packing.
  5. **Detention Basin**: Tiered earth embankments showing flood storage water elevations.
- **Rupee Localization**: Automatically formats `₹30 Lakh` ($30,00,000$) or `₹2.5 Crore` ($2,50,00,000$) and embeds `Poppins-Regular.ttf` to ensure the `₹` glyph prints without error.

---

## 8. Summary of State & Configuration Files

| Config / Key File | Purpose |
| :--- | :--- |
| `frontend/.env` | `VITE_API_URL` (REST backend URL), `VITE_ADMIN_PATH` (obfuscated admin URL, e.g. `/welllabs-admin-portal`). |
| `backend/.env` | `PORT`, `MONGO_URI`, `JWT_SECRET`, `ADMIN_EMAIL`, `CORS_ORIGIN`, `GOOGLE_SHEET_ID`. |
| `frontend/src/utils/constants.js` | Site typology options, intervention types, watershed boundaries, fallback coordinates. |
| `frontend/src/utils/geoUtils.js` | Ray-casting point-in-polygon (`pointInPolygon`), corporation coordinate matchers. |
| `devops/scripts/application_start.sh` | AWS zero-downtime blue/green port-swap (Backend: 5001 $\rightarrow$ 5000, Frontend: 3001 $\rightarrow$ 3000). |

