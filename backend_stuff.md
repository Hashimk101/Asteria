# Asteria - Backend Architecture & Implementation Plan

## Overview

Asteria follows a decoupled architecture where the frontend, backend, database, and data collection pipeline are completely independent services.

The backend is responsible only for serving data to the frontend. It never communicates directly with NASA/JPL APIs.

All NASA/JPL API calls are performed by a separate data collection service that periodically updates the database.

---

## Tech Stack

| Component | Technology |
|----------|----------|
| Frontend | React + Vite |
| Frontend Deployment | Vercel |
| Backend | FastAPI |
| API Architecture | REST API |
| Backend Deployment | Railway |
| Database | Supabase (PostgreSQL) |
| ORM | SQLAlchemy |
| Scheduled Jobs | Railway Scheduled Jobs |
| Job Frequency | Every 30 Minutes |
| Documentation | FastAPI Swagger & ReDoc |
| Environment Variables | .env |

---

## System Architecture

```text
                        NASA APIs
                             |
                             |
                             v
                    Railway Scheduled Job
                       (Every 30 Minutes)
                             |
                             v
                        Data Collector
                             |
                             |
            NeoWs -> SBDB -> Horizons APIs
                             |
                             v
                     Supabase PostgreSQL
                             |
                             v
                           FastAPI
                             |
                             v
                         REST API
                             |
                             v
                     React + Vite (Vercel)
                             |
                             v
                            User
```

---

## Backend Responsibilities

The FastAPI backend is responsible for:

- Connecting to PostgreSQL.
- Querying asteroid and planetary data.
- Returning JSON responses.
- Filtering and processing data where necessary.
- Providing REST API endpoints.
- Providing automatic API documentation.

The backend MUST NOT:

- Call NeoWs.
- Call SBDB.
- Call Horizons.
- Perform scheduled data collection.
- Update the database periodically.

The backend only reads data from the database.

---

## Data Collector Responsibilities

The data collector is a completely separate service from FastAPI.

Its responsibilities are:

- Fetch asteroid data from NeoWs.
- Fetch orbital metadata from SBDB.
- Fetch Sun-centered trajectory vectors from Horizons.
- Fetch planetary vectors from Horizons.
- Validate and process all fetched data.
- Insert or update database records.

The collector MUST:

- Run every 30 minutes.
- Use upsert logic.
- Exit after completion.

The collector should never expose any API endpoints.

---

## Scheduled Jobs

Railway Scheduled Jobs will be used for periodically updating the database.

Schedule:

```text
Every 30 minutes
```

Execution flow:

```text
Run collector.py

↓

Fetch latest data

↓

Process data

↓

Update PostgreSQL

↓

Exit
```

The FastAPI server should not be running any background scheduler.

---

## Project Structure

```text
backend/

├── app/
│
│   ├── api/
│   │
│   ├── models/
│   │
│   ├── schemas/
│   │
│   ├── services/
│   │
│   ├── database/
│   │
│   ├── core/
│   │
│   └── main.py
│
├── collector/
│
│   ├── neows.py
│   ├── sbdb.py
│   ├── horizons.py
│   └── collector.py
│
├── tests/
│
├── .env.example
├── requirements.txt
└── README.md
```

---

## Environment Variables

Create a:

```text
.env.example
```

containing all required environment variables.

Example:

```env
NASA_API_KEY=

DATABASE_URL=
```

No credentials should ever be hardcoded.

If credentials are required during implementation, the coding agent MUST ask for them before proceeding.

Examples:

```text
Please provide:

1. NASA API Key.
2. Supabase PostgreSQL connection string.
```

No assumptions should be made regarding any credentials.

---

## Database Responsibilities

The backend implementation must:

- Configure SQLAlchemy.
- Configure PostgreSQL connectivity.
- Implement database models.
- Implement CRUD operations where necessary.
- Implement upsert support for the collector.

The database will be hosted on Supabase.

---

## REST API Endpoints

Minimum required endpoints:

```text
GET /asteroids

GET /asteroids/{spk_id}

GET /planets

GET /sentry

GET /hazardous

GET /trajectory/{spk_id}

GET /health
```

Optional endpoints:

```text
GET /stats

GET /closest-approaches
```

All endpoints should return JSON responses.

---

## Data Collection Pipeline

The collector should perform the following operations:

```text
NeoWs

↓

SBDB

↓

Horizons (Asteroids)

↓

Horizons (Planets)

↓

Validate Data

↓

Process Data

↓

Insert or Update PostgreSQL
```

The collector should use:

```text
INSERT ... ON CONFLICT UPDATE
```

or the SQLAlchemy equivalent to avoid duplicate records.

---

## Deployment Architecture

### Frontend

```text
React + Vite

↓

GitHub

↓

Vercel
```

---

### Backend

```text
FastAPI

↓

GitHub

↓

Railway
```

---

### Database

```text
Supabase PostgreSQL
```

---

### Scheduled Jobs

```text
Collector Service

↓

Railway Scheduled Jobs

↓

Every 30 Minutes
```

---

## Railway Services

Two Railway services are recommended.

### Service 1

```text
FastAPI Backend
```

Responsibilities:

- REST API.
- Database access.
- Documentation endpoints.

---

### Service 2

```text
Collector Service
```

Responsibilities:

- Data collection.
- Database updates.
- Scheduled execution.

Keeping both services separate improves maintainability and debugging.

---

## API Documentation

FastAPI's built-in documentation should be enabled.

Available routes:

```text
/docs

/redoc
```

No additional API documentation tools are required.

---

## Frontend Communication

The React frontend will communicate directly with the FastAPI REST API.

Example:

```text
React App

↓

GET /asteroids

↓

FastAPI

↓

PostgreSQL

↓

JSON Response

↓

Frontend Visualization
```

The frontend will never communicate directly with:

- NeoWs
- SBDB
- Horizons
- PostgreSQL

All communication should go through FastAPI.

---

## Coding Agent Prompt

Use the following prompt when implementing the backend.

```text
Implement the entire backend for the Asteria project using the following stack:

- FastAPI
- REST API architecture
- PostgreSQL (Supabase)
- SQLAlchemy ORM
- Railway deployment
- Railway Scheduled Jobs (every 30 minutes)
- Python

Requirements:

1. The backend must be completely separated from the frontend.

2. FastAPI must only communicate with PostgreSQL and must never directly call any NASA or JPL APIs.

3. Create a separate collector service responsible for:
   - NeoWs data collection
   - SBDB data collection
   - Horizons asteroid trajectory collection
   - Horizons planetary trajectory collection
   - Database updates every 30 minutes

4. The collector must be designed to run as a Railway Scheduled Job.

5. Implement all SQLAlchemy models, database configuration, and CRUD logic.

6. Implement the following REST endpoints:
   - GET /asteroids
   - GET /asteroids/{spk_id}
   - GET /planets
   - GET /sentry
   - GET /hazardous
   - GET /trajectory/{spk_id}
   - GET /health

7. Use environment variables for all secrets and credentials.

8. Create a .env.example file containing all required environment variables.

9. If any credentials are required (NASA API key, Supabase PostgreSQL connection string, etc.), ask me for them before implementing the final configuration. Do not use fake or placeholder credentials that appear valid.

10. Create a clean and scalable project structure that separates:
   - API routes
   - database models
   - schemas
   - services
   - collector logic
   - configuration

11. Configure FastAPI's Swagger and ReDoc documentation.

12. The collector should use upsert logic when updating the database.

13. Prepare the project for deployment on Railway and ensure the REST API can be consumed by a React + Vite frontend deployed on Vercel.

Keep the implementation simple, production-ready, and easy to deploy. Do not introduce unnecessary authentication, caching, Docker configuration, or additional services unless explicitly requested.
```

## Notes

- Keep the architecture simple and modular.
- The backend should only serve data.
- The collector should only collect and update data.
- Scheduled jobs should be handled exclusively by Railway.
- Frontend and backend should be independently deployable.
- Credentials must always be requested from the project owner before configuration.
