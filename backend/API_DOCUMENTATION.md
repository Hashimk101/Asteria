# 🌌 Asteria REST API Documentation

**Live Base URL**: `https://asteria.fastapicloud.dev`  
**Interactive Swagger UI**: [https://asteria.fastapicloud.dev/docs](https://asteria.fastapicloud.dev/docs)  
**ReDoc Documentation**: [https://asteria.fastapicloud.dev/redoc](https://asteria.fastapicloud.dev/redoc)  

---

## 📌 Overview for Frontend Developers

The **Asteria Backend** provides real-time astronomical data for near-Earth asteroids, planetary trajectories, close approaches, and NASA Sentry impact risk data.

- All endpoints return JSON.
- CORS is enabled (`*`), allowing direct `fetch()` or `axios` calls from your React/Vite frontend.

---

## 🚀 Endpoints Summary

| Endpoint | Method | Description |
| --- | --- | --- |
| `GET /health` | GET | Check API server status and database connectivity |
| `GET /asteroids` | GET | List near-Earth asteroids (with pagination & hazardous filter) |
| `GET /asteroids/{spk_id}` | GET | Get detailed orbital parameters & close approaches for an asteroid |
| `GET /hazardous` | GET | Get all potentially hazardous asteroids (PHA) |
| `GET /trajectory/{spk_id}` | GET | Get 3D heliocentric state vectors ($X, Y, Z, V_x, V_y, V_z$) for an asteroid |
| `GET /planets` | GET | Get 3D state vectors for solar system planets |
| `GET /sentry` | GET | Get JPL Sentry impact risk monitored objects |

---

## 📖 Endpoint Details & Example Responses

### 1. `GET /health`
Checks server and database connection health.

**Request**:
```bash
curl -X GET https://asteria.fastapicloud.dev/health
```

**Response (200 OK)**:
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

### 2. `GET /asteroids`
Returns a paginated list of near-Earth asteroids.

**Query Parameters**:
- `page` *(int, default: 1)*: Page number
- `limit` *(int, default: 20, max: 100)*: Items per page
- `is_hazardous` *(boolean, optional)*: Filter by hazardous status (`true` / `false`)

**Request**:
```bash
curl -X GET "https://asteria.fastapicloud.dev/asteroids?page=1&limit=10"
```

**Response (200 OK)**:
```json
[
  {
    "id": "20136770",
    "spk_id": "20136770",
    "name": "136770 (1996 PC1)",
    "designation": "136770",
    "estimated_diameter_min_m": 725.2,
    "estimated_diameter_max_m": 1621.6,
    "is_hazardous": true,
    "is_sentry_object": false,
    "orbit_class_name": "Apollo",
    "close_approach_count": 1
  }
]
```

---

### 3. `GET /asteroids/{spk_id}`
Returns full details for a specific asteroid including orbital parameters and upcoming close approaches to Earth.

**Path Parameters**:
- `spk_id` *(string, required)*: Asteroid SPK-ID (e.g. `20136770`)

**Request**:
```bash
curl -X GET https://asteria.fastapicloud.dev/asteroids/20136770
```

**Response (200 OK)**:
```json
{
  "id": "20136770",
  "spk_id": "20136770",
  "name": "136770 (1996 PC1)",
  "semi_major_axis_au": 1.42,
  "eccentricity": 0.38,
  "inclination_degrees": 21.6,
  "close_approach_data": [
    {
      "date": "2026-08-05",
      "miss_distance_km": 4200000.0,
      "relative_velocity_km_s": 14.85
    }
  ]
}
```

---

### 4. `GET /hazardous`
Returns all potentially hazardous asteroids (PHA).

**Request**:
```bash
curl -X GET https://asteria.fastapicloud.dev/hazardous
```

---

### 5. `GET /trajectory/{spk_id}`
Returns 3D heliocentric Cartesian state vectors ($X, Y, Z, V_x, V_y, V_z$) for 3D visualization (e.g. Three.js / WebGL).

**Path Parameters**:
- `spk_id` *(string, required)*: Asteroid SPK-ID (e.g. `20136770`)

**Request**:
```bash
curl -X GET https://asteria.fastapicloud.dev/trajectory/20136770
```

**Response (200 OK)**:
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

### 6. `GET /planets`
Returns 3D trajectory state vectors for solar system planets (Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, Neptune).

**Query Parameters**:
- `name` *(string, optional)*: Filter by planet name (e.g., `Mars`, `Earth`)

**Request**:
```bash
curl -X GET "https://asteria.fastapicloud.dev/planets?name=Mars"
```

---

### 7. `GET /sentry`
Returns JPL Sentry impact risk objects.

**Request**:
```bash
curl -X GET https://asteria.fastapicloud.dev/sentry
```

---

## 💻 Example React / JavaScript Fetch Code

```javascript
// Fetch asteroids list for your React component
async function fetchAsteroids() {
  const response = await fetch('https://asteria.fastapicloud.dev/asteroids?page=1&limit=20');
  const data = await response.json();
  return data;
}

// Fetch 3D trajectory vectors for Three.js visualization
async function fetchTrajectory(spkId) {
  const response = await fetch(`https://asteria.fastapicloud.dev/trajectory/${spkId}`);
  const trajectoryData = await response.json();
  return trajectoryData.vectors; // Array of { datetime, x_km, y_km, z_km, vx_kms, vy_kms, vz_kms }
}
```
