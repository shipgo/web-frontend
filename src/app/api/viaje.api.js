import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";
import { createCrudApi } from "./base.api";

// API CRUD básico para viajes
const viajeBasicApi = createCrudApi(API_URLS.VIAJE_URL);

/**
 * API de Viajes con métodos adicionales específicos
 */
export const viajeApi = {
  ...viajeBasicApi,

  /**
   * Obtener viajes activos
   */
  getActivos: async (params = {}) => {
    const response = await restclient.get(`${API_URLS.VIAJE_URL}/activos`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtener viajes por estado
   */
  getByEstado: async (estado, params = {}) => {
    const response = await restclient.get(
      `${API_URLS.VIAJE_URL}/estado/${estado}`,
      { params }
    );
    return response.data;
  },

  /**
   * Iniciar viaje
   */
  iniciar: async (viajeId) => {
    const response = await restclient.put(
      `${API_URLS.VIAJE_URL}/${viajeId}/iniciar`
    );
    return response.data;
  },

  /**
   * Finalizar viaje
   */
  finalizar: async (viajeId) => {
    const response = await restclient.put(
      `${API_URLS.VIAJE_URL}/${viajeId}/finalizar`
    );
    return response.data;
  },

  /**
   * Obtener ruta del viaje
   */
  getRuta: async (viajeId) => {
    const response = await restclient.get(
      `${API_URLS.VIAJE_URL}/${viajeId}/ruta`
    );
    return response.data;
  },

  /**
   * Actualizar ubicación del viaje
   */
  updateUbicacion: async (viajeId, ubicacion) => {
    const response = await restclient.put(
      `${API_URLS.VIAJE_URL}/${viajeId}/ubicacion`,
      ubicacion
    );
    return response.data;
  },
};

/**
 * API de Detalles de Recorrido
 */
export const detalleRecorridoApi = createCrudApi(
  API_URLS.DETALLE_RECORRIDO_URL
);
