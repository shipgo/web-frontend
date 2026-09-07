/**
 * Feature `portal` — zona autenticada del CUSTOMER (`SHG-FE-026`).
 * Contrato: `planning/CONTRACTS.md §7` (CONTRACT-007).
 *
 * - `/registro` + `/registro/verificar` — registro público + verificación de email.
 * - `/portal/envios` + `/portal/envios/:codigo` — "mis envíos" y su detalle.
 *
 * El layout es `PublicLayout` (branding ShipGo, sin AppShell de admin); el portal
 * lo envuelve en `PortalLayout` para sumar el menú de la cuenta.
 */

export { default as RegistroPage } from './pages/Registro';
export { default as VerificarCuentaPage } from './pages/VerificarCuenta';
export { default as PortalEnviosPage } from './pages/PortalEnvios';
export { default as PortalEnvioDetallePage } from './pages/PortalEnvioDetalle';
export { default as PortalLayout } from './components/PortalLayout';

export { registroApi, portalApi } from './api/portal.api';
