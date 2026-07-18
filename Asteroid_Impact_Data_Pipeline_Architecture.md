# Asteroid Impact Visualization -- Data Pipeline Architecture

## Overview

This architecture is intended for a NASA Space Apps project that
visualizes near-Earth asteroids, animates their trajectories, displays
impact risk, and simulates hypothetical impacts.

``` text
User Opens App
      │
      ▼
1. NASA NeoWs Feed
      │
      ▼
Get today's Near-Earth Objects (IDs, names, velocity, diameter, close approach)
      │
      ▼
Optional Filter:
- Show all asteroids
- OR only is_sentry_object == true
      │
      ▼
2. JPL Small-Body Database (SBDB)
      │
      ▼
Retrieve:
- Physical properties
- Orbital elements
- Orbit metadata
      │
      ▼
3. JPL Horizons
      │
      ▼
Retrieve:
- Current position
- Future positions
- Velocity vectors
- Ephemerides
Use these to animate the trajectory.
      │
      ▼
4. JPL Sentry (Only if is_sentry_object == true)
      │
      ▼
Retrieve:
- Impact probability
- Torino Scale
- Palermo Scale
- Possible impact dates
      │
      ▼
5. Physics Engine (Your code)
      │
      ▼
Compute:
- Crater diameter
- Blast radius
- Fireball size
- Energy released
      │
      ▼
6. Visualization Layer
      │
      ▼
Display:
- 3D Earth
- Asteroid trajectory
- Impact simulation
- Risk dashboard
```

## Why start with NeoWs?

NeoWs provides: - Asteroid IDs (SPK IDs) - Names - Diameter estimates -
Velocity - Close-approach data - `is_potentially_hazardous_asteroid` -
`is_sentry_object`

These IDs are then used to query the more detailed JPL services.

## API Responsibilities

  Step   API              Purpose
  ------ ---------------- -------------------------------------------------
  1      NeoWs            Discover near-Earth asteroids and obtain IDs
  2      SBDB             Physical properties and orbital elements
  3      Horizons         Current position and trajectory
  4      Sentry           Impact probability and risk (only if monitored)
  5      Physics Engine   Crater and damage calculations
  6      Visualization    Render trajectory and simulation

## Optimization

Only query the Sentry API for asteroids where NeoWs reports:

``` json
"is_sentry_object": true
```

This reduces unnecessary requests.

------------------------------------------------------------------------

# Useful Links

## NASA NeoWs

https://api.nasa.gov/

## JPL Horizons Documentation

https://ssd-api.jpl.nasa.gov/doc/horizons.html

## JPL Small-Body Database Documentation

https://ssd-api.jpl.nasa.gov/doc/sbdb.html

## JPL Sentry Documentation

https://ssd-api.jpl.nasa.gov/doc/sentry.html

## JPL CAD Documentation

https://ssd-api.jpl.nasa.gov/doc/cad.html

## JPL SSD API Index

https://ssd-api.jpl.nasa.gov/
