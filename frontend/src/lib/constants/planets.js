// ─── Texture paths ────────────────────────────────────────────────────────────
import earthTex   from '../../assets/textures/8k_earth_daymap.webp';
import sunTex     from '../../assets/textures/8k_sun.jpg';
import mercuryTex from '../../assets/textures/2k_mercury.jpg';
import venusTex   from '../../assets/textures/2k_venus_surface.jpg';
import marsTex    from '../../assets/textures/2k_mars.jpg';
import jupiterTex from '../../assets/textures/2k_jupiter.jpg';
import saturnTex  from '../../assets/textures/2k_saturn.jpg';
import uranusTex  from '../../assets/textures/2k_uranus.jpg';
import neptuneTex from '../../assets/textures/2k_neptune.jpg';

export const PLANET_CONFIG = {
  Sun: {
    texture:           sunTex,
    roughness:         0.4,
    metalness:         0.0,
    rotationSpeed:     0.008,
    radius:            695.7,
    emissive:          '#ff6600',
    emissiveIntensity: 0.6,
  },
  Earth: {
    texture:       earthTex,
    roughness:     0.6,
    metalness:     0.05,
    rotationSpeed: 0.05,
    radius:        6.4,
  },
  Mercury: { texture: mercuryTex, roughness: 0.95, metalness: 0.0, rotationSpeed: 0.01,  radius: 2.4  },
  Venus:   { texture: venusTex,   roughness: 0.85, metalness: 0.0, rotationSpeed: 0.007, radius: 6.1  },
  Mars:    { texture: marsTex,    roughness: 0.95, metalness: 0.0, rotationSpeed: 0.048, radius: 3.4  },
  Jupiter: { texture: jupiterTex, roughness: 0.7,  metalness: 0.0, rotationSpeed: 0.12,  radius: 70.0 },
  Saturn:  { texture: saturnTex,  roughness: 0.75, metalness: 0.0, rotationSpeed: 0.11,  radius: 58.5 },
  Uranus:  { texture: uranusTex,  roughness: 0.8,  metalness: 0.0, rotationSpeed: 0.06,  radius: 25.4 },
  Neptune: { texture: neptuneTex, roughness: 0.8,  metalness: 0.0, rotationSpeed: 0.058, radius: 24.6 },
};
