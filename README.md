# 🌊 Bangalore MERN Application - Solution Explorer

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-green.svg?style=flat-square&logo=node.js)](https://nodejs.org/)
[![React Version](https://img.shields.io/badge/React-v19-blue.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite Version](https://img.shields.io/badge/Vite-v8-646CFF.svg?style=flat-square&logo=vite)](https://vite.dev/)
[![Mongoose Version](https://img.shields.io/badge/Mongoose-v9-red.svg?style=flat-square&logo=mongodb)](https://mongoosejs.com/)
[![Express Version](https://img.shields.io/badge/Express-v5-000000.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg?style=flat-square)](https://opensource.org/licenses/ISC)

Welcome to the **Bangalore Solution Explorer**, a comprehensive, premium MERN (MongoDB, Express, React, Node.js) web application designed for mapping, analyzing, and managing water resources, groundwater wells, and sustainability projects. The application incorporates a fully-featured interactive dashboard, advanced analytical tools, secure role-based authorization, and high-performance geospatial aggregation.

---

## 🗺️ Project Overview

The **Bangalore MERN Application** is built to bridge the gap between field surveyors, data analysts, organization leaders, and donors. It enables:
1. **Interactive Tracking**: Detailed profiles of **Sustainability Projects** (recharge structures, catchments) and **Groundwater Wells** (lining, diameter, water level, water quality parameters like pH, TDS, EC, salinity, etc.).
2. **Geospatial Mapping**: MongoDB `2dsphere` indexes allow fast queries based on geographical coordinates (Latitude & Longitude).
3. **Advanced Analytics**: Highly visual, responsive glassmorphism charts that aggregate metrics based on GBA regions/corporations and municipal wards.
4. **Secure Collaboration**: An advanced role authorization hierarchy allowing restricted data views and administrative controls.

---

## 🛠️ Technology Stack

The application utilizes a modern, optimized tech stack:

### Frontend (Client)
*   **Framework**: React (v19) with modern hooks and state management.
*   **Build Tool**: Vite (v8) for ultra-fast hot module replacement.
*   **Routing**: React Router DOM (v7) for secure client-side navigation.
*   **Styles**: Premium custom CSS incorporating responsive layouts, dark themes, and glassmorphism micro-animations.
*   **Networking**: Axios for secure and structured HTTP requests.

### Backend (Server)
*   **Runtime Environment**: Node.js
*   **Framework**: Express (v5) providing optimized middleware and routing pipelines.
*   **Database**: MongoDB Atlas using Mongoose (v9) schemas and advanced aggregation frameworks.
*   **Authentication**: JSON Web Tokens (JWT) and high-security passwords hashed using `bcryptjs`.
*   **Configuration**: Dotenv for highly secure environment management.

---

## 📂 Repository Directory Structure

```text
bangalore-mern-application/
├── backend/                  # Express and Node.js REST API
│   ├── config/               # Database and authentication configurations
│   ├── controllers/          # API Route Controllers (Auth, Analytics)
│   ├── data/                 # JSON Seeding/Data files (to be created for import)
│   ├── middleware/           # Route Protection & Admin Verification middleware
│   ├── models/               # Mongoose DB Schemas (User, Project, Well)
│   ├── routes/               # API endpoints declarations
│   ├── scripts/              # Database populating/migration scripts
│   ├── .env                  # Environment Variables (Local only, Git-ignored)
│   ├── package.json          # Node dependencies and scripts
│   └── server.js             # API Gateway & Entry Point
│
├── frontend/                 # React & Vite client
│   ├── public/               # Static assets & icons
│   ├── src/                  # Core frontend source files
│   │   ├── assets/           # Application images & resources
│   │   ├── context/          # React Context API (AuthContext)
│   │   ├── pages/            # Core Pages (Login, Register, Dashboard, Analytics)
│   │   ├── App.css           # Global application styles
│   │   ├── App.jsx           # Main routing & configuration entrypoint
│   │   ├── index.css         # Typography, colors, and root styles
│   │   └── main.jsx          # React app DOM render entrypoint
│   ├── eslint.config.js      # Linting configuration
│   ├── package.json          # Frontend packages & build scripts
│   └── vite.config.js        # Vite configurations
│
└── .gitignore                # Root-level git rules for excluding builds & env
```

---

## 🔑 Environment Configuration

To run the backend, you must configure a `.env` file inside the `backend` folder. This file contains secrets and configuration parameters.

### 📝 Creating `.env`
Create a file named `.env` in the `backend/` directory:

```bash
# Path: backend/.env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_signature_key_2026

# Administrator Auto-assignment Setup
ADMIN_EMAIL=admin@ifmr.ac.in

# Access Approval Keys (Optional)
CONSULTANT_SECRET=CONSULTANT2026
GBA_SECRET=GBA_SECURE_2026
DONOR_SECRET=DONOR_LOVE_2026
WELL_LABS_2_SECRET=WELL_LABS_2_SECURE
```

> [!WARNING]
> Never commit `.env` files to Git. The root `.gitignore` file is pre-configured to block these uploads to keep your production databases safe.

---

## 💾 Database Seeding & Data Import

The application includes an intelligent data parsing and importing script designed to process tabular spatial data in JSON format and insert them into MongoDB with properly formatted GeoJSON `Point` structures.

### Step 1: Prepare JSON Files
Create a folder named `data` inside the `backend` directory (`backend/data`). Place your JSON seed files inside it. The files must start with the following prefixes:
*   **Projects Data**: `v1_projects_with_wards*.json`
*   **Wells Data**: `v1_wells_with_wards*.json`

### Step 2: Run the Seeding Script
Open a terminal in the `backend` directory and run:

```bash
node scripts/importData.js
```

### 🧠 How It Works
*   The script reads coordinates (e.g., `12.95435900° N` or `77.59416100° E`), sanitizes, and parses them into raw floating-point numbers.
*   It generates a standard GeoJSON location object:
    ```json
    "location": {
      "type": "Point",
      "coordinates": [longitude, latitude]
    }
    ```
*   It clears previous entries using `.deleteMany({})` and inserts the formatted records securely.

---

## 🚀 Getting Started & Installation

Follow these steps to run the application on your local machine:

### 1. Prerequisite Installations
*   Ensure [Node.js](https://nodejs.org/) (v18 or higher) is installed.
*   Ensure [MongoDB Compass](https://www.mongodb.com/products/tools/compass) or a MongoDB Atlas cloud cluster is available.

---

### 2. Set Up the Backend Server
Open your terminal and navigate to the `backend` folder:

```bash
cd backend
```

Install the dependencies:
```bash
npm install
```

Configure your environment:
*   Create `backend/.env` and paste your MongoDB URI, JWT secret, and administrator settings as shown in the [Environment Configuration](#-environment-configuration) section.

Start the backend in **Development Mode** (with Nodemon automatic restarts):
```bash
npm run dev
```

The terminal should output:
```text
📡 Server running on http://localhost:5000
✅ MongoDB Connected
```

---

### 3. Set Up the Frontend Client
Open a new terminal window and navigate to the `frontend` folder:

```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the Vite development server:
```bash
npm run dev
```

Open your browser and navigate to **`http://localhost:5173`** (or the URL displayed in your terminal).

---

## 👥 Role-Based Authorization & Approval Flow

The application implements a secure, custom-tailored user role management framework.

### User Roles
1.  **Admin**: Complete system overview. Can inspect registered users and manually change or approve pending roles using the **Admin Console** tab in the dashboard.
2.  **WELL Labs1 & WELL Labs2**: Authorized organization stakeholders with standard permissions.
3.  **Consultant**: Technical specialists or surveyors.
4.  **GBA (Gram Panchayat / Local Body representatives)**: Regional analysts.
5.  **Donor**: External financial partners who monitor project statuses.
6.  **Pending**: Default state for new registrants. Restricted from viewing dashboard features until approved by an Admin.

### 🔐 Automatic Sign-Up Logic
When a user signs up on the `/register` screen:
*   If their email matches `ADMIN_EMAIL` (e.g., `admin@ifmr.ac.in`), they are instantly assigned the **Admin** role.
*   If their email ends with `@ifmr.ac.in` (e.g., `surveyor@ifmr.ac.in`), they are automatically approved and granted the **WELL Labs1** role.
*   All other users are set to the **Pending** role and must be approved by the Admin before accessing the platform.

---

## 📡 API Reference

Here is a summary of the backend REST endpoints that the frontend leverages:

### 🔑 Authentication (`/api/auth`)

| Method | Endpoint | Description | Headers |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/register` | Register a new user account. | None |
| **POST** | `/api/auth/login` | Login to receive a JWT and profile object. | None |
| **GET** | `/api/auth/users` | Get list of registered users. *(Admin Only)* | `Authorization: Bearer <token>` |
| **PUT** | `/api/auth/users/:id/role` | Update a user's role/approval. *(Admin Only)* | `Authorization: Bearer <token>` |

### 📊 Analytics & Reporting (`/api/analytics`)

| Method | Endpoint | Description | Headers |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/analytics/overview` | Fetch totals and status/type breakdowns of projects/wells. | `Authorization: Bearer <token>` |
| **GET** | `/api/analytics/corporation` | Get aggregated project and well counts per Corporation. | `Authorization: Bearer <token>` |
| **GET** | `/api/analytics/ward` | Get detailed project and well metrics grouped by Ward. | `Authorization: Bearer <token>` |

### 🩺 Utility

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| **GET** | `/` | Verify API connectivity. |
| **GET** | `/api/health` | Health Check endpoint returning current timestamp and connection status. |

---

## 🤝 Contribution & License

This project is currently distributed under the **ISC License**. Contributions are welcome:
1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---
*Developed with 💙 for the Bangalore Water & Sustainability Initiative.*
