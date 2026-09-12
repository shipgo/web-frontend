#!/usr/bin/env node
/**
 * Script to generate favicon PNG files from SVG
 * Generates sizes: 16x16, 32x32, 180x180, 192x192, 512x512
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const SVG_INPUT = 'public/favicon.svg';
const OUTPUT_DIR = 'public';
const SIZES = [16, 32, 180, 192, 512];

async function generateFavicons() {
  try {
    console.log('Generating favicon PNG files from SVG...');

    for (const size of SIZES) {
      const outputPath = join(OUTPUT_DIR, `favicon-${size}x${size}.png`);
      await sharp(SVG_INPUT)
        .resize(size, size, {
          fit: 'cover',
          position: 'center',
        })
        .png()
        .toFile(outputPath);
      console.log(`✓ Generated ${outputPath}`);
    }

    // Also generate favicon-512x512.png for manifest (duplicate of 512x512)
    // Generate favicon.ico as a simple copy of 32x32 PNG (browsers fallback to PNG if no true ICO)
    const ico32Path = join(OUTPUT_DIR, 'favicon-32x32.png');
    const icoPath = join(OUTPUT_DIR, 'favicon.ico');
    const pngData = sharp(SVG_INPUT)
      .resize(32, 32, { fit: 'cover', position: 'center' })
      .png();

    await pngData.toFile(icoPath);
    console.log(`✓ Generated ${icoPath} (PNG fallback)`);

    console.log('\nAll favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
    process.exit(1);
  }
}

generateFavicons();
