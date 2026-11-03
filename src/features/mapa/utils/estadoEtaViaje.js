import { getEstadoVisualViaje } from './estadoVisual';

/**
 * Única fuente de estado y ETA de un viaje en el mapa (`SHG-FE-113`). La usan la
 * tarjeta de la lista (`MapListadoViajesItem`) y el panel (`MapDetalles`) para que
 * no se contradigan: antes la lista decía "Sin señal"/"Demorado" con la llegada
 * planificada vieja y el panel decía "En camino" con la ETA de la ruta de hoy.
 *
 * - `estado`: clasificación en vivo de `getEstadoVisualViaje` (Sin señal / Demorado
 *   / A tiempo) a partir de la última ubicación y de `fechaHoraFinPlanificada`.
 * - `eta` / `etaFuente`:
 *   - `'ruta'`: ETA calculada con la ruta (Mapbox) desde la posición actual. Sólo se
 *     usa si hay señal reciente — sin señal la posición es vieja y la ruta no
 *     significa nada — y si el caller la pudo calcular (`etaRuta`).
 *   - `'planificada'`: `fechaHoraFinPlanificada` del viaje.
 *   - `null` si no hay ninguna de las dos.
 *
 * @param {{ fechaHoraFinPlanificada?: string|Date|null }} viaje
 * @param {string|Date|null|undefined} ultimaActualizacion timestamp de la última ubicación
 * @param {{ etaRuta?: Date|null }} [opciones]
 * @returns {{ estado: ReturnType<typeof getEstadoVisualViaje>, sinSenal: boolean,
 *   eta: Date|null, etaFuente: 'ruta'|'planificada'|null }}
 */
export const getEstadoEtaViaje = (viaje, ultimaActualizacion, { etaRuta = null } = {}) => {
  const estado = getEstadoVisualViaje(viaje, ultimaActualizacion);
  const sinSenal = estado.label === 'Sin señal';

  if (etaRuta && !sinSenal) {
    return { estado, sinSenal, eta: etaRuta, etaFuente: 'ruta' };
  }

  const planificada = viaje?.fechaHoraFinPlanificada
    ? new Date(viaje.fechaHoraFinPlanificada)
    : null;
  if (planificada && !Number.isNaN(planificada.getTime())) {
    return { estado, sinSenal, eta: planificada, etaFuente: 'planificada' };
  }

  return { estado, sinSenal, eta: null, etaFuente: null };
};
