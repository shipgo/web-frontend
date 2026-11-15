/** Umbral por defecto (metros) para descartar ruido del GPS al simplificar. */
export const UMBRAL_RUIDO_METROS = 10;

const RADIO_TIERRA_M = 6371000;
const aRad = (g) => (g * Math.PI) / 180;

/** Distancia en metros entre dos coordenadas (haversine). */
export const distanciaMetros = (lat1, lng1, lat2, lng2) => {
  const dLat = aRad(lat2 - lat1);
  const dLng = aRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(aRad(lat1)) * Math.cos(aRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * RADIO_TIERRA_M * Math.asin(Math.min(1, Math.sqrt(a)));
};

const esCoord = (v) => typeof v === 'number' && Number.isFinite(v);

/**
 * Ordena el historial de tracking (`UbicacionViajeDTO[]`) por `orden` y descarta
 * puntos sin coordenadas válidas (null/NaN). Devuelve `{ lat, lng, orden }[]`.
 */
export const puntosDeHistorial = (historial) =>
  (Array.isArray(historial) ? historial : [])
    .map((p) => ({ lat: p?.latitud ?? p?.lat, lng: p?.longitud ?? p?.lng, orden: p?.orden }))
    .filter((p) => esCoord(p.lat) && esCoord(p.lng))
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0));

/**
 * Descarta puntos a menos de `umbralMetros` del último conservado. Siempre
 * conserva el primero y el último.
 */
export const simplificarTrack = (puntos, umbralMetros = UMBRAL_RUIDO_METROS) => {
  if (puntos.length <= 2) return puntos;
  const resultado = [puntos[0]];
  for (let i = 1; i < puntos.length - 1; i += 1) {
    const ultimo = resultado[resultado.length - 1];
    const p = puntos[i];
    if (distanciaMetros(ultimo.lat, ultimo.lng, p.lat, p.lng) >= umbralMetros) resultado.push(p);
  }
  resultado.push(puntos[puntos.length - 1]);
  return resultado;
};

/** Historial crudo -> `[[lng, lat], ...]` ordenado, válido y sin ruido. */
export const coordenadasDeHistorial = (historial, umbralMetros) =>
  simplificarTrack(puntosDeHistorial(historial), umbralMetros).map((p) => [p.lng, p.lat]);
