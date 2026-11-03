/**
 * Feature `tracking` — vista pública (guest) de seguimiento por código.
 * Contrato: `planning/CONTRACTS.md §7` (CONTRACT-007).
 *
 * Los componentes de resultado (`TrackingResultado`, `TrackingTimeline`,
 * `TrackingUbicacionMapa`, `TrackingErrorAlert`) y el `TrackingSearchForm` están
 * pensados para reusarse desde el portal CUSTOMER (`SHG-FE-026`), que arma su
 * propia pantalla "detalle de envío" con el `PublicLayout` + estos componentes.
 */

export { default as TrackingPublicoPage } from './pages/TrackingPublico';

export { default as TrackingSearchForm } from './components/TrackingSearchForm';
export { default as TrackingResultado } from './components/TrackingResultado';
export { default as TrackingTimeline } from './components/TrackingTimeline';
export { default as TrackingUbicacionMapa } from './components/TrackingUbicacionMapa';
export { default as TrackingErrorAlert } from './components/TrackingErrorAlert';

export { publicTrackingApi } from './api/tracking.api';
export { usePublicTracking, clasificarErrorTracking } from './hooks/usePublicTracking';
export { codigoEsValido, normalizarCodigo, CODIGO_INVALIDO_MSG } from './utils';
