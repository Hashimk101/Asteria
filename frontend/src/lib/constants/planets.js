//PLANET TEXTURES AND PROPERTIES
import MercuryTexture from "../../assets/textures/8k_mercury.webp"
import VenusTexture from "../../assets/textures/8k_venus_surface.jpg"
import EarthTexture from "../../assets/textures/8k_earth_daymap.webp"
import MarsTexture from "../../assets/textures/8k_mars.jpg"
import JupiterTexture from "../../assets/textures/8k_jupiter.jpg"
import SaturnTexture from "../../assets/textures/8k_saturn.jpg"
import UranusTexture from "../../assets/textures/2k_uranus.jpg"
import NeptuneTexture from "../../assets/textures/2k_neptune.jpg"

export const PLANET_CONFIG = {
  Mercury: { texture: MercuryTexture,  radius: 0.20, rotationSpeed: 0.003, roughness: 0.95, metalness: 0.0  },
  Venus:   { texture: VenusTexture,    radius: 0.40, rotationSpeed: 0.002, roughness: 0.90, metalness: 0.0  },
  Earth:   { texture: EarthTexture,    radius: 0.45, rotationSpeed: 0.04,  roughness: 0.78, metalness: 0.02 },
  Mars:    { texture: MarsTexture,     radius: 0.30, rotationSpeed: 0.038, roughness: 0.90, metalness: 0.0  },
  Jupiter: { texture: JupiterTexture,  radius: 1.20, rotationSpeed: 0.09,  roughness: 0.70, metalness: 0.0  },
  Saturn:  { texture: SaturnTexture,   radius: 1.00, rotationSpeed: 0.085, roughness: 0.75, metalness: 0.0  },
  Uranus:  { texture: UranusTexture,   radius: 0.70, rotationSpeed: 0.05,  roughness: 0.80, metalness: 0.0  },
  Neptune: { texture: NeptuneTexture,  radius: 0.65, rotationSpeed: 0.045, roughness: 0.80, metalness: 0.0  },
};




