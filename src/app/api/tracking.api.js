import { restclient } from '@config/restclient';
import { API_URLS } from '@constants/apiUrls';

/**
 * @typedef {Object} UbicacionViajeReqDTO
 * @property {number} viajeId
 * @property {number} latitud
 * @property {number} longitud
 * @property {number} [velocidad]
 */

/**
 * @typedef {Object} ViajeEstadoDTO Snapshot de progreso/ETA de un viaje `en_camino` (SHG-BE-015).
 * @property {number} viajeId
 * @property {string} estado Siempre `en_camino` en una respuesta 200.
 * @property {Array<{id: number, orden: number, estado: string, coords: {lat: number, lng: number}|null, envios: Array<{id: number, codigoSeguimiento: string}>}>} recorridos
 *   Ordenados por `orden`. `estado` es el valor canónico de `ESTADO_RECORRIDO` (`@domain/estados`).
 * @property {number} paradasEntregadas
 * @property {number} paradasTotales
 * @property {number} enviosPendientes Envíos que todavía no están `entregado`/`rechazado`.
 * @property {{lat: number, lng: number, fecha: string}|null} ultimaUbicacion
 * @property {{lat: number, lng: number}|null} origen Coords de la sucursal de salida.
 */

/**
 * API de tracking en tiempo real de viajes — `/api/tracking` (ENDPOINTS.md §9).
 */
export const trackingApi = {
  /**
   * `GET /api/tracking/stream` — URL del stream SSE (`text/event-stream`).
   * Suscripción global (sin `viajeIds`): el backend filtra por sucursal (ADMIN)
   * o empresa (SUPERUSER). Para acotar: agregar `?viajeIds=<id>&viajeIds=<id>`.
   * ⚠️ Hoy sólo autentica por cookie (token por query param → SHG-BE-015).
   */
  getStreamUrl: () =>
    `${restclient.defaults.baseURL}${API_URLS.TRACKING_URL}/stream`,

  /**
   * `POST /api/tracking/location` — reporta la posición del viaje (rol CHOFER; solo mobile).
   * @param {UbicacionViajeReqDTO} data
   */
  postLocation: async (data) => {
    const response = await restclient.post(
      `${API_URLS.TRACKING_URL}/location`,
      data,
    );
    return response.data;
  },

  /**
   * `GET /api/tracking/viaje/{viajeId}/last` — última ubicación conocida (`UbicacionViajeDTO`).
   * @param {number|string} viajeId
   */
  getUltimaUbicacion: async (viajeId) => {
    const response = await restclient.get(
      `${API_URLS.TRACKING_URL}/viaje/${viajeId}/last`,
    );
    return response.data;
  },

  /**
   * `GET /api/tracking/viaje/{viajeId}/historial` — historial de ubicaciones (`UbicacionViajeDTO[]`).
   * @param {number|string} viajeId
   */
  getHistorial: async (viajeId) => {
    const response = await restclient.get(
      `${API_URLS.TRACKING_URL}/viaje/${viajeId}/historial`,
    );
    return response.data;
  },

  /**
   * `GET /api/tracking/viaje/{viajeId}/estado` — snapshot de progreso/ETA para
   * el mapa en vivo (`ViajeEstadoDTO`, SHG-BE-015). `409` si el viaje no está
   * `en_camino`, `404` si no existe (o está fuera del alcance del usuario).
   * @param {number|string} viajeId
   * @returns {Promise<ViajeEstadoDTO>}
   */
  getEstadoViaje: async (viajeId) => {
    const response = await restclient.get(
      `${API_URLS.TRACKING_URL}/viaje/${viajeId}/estado`,
    );
    return response.data;
  },
};
