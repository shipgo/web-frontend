const SIN_SENAL_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * "Salud" en tiempo real de un viaje `en_camino` para colorear su marcador en
 * el mapa/listado. No es el estado de dominio (`viaje.estado`, que en el mapa
 * siempre es `en_camino` — ver `@domain/estados`): es una clasificación propia
 * a partir de dos señales reales:
 * - **Sin señal**: no llegó ninguna ubicación (SSE o `GET .../last`) reciente.
 * - **Demorado**: ya pasó `fechaHoraFinPlanificada` y el viaje sigue en curso.
 * - **A tiempo**: ninguna de las anteriores.
 *
 * @param {{ fechaHoraFinPlanificada?: string|Date|null }} viaje
 * @param {string|Date|null|undefined} ubicacionTimestamp última ubicación conocida
 */
export const getEstadoVisualViaje = (viaje, ubicacionTimestamp) => {
  const sinSenal =
    !ubicacionTimestamp ||
    Date.now() - new Date(ubicacionTimestamp).getTime() > SIN_SENAL_THRESHOLD_MS;

  if (sinSenal) {
    return { label: 'Sin señal', color: 'gray', prioridad: 0, zIndex: 30 };
  }

  const demorado =
    !!viaje?.fechaHoraFinPlanificada &&
    Date.now() > new Date(viaje.fechaHoraFinPlanificada).getTime();

  if (demorado) {
    return { label: 'Demorado', color: 'orange', prioridad: 1, zIndex: 20 };
  }

  return { label: 'A tiempo', color: 'green', prioridad: 2, zIndex: 10 };
};
