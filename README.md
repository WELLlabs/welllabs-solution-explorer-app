# 🌊 Bangalore MERN Application - Climate Solutions Explorer

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-v8-646CFF.svg?style=flat-square&logo=vite)](https://vite.dev/)
[![Tailwind Version](https://img.shields.io/badge/Tailwind_CSS-v4-38BDF8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Leaflet Version](https://img.shields.io/badge/Leaflet-v1.9-199900.svg?style=flat-square&logo=leaflet)](https://leafletjs.com/)
[![Mongoose Version](https://img.shields.io/badge/Mongoose-v9-red.svg?style=flat-square&logo=mongodb)](https://mongoosejs.com/)
[![Express Version](https://img.shields.io/badge/Express-v5-000000.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg?style=flat-square)](https://opensource.org/licenses/ISC)

The **Climate Solutions Explorer** is a MERN (MongoDB, Express, React, Node.js) web application for mapping flood risk, groundwater and Blue-Green-Grey (BGG) infrastructure projects across Bengaluru. Funders can pick projects and download a funding commitment, consultants can size interventions with the design calculator, and administrators manage users and map data from a hidden admin portal.

---

## 📚 Documentation Suite

> 🛠️ **[Developer System Architecture & Interaction Flow Manual](docs/DEVELOPER_SYSTEM_FLOW.md)**: The developer's direct reference manual. Covers codebase directory structure, all 9 user roles & UI screens, click-flows for every map layer, backend modules & routes, and complete breakdowns of all 8 database schemas.
>
> 🌟 **[Master Application Operations & Architecture Manual (Comprehensive)](docs/MASTER_APPLICATION_MANUAL.md)**: The definitive, complete technical manual covering municipal hydrology, full system architecture, schema definitions, Express API references, Leaflet GIS pipelines, hydrological Rational Method calculations, procedural jsPDF 3D cutaway engines, and AWS zero-downtime blue/green deployment.

1. 🏛️ **[Architecture of the Solution (Tech Stack)](docs/ARCHITECTURE.md)**: System design, high-level architecture diagram, React, Node.js, Express 5 and the MongoDB `2dsphere` engine.
2. 🗄️ **[Schema of the Solution (Database Schema, Workflow, Dataflow)](docs/SCHEMA_WORKFLOW_DATAFLOW.md)**: Database schemas, entity linkage ERD, Google Sheets ETL workflow, API dataflow and GIS user interaction flows.
3. 🌐 **[Git Repo of the Solution](docs/GIT_REPOSITORY.md)**: Repository details, branch strategy (`main`/`dev`), local setup, environment secrets and contribution guidelines.
4. 🎯 **[Use-Case Mapping Document](docs/USE_CASE_MAPPING.md)**: Persona mapping (Admin, WELL Labs, GBA, Consultant, Funder), role assignment and core platform capabilities.

---

## 🗺️ Features

### Map explorer (`/dashboard`)
*   Leaflet map with toggleable layers: assembly constituencies, GBA wards and corporations, valleys, green spaces, flood hazard, flooding hotspots, existing interventions, groundwater wells and city-wide BGG project sites.
*   Browse by corporation or flood hotspot, search boundaries and places, and open delineated catchments with watershed notes.
*   **Fund a project** questionnaire that filters BGG sites by the funder's preferences.

### City-wide BGG projects workspace
*   Each site opens a workspace with **Overview**, **Assets and Timelines**, **Impact** and **Funding** tabs. Several sites can be selected and compared together.
*   Funders choose whole assets or enter a custom CSR amount, which is allocated across the selected projects.
*   **Funding commitment PDF** (`frontend/src/utils/fundingPdf.js`, built with jsPDF):
    *   One row per detail (quantity, duration, amount, length, width, depth, area), with amounts written as ₹30 Lakh / ₹2.5 Crore.
    *   Scaled 3D cutaway drawings for **rain gardens, bioswales, infiltration trenches, detention / retention basins and percolation wells**, labelled with the recorded dimensions.
    *   Uses the Poppins font from `frontend/public/fonts/` (so the ₹ sign prints) and falls back to Helvetica if it cannot load. Emoji in site labels are removed so they do not print as garbled text.

### Design calculator (`/designcalculator`)
*   Pick a 2 km sub-catchment and a rain event to get the estimated runoff volume from the backend lookup table.
*   Can be opened from a flood hotspot with `?lat=&lng=`, which preselects the sub-catchment containing that point.

### Role-based screens
*   **Consultant**: the groundwater section is hidden; the map header shows **Upload your site** (coming soon), **Design calculator** and **BGG guidelines**; project workspaces show **See Cost** and **Match with Funders** instead of the funding flow.
*   **Funder** and **WELL Labs**: full map and funding flow.
*   **GBA (Govt)**, **NGO** and **Citizen**: their own role screen (in progress).

### Admin portal (hidden URL set by `VITE_ADMIN_PATH`)
*   **User management**: invite users, suspend / reactivate, create password reset or invite links, force logout, edit roles and delete accounts.
*   **Audit trail** of every admin action and a **failed sign-ins** report.
*   **Forgot password** on the admin sign-in page; the reset link is emailed to the WELL Labs mailbox.
*   **Data Import** into map layers (see [Admin Data Import](#-admin-data-import)).

---

## 🆕 Recent Changes

*   Removed the **Pending** approval step. New users get the role that matches the persona they picked (Funder, Consultant, NGO, GBA or Citizen) and can sign in straight away. On startup, `backend/src/utils/migratePendingUsers.js` reassigns any user still holding the old `Pending` role, and NGO users previously stored as Consultant.
*   Added the **NGO** role, the Consultant toolset, the BGG guidelines page, the "Upload your site" placeholder and role screens for Govt, NGO and Citizen.
*   Design calculator can start from a flood hotspot location and is available inside the dashboard.
*   Rebuilt the **funding commitment PDF** with jsPDF: new layout, Poppins font, rupee amounts in words, and drawings for five intervention types.
*   **Email from the backend** (`backend/src/utils/mailer.js`, nodemailer over SMTP) replaces FormSubmit: admin forgot password, admin invite / reset links (also shown for copying) and consultant "Show interest" (`POST /api/contact/consultant-interest`, signed-in users only, with a confirmation popup listing what will be sent).
*   **Real Google sign-in**: the official Google button, ID token verified on the backend with `google-auth-library`. First-time Google users fill in the remaining profile fields; returning users go straight to the map.
*   **Funding tracking**: the admin uploads funding commitments (Data Import → Funding commitments; "Download intervention list" gives the IDs). Project pages show funded amounts, fully funded assets are locked with a "Funded by" note, partly funded assets offer only the remaining amount, and the header shows "Funded so far" and "Fully funded".
*   **Back buttons** line up with the page content at every screen width.
*   **Data Import fixes**: BGG interventions without coordinates no longer fail with "Can't extract geo keys" (`location` is left unset instead of an empty Point), and rows the database rejects are listed as skipped with the reason instead of failing the whole import.

---

## 🛠️ Technology Stack

### Frontend (`frontend/`)
*   **React 19** with React Router 7
*   **Vite 8** dev server and build
*   **Tailwind CSS 4** plus custom CSS in `src/styles/index.css`
*   **Leaflet** for maps and GeoJSON layers
*   **Axios** for API calls
*   **jsPDF** for the funding commitment PDF

### Backend (`backend/`)
*   **Node.js** with **Express 5**
*   **MongoDB Atlas** through **Mongoose 9**, with `2dsphere` indexes on all point data
*   **JWT** sessions (cookie or `Authorization: Bearer`) and `bcryptjs` password hashing
*   `express-rate-limit` on admin sign-in, admin password reset and password link endpoints
*   `googleapis` and AWS Secrets Manager for the Google Sheets import

---

## 📂 Repository Structure

```text
bangalore-mern-application/
├── appspec.yml                  # AWS CodeDeploy lifecycle hooks
├── devops/                      # buildspec.yml, nginx config, systemd units, deploy scripts
├── docs/                        # Documentation suite
├── backend/
│   ├── server.js                # Entry point (loads src/server.js)
│   ├── data/                    # Legacy projects / wells JSON seed files
│   ├── scripts/
│   │   ├── importFromGoogleSheets.js   # Google Sheet → BGG sites and interventions
│   │   └── importData.js               # Legacy seeding of projects and wells
│   └── src/
│       ├── app.js               # Express app and route mounting
│       ├── server.js            # DB connection, startup migration, HTTP server
│       ├── config/              # db.js, cors.js
│       ├── data/                # designCalculator.json (runoff lookup)
│       ├── middleware/          # protect / admin guards
│       ├── models/              # User, Project, Well, SiteProject, Intervention,
│       │                        # FloodHotspot, AuditLog, FailedLogin
│       ├── modules/
│       │   ├── auth/            # Sign-up, sign-in, Google, admin login, password links, users
│       │   ├── admin/           # User actions, audit, failed logins, layer import (layers.js)
│       │   ├── analytics/       # Overview, corporation, ward, projects, wells
│       │   ├── sites/           # BGG sites with their interventions
│       │   └── designCalculator/ # Runoff lookup
│       └── utils/               # audit.js, migratePendingUsers.js
│
└── frontend/
    ├── public/
    │   ├── fonts/               # Poppins Regular / SemiBold for the PDF
    │   └── images/
    └── src/
        ├── App.jsx              # Routes
        ├── components/          # DataLayersView, NewProjectsView, Admin*, BggGuidelines, ...
        ├── context/             # AuthContext
        ├── data/                # Boundary GeoJSON, sub-catchments, fallback sites
        ├── hooks/               # useBoundaryLayers, useFloodHotspots
        ├── pages/               # Dashboard, Login, Register, AdminLogin, SetPassword, DesignCalculator
        ├── styles/              # index.css
        └── utils/               # api.js, geoUtils.js, fundingPdf.js, adminHelpers.js, constants.js
```

---

## 🔑 Environment Configuration

### Backend: `backend/.env`

```bash
PORT=5001
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=a_long_random_secret

# This email always gets the Admin role
ADMIN_EMAIL=admin@example.org

# Base URL for admin reset links when the request origin is not an allowed CORS origin
# (optional, defaults to https://beta.climatesolutions.ai)
FRONTEND_URL=http://localhost:5173

# Email (SMTP), used for admin reset links, invites and "Show interest"
SMTP_HOST=smtp-relay.brevo.com   # Brevo; see docs/EMAIL_SETUP.md
SMTP_PORT=587
SMTP_USER=your_smtp_username
SMTP_PASS=your_smtp_password
MAIL_FROM="Climate Solutions <no-reply@climatesolutions.ai>"
# CONSULTANT_EMAIL_WELLLABS=team@example.org   # override a consultant inbox (see src/config/consultants.js)

# Google sign-in: optional override. The public client ID is already set in src/config/google.js
# GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com

# Google Sheets import
GOOGLE_SHEET_ID=your_sheet_id
GOOGLE_SHEET_TAB_ID=0
# GOOGLE_SERVICE_ACCOUNT_CREDENTIALS={...}   # only for private sheets

# Production only: load the values above from AWS Secrets Manager
# AWS_SECRET_NAME=your_secret_name
# AWS_REGION=ap-south-1
```

### Frontend: `frontend/.env` (optional)

```bash
VITE_API_URL=http://localhost:5001/api   # API base URL
VITE_ADMIN_PATH=/your-hidden-admin-path  # URL of the admin sign-in page
# VITE_GOOGLE_CLIENT_ID=...  # optional override; default is in src/components/GoogleSignInButton.jsx
```

> [!WARNING]
> Never commit `.env` files. The root `.gitignore` already excludes them.

---

## 🚀 Getting Started

### 1. Prerequisites
*   [Node.js](https://nodejs.org/) v18 or higher
*   A MongoDB Atlas cluster (or a local MongoDB)

### 2. Backend

```bash
cd backend
npm install
npm run dev          # nodemon, http://localhost:5001
```

Expected output:

```text
📡 Server running on http://localhost:5001
✅ MongoDB Connected
```

> `npm start` (used in production) first runs the Google Sheets import with `--write`, then starts the server.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

Other scripts: `npm run build`, `npm run preview`, `npm run lint`.

---

## 💾 Data Sources & Import

### Google Sheets → BGG sites and interventions

```bash
cd backend
node scripts/importFromGoogleSheets.js                 # dry run, writes scripts/review-log.json only
node scripts/importFromGoogleSheets.js --write         # upsert into MongoDB
node scripts/importFromGoogleSheets.js --write --drop  # clear sites and interventions first
```

Rows in the sheet overwrite records with the same `site_id` / `intervention_id` every time the server starts in production.

### 📥 Admin Data Import

Admin portal → **Data Import**. Three ways to add data, all validated before anything is saved:

1.  **Bulk upload**: CSV (first row is the column names) or GeoJSON (Point features; other geometry types are skipped and counted).
2.  **Paste JSON**: a single object, an array of objects or a GeoJSON FeatureCollection.
3.  **Add one record**: a form generated from the layer's fields.

| Layer | Collection | Matched on | Required fields |
| :--- | :--- | :--- | :--- |
| Existing Interventions | `projects` | `projNo` | `projName`, `latitude`, `longitude` |
| Ground water wells | `wells` | none (always added) | `wellName`, `latitude`, `longitude` |
| City wide BGG projects (sites) | `siteprojects` | `site_id` | `site_id`, `name`, `type`, `latitude`, `longitude` |
| City wide BGG interventions | `interventions` | `intervention_id` | `intervention_id`, `type` |
| Flooding hotspots | `floodhotspots` | `hotspotId` | `hotspotId`, `location`, `latitude`, `longitude` |
| Funding commitments | `fundings` | `commitment_id` | `commitment_id`, `intervention_id` (must exist), `funder_name`, `amount` (₹) |

*   Rows with a matching ID are updated; others are added. The wells layer has no ID, so uploading the same file twice creates duplicates.
*   Common column names are accepted (`lat`, `lng`, `lon`, `name`, `well_name`, `hotspot_id`, ...). Field definitions live in `backend/src/modules/admin/layers.js`.
*   Up to **5,000 rows** per upload (request limit 10 MB). Invalid rows are listed with the reason and skipped.
*   Every import is recorded in the audit trail.

### Legacy seeding (projects and wells)

```bash
cd backend
node scripts/importData.js   # reads backend/data/v1_projects_with_wards*.json and v1_wells_with_wards*.json
```

This replaces all existing projects and wells.

---

## 👥 Roles

| Role | Who | How it is assigned |
| :--- | :--- | :--- |
| **Admin** | Platform administrator | Email equals `ADMIN_EMAIL` |
| **WELL Labs1 / WELL Labs2** | WELL Labs team | Email ends with `@ifmr.ac.in` (WELL Labs1), or set by the admin |
| **Funder** | CSR funds, foundations, philanthropies | Persona `funder` or user type CSR Fund / Foundations / Philanthropy |
| **Consultant** | Consultants and designers | Persona `designer` |
| **NGO** | NGOs | Persona `designer` with user type `NGO` |
| **GBA** | Government officials | Persona `govt` |
| **Citizen** | Residents | Persona `citizen` (also the default) |

The admin can change any role from **User management**. Suspended users cannot sign in, and a force logout ends all of a user's sessions.

---

## 📡 API Reference

🔒 = requires a signed-in user, 🛡️ = Admin only.

### Authentication (`/api/auth`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/register` | Create an account |
| POST | `/login` | Sign in |
| POST | `/google` | Sign in with Google |
| POST | `/complete-profile` | Finish a Google sign-up profile |
| GET | `/me` 🔒 | Current user |
| POST | `/logout` | Sign out |
| POST | `/admin/login` | Admin sign-in (5 attempts per 15 min) |
| POST | `/admin/forgot-password` | Email an admin reset link (3 per 15 min) |
| GET | `/password-token/:token` | Check an invite / reset link |
| POST | `/set-password` | Set a password from an invite / reset link |
| GET | `/users` 🛡️ | List users |
| PUT | `/users/:id` 🛡️ | Edit a user |
| PUT | `/users/:id/role` 🛡️ | Change a user's role |
| DELETE | `/users/:id` 🛡️ | Delete a user |

### Admin (`/api/admin`, all 🛡️)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/users/invite` | Invite a user and get an invite link |
| POST | `/users/:id/suspend` | Suspend a user |
| POST | `/users/:id/activate` | Reactivate a user |
| POST | `/users/:id/reset-link` | Create a password reset or invite link |
| POST | `/users/:id/force-logout` | End all sessions of a user |
| GET | `/audit` | Audit trail (`targetType`, `action`, `q`, `limit`) |
| GET | `/failed-logins` | Failed sign-ins (`days`, `limit`) |
| GET | `/layers` | Importable layers with fields and record counts |
| POST | `/layers/:layer/import` | Import `{ records, dryRun, source }` |

### Contact (`/api/contact`)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/consultant-interest` 🔒 | Email a consultant `{ agencyId, project, message }` (20 per hour) |

### Map data (public)

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/api/sites` | BGG sites with their interventions |
| GET | `/api/sites/:site_id` | One BGG site with its interventions |
| GET | `/api/flood-hotspots` | Imported flooding hotspots |
| GET | `/api/analytics/overview` | Totals and breakdowns of projects and wells |
| GET | `/api/analytics/corporation` | Project and well counts per corporation |
| GET | `/api/analytics/ward` | Project and well metrics per ward |
| GET | `/api/analytics/projects` | All existing interventions |
| GET | `/api/analytics/wells` | All groundwater wells |
| GET | `/api/design-calculator/runoff?fid=&event=` | Runoff for a sub-catchment and rain event |
| GET | `/api/health` | Health check |

---

## ☁️ Deployment

Deployed to EC2 with **AWS CodeDeploy** (`appspec.yml`):

*   `devops/buildspec.yml`: build steps
*   `devops/scripts/`: `before_install`, `after_install` (npm ci, nginx and systemd setup), `application_start` (zero-downtime port swap) and `validate_service` (health checks)
*   `devops/nginx/welllabs.conf` and `devops/systemd/welllabs-*.service`

---

## 🧭 Roadmap

*   **Upload your own site**: upload a site boundary, run the design calculator for it and get proposed interventions.
*   **Area layers in Data Import**: upload zipped shapefiles, GeoJSON or KML for watershed boundaries, drains and flood zones, preview them on a map, then publish them as map layers without a code change.
*   Intervention sizing and design specifications in the design calculator.
*   Full Govt, NGO and Citizen screens.

---

## 🤝 Contribution & License

Distributed under the **ISC License**. To contribute:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---
*Developed with 💙 for the Bangalore Water & Sustainability Initiative.*
