import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

/**
 * Guard del manifest de la PWA (`public/manifest.webmanifest`): el navegador
 * ofrece instalar la web con lo que diga ese archivo. El nombre de la app
 * instalada es "ShipGO!" (decisión del owner, 2026-11-08).
 */
describe('manifest.webmanifest (instalación de la web)', () => {
  const root = join(import.meta.dirname, '../..');
  const manifest = JSON.parse(readFileSync(join(root, 'public/manifest.webmanifest'), 'utf-8'));
  const html = readFileSync(join(root, 'index.html'), 'utf-8');

  it('el nombre de la app instalada es "ShipGO!"', () => {
    expect(manifest.name).toBe('ShipGO!');
    expect(manifest.short_name).toBe('ShipGO!');
  });

  it('cumple lo mínimo para ser instalable', () => {
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    const tamanios = manifest.icons.map((icon) => icon.sizes);
    expect(tamanios).toContain('192x192');
    expect(tamanios).toContain('512x512');
  });

  it('no bloquea la orientación (la web también se usa en horizontal)', () => {
    expect(manifest).not.toHaveProperty('orientation');
  });

  it('declara íconos "any" y "maskable" y todos existen en public/', () => {
    const propositos = manifest.icons.map((icon) => icon.purpose);
    expect(propositos).toContain('any');
    expect(propositos).toContain('maskable');
    for (const icon of manifest.icons) {
      expect(() => readFileSync(join(root, 'public', icon.src))).not.toThrow();
    }
  });

  // El splash nativo de Chrome (web instalada) usa `background_color`: debe ser el verde de
  // marca, igual que el de app-mobile, y no blanco.
  it('el fondo del splash es el verde de marca (#006b5a), igual que app-mobile', () => {
    expect(manifest.background_color).toBe('#006b5a');
    expect(manifest.theme_color).toBe('#006b5a');
  });

  it('index.html trae un splash verde dentro de #root (se ve antes que React) con el logo precargado', () => {
    expect(html).toMatch(/<div id="root">\s*<div id="splash"/);
    expect(html).toContain('background: #006b5a');
    expect(html).toContain('<link rel="preload" as="image" href="/splash.svg" />');
    expect(html).toContain('src="/splash.svg"');
  });

  it('public/splash.svg existe y es el logo en blanco, sin fondo propio', () => {
    const svg = readFileSync(join(root, 'public/splash.svg'), 'utf-8');
    expect(svg).toContain('fill="#ffffff"');
    expect(svg).not.toMatch(/<rect/);
  });

  it('index.html enlaza el manifest y fija el nombre en iOS y en el instalador', () => {
    expect(html).toContain('<link rel="manifest" href="/manifest.webmanifest" />');
    expect(html).toContain('<meta name="apple-mobile-web-app-title" content="ShipGO!" />');
    expect(html).toContain('<meta name="application-name" content="ShipGO!" />');
  });
});
