/**
 * Meta tags / Open Graph de la landing pública (`SHG-FE-044`).
 *
 * DRAFT — placeholder del primer corte. El owner reemplaza el copy final de
 * marketing/SEO. Es la fuente de verdad para el copy dinámico que
 * `useDocumentMeta` pisa en cliente mientras la landing está montada.
 *
 * IMPORTANTE: `index.html` (raíz del repo) tiene el mismo copy hardcodeado
 * como fallback estático para crawlers que no ejecutan JS (no leen esta
 * constante — `index.html` no pasa por el bundler de forma dinámica). Si se
 * actualiza este copy, actualizar también `index.html` a mano.
 */
export const LANDING_SEO = {
  title: 'ShipGo — Envíos, viajes y seguimiento en vivo',
  // TODO(owner): copy definitivo de SEO/marketing.
  description:
    'ShipGo centraliza la gestión de envíos y viajes de tu operación, con seguimiento en vivo para tus clientes. Ingresá, creá tu cuenta o rastreá un envío por código.',
};
