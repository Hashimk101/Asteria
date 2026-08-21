# ASTERIA — 3D Solar System & Asteroid Impact Visualizer

[![Live App](https://img.shields.io/badge/Live%20Demo-Vercel-black?style=for-the-badge&logo=vercel)](https://asteria-mu.vercel.app/)
[![API Status](https://img.shields.io/badge/API%20Docs-FastAPI%20Swagger-009688?style=for-the-badge&logo=fastapi)](https://asteria.fastapicloud.dev/docs)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg?style=for-the-badge)](LICENSE)
[![React](https://img.shields.io/badge/Frontend-React%20%7C%20Three.js%20%7C%20Vite-61DAFB?style=for-the-badge&logo=react)](frontend/)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI%20%7C%20Supabase-009485?style=for-the-badge&logo=python)](backend/)

Asteria is an interactive, real-time 3D solar system visualizer, near-Earth asteroid (NEO) trajectory tracker, and impact physics analyzer. Powered by live data from NASA and JPL APIs (NeoWs, SBDB, Horizons, Sentry), Asteria enables tracking potentially hazardous asteroids, rendering planetary orbits, analyzing close-approach paths, and computing impact mechanics.

- **Live Web Application**: [https://asteria-mu.vercel.app/](https://asteria-mu.vercel.app/)
- **Live REST API**: [https://asteria.fastapicloud.dev](https://asteria.fastapicloud.dev)
- **Interactive API Documentation**: [https://asteria.fastapicloud.dev/docs](https://asteria.fastapicloud.dev/docs)

---

## Features

- **Interactive 3D Solar System**: Render accurate 3D planetary orbits and heliocentric state vectors using Three.js and React Three Fiber.
- **NASA & JPL Data Ingestion**: Automated ingestion of Near-Earth Objects from NASA NeoWs, orbit metadata from JPL SBDB, state vectors from JPL Horizons, and impact monitoring from JPL Sentry.
- **Dual Perspective Radar Views**: Toggle between a Sun-centered Heliocentric view and an Earth-centered Close Approach view.
- **Hazardous & Sentry Risk Tracking**: Filter asteroids classified as Potentially Hazardous Asteroids (PHA) or monitored by JPL Sentry for collision probability, Palermo Scale, and Torino Scale metrics.
- **Impact Physics Engine**: Compute crater diameter, kinetic energy release (Megatons of TNT), blast radius, and thermal radiation zones based on velocity, size, and entry parameters.
- **Sci-Fi Telemetry UI**: Broadcast UI overlay, CRT scanline effects, orbit trail scrubbing, and telemetry readouts.
- **Decoupled Architecture**: Python backend ingestion pipeline updating Supabase PostgreSQL every 30 minutes, served via FastAPI REST API.

---

## System Architecture

```text
                               NASA APIs
         (NeoWs  |  JPL SBDB  |  JPL Horizons  |  JPL Sentry)
                                   │
                                   ▼
                   Railway Scheduled Collector Job
                       (Runs every 30 minutes)
                                   │
                                   ▼
                        Supabase PostgreSQL DB
                                   │
                                   ▼
                          FastAPI REST API
                    (https://asteria.fastapicloud.dev)
                                   │
                                   ▼
                         React + Vite Frontend
                    (https://asteria-mu.vercel.app)
                                   │
                                   ▼
                     3D WebGL / R3F Canvas View
```

### Data Pipeline Overview

1. **Discovery (NASA NeoWs)**: Retrieves daily Near-Earth Objects, SPK IDs, estimated diameters, velocities, and close approach dates.
2. **Orbit Metadata (JPL SBDB)**: Obtains physical parameters, semi-major axis, eccentricity, inclination, and orbit classifications.
3. **State Vectors (JPL Horizons)**: Generates 3D heliocentric Cartesian positions ($X, Y, Z$) and velocity vectors ($V_x, V_y, V_z$).
4. **Risk Assessment (JPL Sentry)**: Monitors collision probabilities, impact dates, and risk scores for Sentry-flagged objects.
5. **Impact Engine**: Calculates energy release, crater size, and blast radius on demand.
6. **3D WebGL Rendering**: Renders state vectors into interactive Three.js scenes.

---

## Project Structure

```text
Asteria/
├── frontend/                       # React 19 + Vite + Three.js Frontend
│   ├── src/
│   │   ├── components/
│   │   │   ├── landing/            # Landing page UI, Hero, Carousel, CRT Overlay
│   │   │   ├── scene/              # 3D Asteroid & Earth orbit trajectory calculations
│   │   │   ├── ui/                 # Galaxy dust, Asteroid selectors, HUD elements
│   │   │   └── visualizer/         # 3D Scene canvas, Sun, Earth, Planets, Milky Way
│   │   ├── hooks/                  # Custom React hooks
│   │   ├── lib/                    # Scale conversions (AU to WebGL units), math utils
│   │   └── pages/                  # LandingPage & VisualizerPage components
│   ├── package.json
│   └── vite.config.js
├── backend/                        # Python FastAPI REST API & Data Collector
│   ├── app/                        # FastAPI REST API routes, models, schemas
│   │   ├── main.py                 # API entrypoint & CORS configuration
│   │   ├── database.py             # SQLAlchemy DB connection setup
│   │   └── routes/                 # Endpoint routes (/asteroids, /trajectory, /sentry, etc.)
│   ├── collector/                  # NASA/JPL Data Ingestion Scripts
│   │   ├── collector.py            # Ingestion pipeline script
│   │   └── nasa_client.py          # NASA NeoWs & JPL API client wrappers
│   ├── API_DOCUMENTATION.md        # API endpoint reference
│   ├── requirements.txt
│   ├── Procfile
│   └── vercel.json / railway.json
├── Asteroid_Data_Dictionary.md     # Dataset dictionary & schema
├── Asteroid_Impact_Data_Pipeline_Architecture.md # Pipeline architecture spec
└── README.md
```

---

## REST API Reference

Base API URL: `https://asteria.fastapicloud.dev`  
Interactive Docs: [https://asteria.fastapicloud.dev/docs](https://asteria.fastapicloud.dev/docs)

| Endpoint | Method | Description | Parameters |
| :--- | :---: | :--- | :--- |
| `/health` | `GET` | Server status and database connectivity check | None |
| `/asteroids` | `GET` | List near-Earth asteroids with pagination | `page`, `limit`, `is_hazardous`, `search` |
| `/asteroids/{spk_id}` | `GET` | Detailed record and orbital parameters for asteroid | `spk_id` |
| `/hazardous` | `GET` | List all Potentially Hazardous Asteroids (PHAs) | None |
| `/trajectory/{spk_id}` | `GET` | 3D state vectors ($X, Y, Z, V_x, V_y, V_z$) for an asteroid | `spk_id` |
| `/planets` | `GET` | 3D solar system planetary state vectors | `name` |
| `/sentry` | `GET` | High-risk impact objects monitored by JPL Sentry | None |

### Example Trajectory Query

```bash
curl -X GET "https://asteria.fastapicloud.dev/trajectory/20136770"
```

```json
{
  "spk_id": "20136770",
  "point_count": 169,
  "vectors": [
    {
      "datetime": "2026-08-01T00:00:00",
      "jd": 2461253.5,
      "x_km": 145000000.0,
      "y_km": -32000000.0,
      "z_km": 15000000.0,
      "vx_kms": 12.5,
      "vy_kms": -22.1,
      "vz_kms": 4.3
    }
  ]
}
```

---

## Getting Started

### Prerequisites

- Node.js v18+
- Python 3.10+

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Local dev server runs at `http://localhost:5173`.

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
uvicorn app.main:app --reload
```

Local API runs at `http://127.0.0.1:8000` (docs at `http://127.0.0.1:8000/docs`).

---

## Tech Stack

| Domain | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Three.js, React Three Fiber (`@react-three/fiber`), `@react-three/drei` |
| **State & Data** | TanStack Query (`@tanstack/react-query`), Zod |
| **Backend** | Python 3.11+, FastAPI, Uvicorn, SQLAlchemy |
| **Database** | PostgreSQL (Supabase) |
| **Data Pipeline** | Scheduled Collector Scripts (Railway Cron Jobs) |
| **APIs** | NASA NeoWs API, JPL Small-Body Database (SBDB), JPL Horizons, JPL Sentry |
| **Hosting** | Vercel (Frontend), Railway (Backend & Collector), Supabase (Database) |

---

## License

Distributed under the GNU General Public License v3.0 (GPL-3.0). See [`LICENSE`](LICENSE) for details.
