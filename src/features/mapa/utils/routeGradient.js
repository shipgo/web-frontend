const COLOR_PENDIENTE = '#3b82f6';
const COLOR_ENTREGADO = '#868e96';

// Ancho (en fracción de la ruta) de la transición gris → azul. Mapbox exige que
// los inputs de `interpolate` sean ESTRICTAMENTE crecientes: con un progreso a
// menos de este ancho de 0 o de 1, `progress ± ANCHO` se pisaría con los
// extremos (0 y 1) y Mapbox rechazaba la capa entera (SHG-FE-137).
const ANCHO_TRANSICION = 0.005;

const gradiente = (...paradas) => [
  'interpolate',
  ['linear'],
  ['line-progress'],
  ...paradas.flat(),
];

/**
 * `line-gradient` de la capa de la ruta del viaje: gris lo ya entregado, azul lo
 * pendiente. Requiere `lineMetrics: true` en el `Source`.
 *
 * - Sin progreso (o tan cerca de 0 que la transición no entra): todo azul.
 * - Todo entregado (o tan cerca de 1 que no entra): todo gris.
 * - Si no, gris hasta el progreso y azul desde ahí, con una transición corta.
 *
 * @param {number} progress fracción entregada de la ruta, `0..1`.
 */
export const getRouteGradient = (progress) => {
  // `!(x > y)` en vez de `x <= y`: un `NaN` cae en "sin progreso" en lugar de
  // generar una expresión inválida.
  if (!(progress > ANCHO_TRANSICION)) {
    return gradiente([0, COLOR_PENDIENTE], [1, COLOR_PENDIENTE]);
  }
  if (progress >= 1 - ANCHO_TRANSICION) {
    return gradiente([0, COLOR_ENTREGADO], [1, COLOR_ENTREGADO]);
  }
  return gradiente(
    [0, COLOR_ENTREGADO],
    [progress - ANCHO_TRANSICION, COLOR_ENTREGADO],
    [progress + ANCHO_TRANSICION, COLOR_PENDIENTE],
    [1, COLOR_PENDIENTE],
  );
};
