import os
import requests
from datetime import date, timedelta
from typing import List, Dict, Any


def fetch_neows_feed(api_key: str, start_days_offset: int = 1, days_count: int = 6) -> List[Dict[str, Any]]:
    """
    Fetches NeoWs feed from NASA API for specified date window.
    Returns list of asteroid dictionaries with close approach data.
    """
    feed_start_date = date.today() + timedelta(days=start_days_offset)
    feed_end_date = feed_start_date + timedelta(days=days_count)

    params = {
        'start_date': feed_start_date.isoformat(),
        'end_date': feed_end_date.isoformat(),
        'api_key': api_key,
    }
    
    url = 'https://api.nasa.gov/neo/rest/v1/feed'
    response = requests.get(url, params=params, timeout=30)
    response.raise_for_status()
    data = response.json()

    if 'near_earth_objects' not in data:
        raise RuntimeError(f"NeoWs returned unexpected response: {data}")

    asteroids_by_id: Dict[str, Dict[str, Any]] = {}

    for approach_date, asteroids in data['near_earth_objects'].items():
        for neo in asteroids:
            asteroid_id = str(neo['id'])
            asteroid = asteroids_by_id.setdefault(
                asteroid_id,
                {
                    'id': asteroid_id,
                    'name': neo['name'],
                    'estimated_diameter_meters': {
                        'min': neo.get('estimated_diameter', {}).get('meters', {}).get('estimated_diameter_min'),
                        'max': neo.get('estimated_diameter', {}).get('meters', {}).get('estimated_diameter_max'),
                    },
                    'is_hazardous': neo.get('is_potentially_hazardous_asteroid', False),
                    'is_sentry_object': neo.get('is_sentry_object', False),
                    'close_approach_data': [],
                },
            )

            for approach in neo.get('close_approach_data', []):
                if approach.get('orbiting_body') == 'Earth':
                    asteroid['close_approach_data'].append(
                        {
                            'date': approach.get('close_approach_date', approach_date),
                            'date_full': approach.get('close_approach_date_full'),
                            'miss_distance_km': float(approach['miss_distance']['kilometers']) if approach.get('miss_distance') else None,
                            'relative_velocity_km_s': float(
                                approach['relative_velocity']['kilometers_per_second']
                            ) if approach.get('relative_velocity') else None,
                        }
                    )

    print(f"[NeoWs Collector] Prepared {len(asteroids_by_id)} unique asteroids from {feed_start_date} to {feed_end_date}.")
    return list(asteroids_by_id.values())
