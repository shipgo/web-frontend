import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { LANDING_SEO } from '../features/landing/constants/seo';

/**
 * Guard de regresión para el fallback estático de SEO/Open Graph en
 * `index.html` (raíz del repo).
 *
 * `useDocumentMeta` (`src/features/landing/hooks/useDocumentMeta.js`) sólo
 * inyecta los tags de SEO client-side, después del render de React. Los
 * crawlers que generan previews de links (Facebook, WhatsApp, Slack,
 * X/Twitter, LinkedIn) no ejecutan JS: sólo ven el `index.html` crudo. Por
 * eso ese archivo tiene el mismo copy de `LANDING_SEO` hardcodeado como
 * fallback — este test verifica que no se desincronicen.
 *
 * No se puede testear "cómo lo ve un crawler real" en un test unitario (no
 * hay build de producción disponible acá), pero sí podemos asegurar que el
 * HTML fuente sigue trayendo el título/descripción/OG esperados en texto
 * plano.
 */
describe('index.html (fallback estático de SEO para crawlers sin JS)', () => {
  const html = readFileSync(join(import.meta.dirname, '../../index.html'), 'utf-8');

  it('trae el <title> de la landing', () => {
    expect(html).toContain(`<title>${LANDING_SEO.title}</title>`);
  });

  it('trae la meta description de la landing', () => {
    expect(html).toContain(LANDING_SEO.description);
  });

  it('trae los tags de Open Graph esperados', () => {
    expect(html).toMatch(/<meta property="og:title" content="[^"]*" \/>/);
    expect(html).toMatch(/<meta property="og:type" content="website" \/>/);
    expect(html).toContain(`property="og:title" content="${LANDING_SEO.title}"`);
    expect(html).toContain(`property="og:description"`);
  });
});
