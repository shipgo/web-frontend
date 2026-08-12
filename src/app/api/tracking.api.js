import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";

/**
 * API de tracking en tiempo real de viajes
 */
export const trackingApi = {
  /**
   * URL del stream SSE de ubicaciones. Suscripción global (sin viajeIds):
   * el backend filtra automáticamente por sucursal (ADMIN) o empresa (SUPERUSER).
   */
  getStreamUrl: () => `${restclient.defaults.baseURL}${API_URLS.TRACKING_URL}/stream`,

  /**
   * Última ubicación conocida de un viaje.
   */
  getUltimaUbicacion: async (viajeId) => {
    const response = await restclient.get(
      `${API_URLS.TRACKING_URL}/viaje/${viajeId}/last`
    );
    return response.data;
  },

  /**
   * Historial completo de ubicaciones de un viaje.
   */
  getHistorial: async (viajeId) => {
    const response = await restclient.get(
      `${API_URLS.TRACKING_URL}/viaje/${viajeId}/historial`
    );
    return response.data;
  },
};
