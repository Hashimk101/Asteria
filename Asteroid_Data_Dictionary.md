# Asteria Asteroid Data Dictionary

Each item in `todays_asteroids_data` is one asteroid dictionary with the fields below.

## NeoWs fields

| Field | Description |
| --- | --- |
| `name` | Asteroid name supplied by NASA NeoWs. |
| `id` | NeoWs asteroid identifier used to request its SBDB record. |
| `estimated_diameter_meters` | Dictionary containing the estimated asteroid diameter range in meters. |
| `estimated_diameter_meters.min` | Estimated minimum diameter in meters. |
| `estimated_diameter_meters.max` | Estimated maximum diameter in meters. |
| `is_hazardous` | Whether NeoWs marks the asteroid as potentially hazardous. |
| `is_sentry_object` | Whether NeoWs marks the asteroid as monitored by JPL Sentry. |
| `close_approach_data` | List of this asteroid's Earth close approaches in the feed window. |
| `close_approach_data[].date` | Close-approach calendar date in `YYYY-MM-DD` format. |
| `close_approach_data[].date_full` | Full close-approach date and time supplied by NeoWs. |
| `close_approach_data[].miss_distance_km` | Predicted closest Earth miss distance in kilometers. |
| `close_approach_data[].relative_velocity_km_s` | Asteroid's relative Earth velocity at close approach in km/s. |

## SBDB fields

| Field | Description |
| --- | --- |
| `spk_id` | JPL SPK identifier used for Horizons and Sentry lookups. |
| `designation` | JPL's primary designation for the asteroid. |
| `pha` | Whether JPL classifies the asteroid as a Potentially Hazardous Asteroid. |
| `orbit_class_name` | Name of the asteroid's JPL orbital class, such as Apollo or Aten. |
| `semi_major_axis_au` | Orbit semi-major axis in astronomical units. |
| `eccentricity` | Orbit eccentricity, describing how elliptical the orbit is. |
| `inclination_degrees` | Orbit tilt relative to the reference plane in degrees. |
| `longitude_of_ascending_node_degrees` | Angle of the orbit's ascending-node direction in degrees. |
| `argument_of_perihelion_degrees` | Angle from the ascending node to perihelion in degrees. |
| `mean_anomaly_degrees` | Asteroid's orbital position measured from perihelion in degrees. |
| `orbital_period_days` | Time for one orbit around the Sun in days. |
| `moid_au` | Minimum Orbit Intersection Distance from Earth's orbit in astronomical units. |
| `sbdb_error` | SBDB error message when a matching asteroid record cannot be returned. |

## Horizons vector fields

| Field | Description |
| --- | --- |
| `vectors` | Hourly Earth-relative state vectors across the seven-day feed window. |
| `vectors[].jd` | Julian Date of the vector timestamp. |
| `vectors[].datetime` | Horizons vector timestamp in TDB. |
| `vectors[].x_km` | Earth-relative X position in kilometers. |
| `vectors[].y_km` | Earth-relative Y position in kilometers. |
| `vectors[].z_km` | Earth-relative Z position in kilometers. |
| `vectors[].vx_kms` | Earth-relative X velocity in kilometers per second. |
| `vectors[].vy_kms` | Earth-relative Y velocity in kilometers per second. |
| `vectors[].vz_kms` | Earth-relative Z velocity in kilometers per second. |
| `vectors[].distance_from_earth_km` | Earth-to-asteroid distance calculated from the vector position in kilometers. |
| `minimum_distance` | Closest sampled Horizons vector in the requested window. |
| `minimum_distance.datetime` | Timestamp of the closest sampled vector. |
| `minimum_distance.distance_km` | Earth distance of the closest sampled vector in kilometers. |

## Sentry fields

`sentry` is `None` when `is_sentry_object` is false. Otherwise, it contains one of the structures below.

| Field | Description |
| --- | --- |
| `sentry` | JPL Sentry impact-risk data for monitored asteroids, or `None` when not monitored. |
| `sentry.status` | Lookup result: `available`, `removed`, or `not_found`. |
| `sentry.impact_probability` | Cumulative probability of the potential impacts reported by Sentry. |
| `sentry.palermo_scale_cumulative` | Cumulative Palermo impact-hazard scale value. |
| `sentry.palermo_scale_max` | Highest Palermo impact-hazard scale value among reported impacts. |
| `sentry.torino_scale_max` | Highest Torino impact-hazard scale value among reported impacts. |
| `sentry.impact_energy_megatons` | Probability-weighted impact energy estimate in megatons of TNT. |
| `sentry.potential_impact_dates` | List of dates for the reported potential impacts. |
| `sentry.potential_impacts` | Detailed list of individual potential-impact scenarios. |
| `sentry.potential_impacts[].date` | Potential impact date in Sentry's date format. |
| `sentry.potential_impacts[].impact_probability` | Probability of this individual potential impact. |
| `sentry.potential_impacts[].palermo_scale` | Palermo impact-hazard scale for this scenario. |
| `sentry.potential_impacts[].torino_scale` | Torino impact-hazard scale for this scenario. |
| `sentry.potential_impacts[].impact_energy_megatons` | Estimated impact energy for this scenario in megatons of TNT. |
| `sentry.error` | Sentry error message when the monitored object cannot be retrieved. |
| `sentry.removed_date` | Date the object was removed from Sentry, when applicable. |
