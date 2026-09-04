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
};
