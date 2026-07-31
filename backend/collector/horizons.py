import re
import requests
from datetime import date, timedelta
from typing import List, Dict, Any
from concurrent.futures import ThreadPoolExecutor, as_completed

HORIZONS_API = 'https://ssd.jpl.nasa.gov/api/horizons.api'
SUN_CENTER = '500@10'

PLANET_COMMANDS = {
    'Mercury': '199',
    'Venus': '299',
    'Earth': '399',
    'Mars': '499',
    'Jupiter': '599',
    'Saturn': '699',
    'Uranus': '799',
    'Neptune': '899',
}


def extract_horizons_vectors(result_text: str) -> List[Dict[str, Any]]:
    lines = result_text.splitlines()
    try:
        start = next(i for i, line in enumerate(lines) if line.strip() == '$$SOE') + 1
        end = next(i for i, line in enumerate(lines) if line.strip() == '$$EOE')
    except StopIteration as error:
        raise ValueError('Horizons response did not contain vector data delimiter ($$SOE/$$EOE).') from error

    number_pattern = r'[-+]?(?:\d+\.?\d*|\.\d+)[ED][+-]\d+'
    vectors = []
    data_lines = lines[start:end]

    for index, line in enumerate(data_lines):
        if 'A.D.' not in line:
            continue

        jd = float(line.split('=')[0].strip())
        datetime_string = line.split('A.D.')[1].split('TDB')[0].strip()
        position_values = re.findall(number_pattern, data_lines[index + 1])
        velocity_values = re.findall(number_pattern, data_lines[index + 2])

        if len(position_values) != 3 or len(velocity_values) != 3:
            continue

        x, y, z = (float(value.replace('D', 'E')) for value in position_values)
        vx, vy, vz = (float(value.replace('D', 'E')) for value in velocity_values)
        vectors.append(
            {
                'jd': jd,
                'datetime': datetime_string,
                'x_km': x,
                'y_km': y,
                'z_km': z,
                'vx_kms': vx,
                'vy_kms': vy,
                'vz_kms': vz,
            }
        )

    return vectors


def fetch_horizons_vectors(command: str, start_time: str, stop_time: str) -> List[Dict[str, Any]]:
    params = {
        'format': 'json',
        'EPHEM_TYPE': 'VECTORS',
        'COMMAND': command,
        'CENTER': SUN_CENTER,
        'START_TIME': f"'{start_time}'",
        'STOP_TIME': f"'{stop_time}'",
        'STEP_SIZE': '1h',
        'REF_PLANE': 'ECLIPTIC',
        'REF_SYSTEM': 'ICRF',
        'OUT_UNITS': 'KM-S',
        'VEC_TABLE': '2',
        'TIME_TYPE': 'TDB',
        'TIME_DIGITS': 'SECONDS',
    }
    response = requests.get(HORIZONS_API, params=params, timeout=12)
    response.raise_for_status()
    res_json = response.json()
    if 'result' not in res_json:
        raise ValueError(f"Horizons returned error/unexpected json: {res_json}")
    return extract_horizons_vectors(res_json['result'])


def _fetch_asteroid_vector(asteroid: Dict[str, Any], horizons_start: str, horizons_stop: str):
    spk_id = asteroid.get('spk_id')
    if spk_id is None:
        return
    try:
        asteroid['vectors'] = fetch_horizons_vectors(
            f"'DES={spk_id};'", horizons_start, horizons_stop
        )
        print(f"  [Horizons] Vector fetched for SPK {spk_id}", flush=True)
    except Exception as e:
        print(f"  [Horizons Asteroid Warning] SPK {spk_id}: {e}", flush=True)
        asteroid['vectors'] = []


def _fetch_planet_vector(planet_name: str, planet_cmd: str, horizons_start: str, horizons_stop: str):
    try:
        vecs = fetch_horizons_vectors(f"'{planet_cmd}'", horizons_start, horizons_stop)
        print(f"  [Horizons] Vector fetched for planet {planet_name}", flush=True)
        return planet_name, vecs
    except Exception as e:
        print(f"  [Horizons Planet Warning] Planet {planet_name}: {e}", flush=True)
        return planet_name, []


def collect_horizons_data(asteroids_data: List[Dict[str, Any]]) -> Dict[str, Any]:
    """
    Fetches Horizons vectors for asteroids and planets using a polite worker pool to respect JPL rate limits.
    """
    feed_start_date = date.today() + timedelta(days=1)
    feed_end_date = feed_start_date + timedelta(days=6)
    horizons_start = feed_start_date.strftime('%Y-%m-%d 00:00')
    horizons_stop = (feed_end_date + timedelta(days=1)).strftime('%Y-%m-%d 00:00')

    # Fetch vectors with max 3 concurrent threads to prevent JPL rate-limiting timeouts
    valid_asteroids = [a for a in asteroids_data if a.get('spk_id') is not None]
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(_fetch_asteroid_vector, ast, horizons_start, horizons_stop)
            for ast in valid_asteroids
        ]
        for future in as_completed(futures):
            try:
                future.result()
            except Exception:
                pass

    # Fetch planet vectors
    planets_vectors: Dict[str, List[Dict[str, Any]]] = {}
    with ThreadPoolExecutor(max_workers=3) as executor:
        futures = [
            executor.submit(_fetch_planet_vector, p_name, p_cmd, horizons_start, horizons_stop)
            for p_name, p_cmd in PLANET_COMMANDS.items()
        ]
        for future in as_completed(futures):
            try:
                p_name, vectors = future.result()
                planets_vectors[p_name] = vectors
            except Exception:
                pass

    print(f"[Horizons Collector] Collected vectors for asteroids & planets.", flush=True)
    return {
        'asteroids': asteroids_data,
        'planets': planets_vectors
    }
