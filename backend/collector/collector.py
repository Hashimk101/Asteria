import sys
import os
from datetime import datetime

# Add project root to Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy.dialects.postgresql import insert as pg_insert
from app.core.config import settings
from app.database.session import SessionLocal, engine
from app.database.base import Base
from app.models.asteroid import Asteroid, CloseApproach, AsteroidTrajectory
from app.models.planet import PlanetTrajectory
from app.models.sentry import SentryObject

from collector.neows import fetch_neows_feed
from collector.sbdb import enrich_asteroids_with_sbdb
from collector.horizons import collect_horizons_data
from collector.sentry import enrich_asteroids_with_sentry


def run_collector():
    print(f"[{datetime.now().isoformat()}] === Starting Asteria Data Collector Service ===", flush=True)
    
    # Ensure database tables exist
    print("Ensuring database tables are initialized...", flush=True)
    Base.metadata.create_all(bind=engine)

    api_key = settings.NASA_API_KEY
    if not api_key:
        print("ERROR: NASA_API_KEY is not set.", flush=True)
        sys.exit(1)

    # Step 1: NeoWs Feed
    print("Step 1/4: Fetching NeoWs asteroid feed...", flush=True)
    asteroids = fetch_neows_feed(api_key=api_key)

    # Step 2: SBDB Metadata
    print("Step 2/4: Enriching with JPL Small-Body Database (SBDB) data...", flush=True)
    asteroids = enrich_asteroids_with_sbdb(asteroids)

    # Step 3: Sentry Impact Data
    print("Step 3/4: Enriching with JPL Sentry impact risk data...", flush=True)
    asteroids = enrich_asteroids_with_sentry(asteroids)

    # Step 4: Horizons Trajectory Vectors
    print("Step 4/4: Fetching Sun-centered trajectory vectors from JPL Horizons...", flush=True)
    collected = collect_horizons_data(asteroids)
    asteroids = collected['asteroids']
    planets_data = collected['planets']

    # Database Upsert Phase
    print("Beginning Database Upsert Phase...", flush=True)
    db = SessionLocal()
    
    # 1. Upsert Asteroids & Close Approaches individually with immediate commit
    ast_saved = 0
    for ast in asteroids:
        try:
            ast_dict = {
                'id': ast['id'],
                'spk_id': ast.get('spk_id'),
                'name': ast['name'],
                'designation': ast.get('designation'),
                'estimated_diameter_min_m': ast.get('estimated_diameter_meters', {}).get('min'),
                'estimated_diameter_max_m': ast.get('estimated_diameter_meters', {}).get('max'),
                'is_hazardous': ast.get('is_hazardous', False),
                'is_sentry_object': ast.get('is_sentry_object', False),
                'pha': ast.get('pha'),
                'orbit_class_name': ast.get('orbit_class_name'),
                'semi_major_axis_au': ast.get('semi_major_axis_au'),
                'eccentricity': ast.get('eccentricity'),
                'inclination_degrees': ast.get('inclination_degrees'),
                'longitude_of_ascending_node_degrees': ast.get('longitude_of_ascending_node_degrees'),
                'argument_of_perihelion_degrees': ast.get('argument_of_perihelion_degrees'),
                'mean_anomaly_degrees': ast.get('mean_anomaly_degrees'),
                'orbital_period_days': ast.get('orbital_period_days'),
                'moid_au': ast.get('moid_au'),
                'sbdb_error': ast.get('sbdb_error'),
            }

            stmt = pg_insert(Asteroid).values(**ast_dict)
            update_dict = {k: v for k, v in ast_dict.items() if k != 'id'}
            stmt = stmt.on_conflict_do_update(index_elements=['id'], set_=update_dict)
            db.execute(stmt)

            db.query(CloseApproach).filter(CloseApproach.asteroid_id == ast['id']).delete()
            for ca in ast.get('close_approach_data', []):
                ca_obj = CloseApproach(
                    asteroid_id=ast['id'],
                    spk_id=ast.get('spk_id'),
                    date=ca.get('date'),
                    date_full=ca.get('date_full'),
                    miss_distance_km=ca.get('miss_distance_km'),
                    relative_velocity_km_s=ca.get('relative_velocity_km_s'),
                )
                db.add(ca_obj)
            db.commit()
            ast_saved += 1
        except Exception as e:
            db.rollback()
            print(f"Warning saving asteroid {ast['id']}: {e}", flush=True)

    print(f"Successfully saved {ast_saved} asteroids and close approaches.", flush=True)

    # 2. Upsert Asteroid Trajectories in bulk
    traj_saved = 0
    all_asteroid_vec_dicts = []
    for ast in asteroids:
        spk_id = ast.get('spk_id')
        if spk_id and ast.get('vectors'):
            for vec in ast['vectors']:
                all_asteroid_vec_dicts.append({
                    'asteroid_id': ast['id'],
                    'spk_id': spk_id,
                    'jd': vec['jd'],
                    'datetime': vec['datetime'],
                    'x_km': vec['x_km'],
                    'y_km': vec['y_km'],
                    'z_km': vec['z_km'],
                    'vx_kms': vec['vx_kms'],
                    'vy_kms': vec['vy_kms'],
                    'vz_kms': vec['vz_kms'],
                })

    chunk_size = 500
    for i in range(0, len(all_asteroid_vec_dicts), chunk_size):
        chunk = all_asteroid_vec_dicts[i:i + chunk_size]
        if not chunk:
            continue
        try:
            t_stmt = pg_insert(AsteroidTrajectory).values(chunk)
            t_stmt = t_stmt.on_conflict_do_update(
                index_elements=['spk_id', 'jd'],
                set_={
                    'datetime': t_stmt.excluded.datetime,
                    'x_km': t_stmt.excluded.x_km,
                    'y_km': t_stmt.excluded.y_km,
                    'z_km': t_stmt.excluded.z_km,
                    'vx_kms': t_stmt.excluded.vx_kms,
                    'vy_kms': t_stmt.excluded.vy_kms,
                    'vz_kms': t_stmt.excluded.vz_kms,
                }
            )
            db.execute(t_stmt)
            db.commit()
            traj_saved += len(chunk)
        except Exception as e:
            db.rollback()
            print(f"Warning saving asteroid trajectory batch: {e}", flush=True)

    print(f"Successfully saved {traj_saved} trajectory vectors.", flush=True)

    # 3. Upsert Sentry Objects
    for ast in asteroids:
        sentry_info = ast.get('sentry')
        if sentry_info:
            try:
                sentry_dict = {
                    'asteroid_id': ast['id'],
                    'spk_id': ast.get('spk_id'),
                    'status': sentry_info.get('status', 'unknown'),
                    'impact_probability': sentry_info.get('impact_probability'),
                    'palermo_scale_cumulative': sentry_info.get('palermo_scale_cumulative'),
                    'palermo_scale_max': sentry_info.get('palermo_scale_max'),
                    'torino_scale_max': sentry_info.get('torino_scale_max'),
                    'impact_energy_megatons': sentry_info.get('impact_energy_megatons'),
                    'potential_impact_dates': sentry_info.get('potential_impact_dates'),
                    'potential_impacts': sentry_info.get('potential_impacts'),
                    'removed_date': sentry_info.get('removed_date'),
                    'error': sentry_info.get('error'),
                }
                s_stmt = pg_insert(SentryObject).values(**sentry_dict)
                s_stmt = s_stmt.on_conflict_do_update(
                    index_elements=['asteroid_id'],
                    set_={k: v for k, v in sentry_dict.items() if k != 'asteroid_id'}
                )
                db.execute(s_stmt)
                db.commit()
            except Exception as e:
                db.rollback()

    # 4. Upsert Planet Trajectories in bulk
    planet_saved = 0
    all_planet_vec_dicts = []
    for planet_name, planet_vectors in planets_data.items():
        for vec in planet_vectors:
            all_planet_vec_dicts.append({
                'planet_name': planet_name,
                'jd': vec['jd'],
                'datetime': vec['datetime'],
                'x_km': vec['x_km'],
                'y_km': vec['y_km'],
                'z_km': vec['z_km'],
                'vx_kms': vec['vx_kms'],
                'vy_kms': vec['vy_kms'],
                'vz_kms': vec['vz_kms'],
            })

    for i in range(0, len(all_planet_vec_dicts), chunk_size):
        chunk = all_planet_vec_dicts[i:i + chunk_size]
        if not chunk:
            continue
        try:
            p_stmt = pg_insert(PlanetTrajectory).values(chunk)
            p_stmt = p_stmt.on_conflict_do_update(
                index_elements=['planet_name', 'jd'],
                set_={
                    'datetime': p_stmt.excluded.datetime,
                    'x_km': p_stmt.excluded.x_km,
                    'y_km': p_stmt.excluded.y_km,
                    'z_km': p_stmt.excluded.z_km,
                    'vx_kms': p_stmt.excluded.vx_kms,
                    'vy_kms': p_stmt.excluded.vy_kms,
                    'vz_kms': p_stmt.excluded.vz_kms,
                }
            )
            db.execute(p_stmt)
            db.commit()
            planet_saved += len(chunk)
        except Exception as e:
            db.rollback()
            print(f"Warning saving planet trajectory batch: {e}", flush=True)

    # 5. Cleanup outdated trajectories older than yesterday
    print("Step 5/5: Cleaning up outdated trajectory vectors older than yesterday...", flush=True)
    try:
        from sqlalchemy import text
        db.execute(text("DELETE FROM asteroid_trajectories WHERE datetime < NOW() - INTERVAL '1 day'"))
        db.execute(text("DELETE FROM planet_trajectories WHERE datetime < NOW() - INTERVAL '1 day'"))
        db.commit()
        print("Successfully cleaned up old trajectory vectors.", flush=True)
    except Exception as e:
        db.rollback()
        print(f"Warning during cleanup of old trajectory vectors: {e}", flush=True)

    db.close()
    print(f"[{datetime.now().isoformat()}] === Collector Job Finished Successfully ===", flush=True)


if __name__ == "__main__":
    run_collector()

