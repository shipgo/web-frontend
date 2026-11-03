/**
 * Estados de viaje en los que se permite editar.
 * Motivo: conforme a CONTRACTS.md §8 / SHG-BE-021, editar un viaje requiere
 * mandar sólo fechas planificadas (nunca las reales fechaHoraInicio/fechaHoraFin,
 * que el backend completa server-side). Editar un viaje ya iniciado no tiene
 * sentido para el MVP, así que se restringe a estados donde esas fechas reales
 * son siempre null: creado y planificado.
 *
 * Usado por:
 * - EditarViaje (acceso a pantalla)
 * - DetalleViaje/acciones.js (visibilidad del botón "Editar")
 */
export const VIAJE_ESTADOS_EDITABLES = ['creado', 'planificado'];
