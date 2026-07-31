import requests
from typing import List, Dict, Any, Optional

SBDB_API = 'https://ssd-api.jpl.nasa.gov/sbdb.api'


def get_orbit_value(elements: list, target_name: str) -> Optional[float]:
    for element in elements:
        if element.get('name') == target_name and element.get('value') is not None:
            try:
                return float(element['value'])
            except (ValueError, TypeError):
                return None
    return None


def optional_float(value: Any) -> Optional[float]:
    if value in (None, '', 'n/a'):
        return None
    try:
        return float(value)
    except (ValueError, TypeError):
        return None


def optional_int(value: Any) -> Optional[int]:
    if value in (None, '', 'n/a'):
        return None
    try:
        return int(value)
    except (ValueError, TypeError):
        return None


def enrich_asteroids_with_sbdb(asteroids_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Queries JPL SBDB API for each asteroid and enriches it with orbital parameters.
    """
    for asteroid in asteroids_data:
        try:
            response = requests.get(SBDB_API, params={'spk': asteroid['id']}, timeout=30)
            response.raise_for_status()
            sbdb_data = response.json()

            if 'error' in sbdb_data:
                asteroid['sbdb_error'] = str(sbdb_data['error'])
                continue

            object_data = sbdb_data.get('object', {})
            orbit_data = sbdb_data.get('orbit', {})
            orbit_elements = orbit_data.get('elements', [])
            orbit_class = object_data.get('orbit_class') or {}

            asteroid.update(
                {
                    'spk_id': optional_int(object_data.get('spkid')),
                    'designation': object_data.get('des'),
                    'pha': object_data.get('pha'),
                    'orbit_class_name': orbit_class.get('name'),
                    'semi_major_axis_au': get_orbit_value(orbit_elements, 'a'),
                    'eccentricity': get_orbit_value(orbit_elements, 'e'),
                    'inclination_degrees': get_orbit_value(orbit_elements, 'i'),
                    'longitude_of_ascending_node_degrees': get_orbit_value(orbit_elements, 'om'),
                    'argument_of_perihelion_degrees': get_orbit_value(orbit_elements, 'w'),
                    'mean_anomaly_degrees': get_orbit_value(orbit_elements, 'ma'),
                    'orbital_period_days': get_orbit_value(orbit_elements, 'per'),
                    'moid_au': optional_float(orbit_data.get('moid')),
                }
            )
        except Exception as e:
            print(f"[SBDB Collector Error] Asteroid ID {asteroid['id']}: {e}")
            asteroid['sbdb_error'] = str(e)

    print(f"[SBDB Collector] Enriched {len(asteroids_data)} asteroids with SBDB data.", flush=True)
    return asteroids_data
