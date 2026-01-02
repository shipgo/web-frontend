import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";
import { createCrudApi } from "./base.api";

// API CRUD básico para envíos
const envioBasicApi = createCrudApi(API_URLS.ENVIO_URL);

/**
 * API de Envíos con métodos adicionales específicos
 */
export const envioApi = {
  ...envioBasicApi,

  /**
   * Obtener envíos pendientes
   */
  getPendientes: async (params = {}) => {
    const response = await restclient.get(`${API_URLS.ENVIO_URL}/pendientes`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtener envíos por estado
   */
  getByEstado: async (estado, params = {}) => {
    const response = await restclient.get(
      `${API_URLS.ENVIO_URL}/estado/${estado}`,
      { params }
    );
    return response.data;
  },

  /**
   * Asignar envío a un viaje
   */
  asignarViaje: async (envioId, viajeId) => {
    const response = await restclient.put(
      `${API_URLS.ENVIO_URL}/${envioId}/viaje/${viajeId}`
    );
    return response.data;
  },

  /**
   * Actualizar estado del envío
   */
  updateEstado: async (envioId, estado) => {
    const response = await restclient.put(
      `${API_URLS.ENVIO_URL}/${envioId}/estado`,
      { estado }
    );
    return response.data;
  },
};

/**
 * API de Detalles de Envío
 */
export const detalleEnvioApi = createCrudApi(API_URLS.DETALLE_ENVIO_URL);

/**
 * API de Puntos de Entrega
 */
export const puntoEntregaApi = createCrudApi(API_URLS.PUNTO_ENTREGA_URL);
