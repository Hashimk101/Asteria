# Asteria Backend & Data Collector Service

Asteria backend is built with **FastAPI**, **SQLAlchemy ORM**, **Supabase (PostgreSQL)**, and **Python**. It features a completely decoupled architecture where API serving is strictly separated from data collection.

---

## 🏛️ Architecture

```text
                  NASA APIs (NeoWs, SBDB, Horizons, Sentry)
                                      |
                                      v
                      Railway Scheduled Job (Collector)
                            (Runs every 30 mins)
                                      |
                                      v
                           Supabase PostgreSQL DB
                                      |
                                      v
                             FastAPI REST API
                             (Railway Service)
                                      |
                                      v
                           React + Vite Frontend
                                 (Vercel)
```

1. **FastAPI Web Service (`app/`)**: Provides REST endpoints for the frontend. Consumes PostgreSQL exclusively.
2. **Data Collector Service (`collector/`)**: Cron / Scheduled Job that fetches NeoWs, SBDB, Horizons, and Sentry APIs and upserts into PostgreSQL.

---

## ⚙️ Environment Configuration

Copy `.env.example` to `.env` and configure your credentials:

```env
DATABASE_URL=postgresql://postgres:password@host:5432/postgres
NASA_API_KEY=your_nasa_api_key_here
PORT=8000
CORS_ORIGINS=*
```

---

## 🚀 Running Locally

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Execute Data Collector Job

Run the collector script manually to populate the database with fresh NASA data:

```bash
python collector/collector.py
```

### 3. Start REST API Server

```bash
uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

Interactive API Documentation will be available at:
- **Swagger UI**: [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc**: [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

## 🛰️ REST Endpoints

| Endpoint | Method | Description |
| --- | --- | --- |
| `/health` | GET | Health check & PostgreSQL connection status |
| `/asteroids` | GET | List near-Earth asteroids (filters: `is_hazardous`, `is_sentry`, `search`) |
| `/asteroids/{spk_id}` | GET | Detailed record for single asteroid by SPK ID |
| `/planets` | GET | Sun-centered state vectors for all 8 planets |
| `/sentry` | GET | Monitored asteroids with JPL Sentry impact probabilities |
| `/hazardous` | GET | Potentially hazardous asteroids (PHA) |
| `/trajectory/{spk_id}` | GET | State vector trajectory array for specific asteroid |

---

## 🚂 Railway Deployment Guide

### Service 1: FastAPI REST API
- Root Directory: `backend`
- Start Command: `uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}`
- Environment Variables: `DATABASE_URL`, `NASA_API_KEY`, `CORS_ORIGINS`

### Service 2: Railway Scheduled Job (Data Collector)
- Schedule: Every 30 minutes (`*/30 * * * *`)
- Command: `python collector/collector.py`
- Environment Variables: `DATABASE_URL`, `NASA_API_KEY`
