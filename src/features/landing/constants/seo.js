/**
 * Meta tags / Open Graph de la landing pública (`SHG-FE-044`, copy final +
 * `og:image` en `SHG-FE-055`).
 *
 * Primer draft cuidado del copy de SEO/marketing — el owner lo ajusta más
 * adelante. Es la fuente de verdad para el copy dinámico que
 * `useDocumentMeta` pisa en cliente mientras la landing está montada.
 *
 * IMPORTANTE: `index.html` (raíz del repo) tiene el mismo copy hardcodeado
 * como fallback estático para crawlers que no ejecutan JS (no leen esta
 * constante — `index.html` no pasa por el bundler de forma dinámica). Si se
 * actualiza este copy, actualizar también `index.html` a mano.
 *
 * `ogImage` reusa la foto del hero (Unsplash, interina — ver
 * `LANDING_HERO.image.credit`) recortada 1200x630 (proporción recomendada
 * para previews de redes). Coordinado con `SHG-FE-046`, que dejó `og:image`
 * apuntando al favicon 512x512 como placeholder: esta imagen la reemplaza.
 */
export const LANDING_SEO = {
  title: 'ShipGo — Envíos, viajes y seguimiento en vivo',
  description:
    'ShipGo centraliza la gestión de envíos y viajes de tu operación, con seguimiento en vivo para tus clientes. Ingresá, creá tu cuenta o rastreá un envío por código.',
  ogImage: 'https://images.unsplash.com/photo-1566576721346-d4a3b4eaeb55?auto=format&fit=crop&q=80&w=1200&h=630',
};
