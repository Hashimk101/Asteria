// scripts/gen-low-res.mjs
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const INPUT_DIR  = path.join(__dirname, '../src/assets/textures');
const OUTPUT_DIR = path.join(__dirname, '../src/assets/textures/low');

// Make output folder if it doesn't exist
if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });

// Exactly your files — mapped to output names Planet.jsx will use
const FILES = [
  { in: '8k_mercury.webp',        out: 'mercury_512.jpg' },
  { in: '8k_venus_surface.jpg',   out: 'venus_512.jpg'   },
  { in: '8k_earth_daymap.webp',   out: 'earth_512.jpg'   },
  { in: '8k_mars.jpg',            out: 'mars_512.jpg'    },
  { in: '8k_jupiter.jpg',         out: 'jupiter_512.jpg' },
  { in: '8k_saturn.jpg',          out: 'saturn_512.jpg'  },
  { in: '2k_uranus.jpg',          out: 'uranus_512.jpg'  },  // already small, still resize
  { in: '2k_neptune.jpg',         out: 'neptune_512.jpg' },
];

console.log('🚀 Generating 512px low-res textures...\n');

for (const file of FILES) {
  const inputPath  = path.join(INPUT_DIR, file.in);
  const outputPath = path.join(OUTPUT_DIR, file.out);

  try {
    const info = await sharp(inputPath)
      .resize(512, 256, { fit: 'fill' })   // planet textures are 2:1 ratio
      .jpeg({ quality: 82 })               // 82% = good quality, tiny file
      .toFile(outputPath);

    const kb = (info.size / 1024).toFixed(1);
    console.log(`  ✅  ${file.in.padEnd(28)} →  ${file.out}  (${kb} KB)`);
  } catch (err) {
    console.error(`  ❌  ${file.in} failed:`, err.message);
  }
}

console.log('\n✨ Done! Low-res textures saved to src/assets/textures/low/');
