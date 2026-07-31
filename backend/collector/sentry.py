import requests
from typing import List, Dict, Any, Optional

SENTRY_API = 'https://ssd-api.jpl.nasa.gov/sentry.api'


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


def enrich_asteroids_with_sentry(asteroids_data: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Fetches JPL Sentry impact risk data for monitored asteroids.
    """
    sentry_count = 0
    for asteroid in asteroids_data:
        if not asteroid.get('is_sentry_object'):
            asteroid['sentry'] = None
            continue

        spk_id = asteroid.get('spk_id') or asteroid['id']
        try:
            response = requests.get(SENTRY_API, params={'spk': spk_id}, timeout=30)
            response.raise_for_status()
            sentry_data = response.json()

            if 'error' in sentry_data:
                asteroid['sentry'] = {
                    'status': 'removed' if 'removed' in sentry_data else 'not_found',
                    'error': str(sentry_data['error']),
                    'removed_date': sentry_data.get('removed'),
                }
                continue

            summary = sentry_data.get('summary', {})
            potential_impacts = [
                {
                    'date': impact.get('date'),
                    'impact_probability': optional_float(impact.get('ip')),
                    'palermo_scale': optional_float(impact.get('ps')),
                    'torino_scale': optional_int(impact.get('ts')),
                    'impact_energy_megatons': optional_float(impact.get('energy')),
                }
                for impact in sentry_data.get('data', [])
            ]

            asteroid['sentry'] = {
                'status': 'available',
                'impact_probability': optional_float(summary.get('ip')),
                'palermo_scale_cumulative': optional_float(summary.get('ps_cum')),
                'palermo_scale_max': optional_float(summary.get('ps_max')),
                'torino_scale_max': optional_int(summary.get('ts_max')),
                'impact_energy_megatons': optional_float(summary.get('energy')),
                'potential_impact_dates': [impact['date'] for impact in potential_impacts],
                'potential_impacts': potential_impacts,
            }
            sentry_count += 1
        except Exception as e:
            print(f"[Sentry Collector Error] Asteroid {spk_id}: {e}")
            asteroid['sentry'] = {
                'status': 'error',
                'error': str(e)
            }

    print(f"[Sentry Collector] Added Sentry risk data for {sentry_count} monitored asteroids.")
    return asteroids_data
