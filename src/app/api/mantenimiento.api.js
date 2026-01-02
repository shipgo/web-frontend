import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";
import { createCrudApi } from "./base.api";

/**
 * API de Mantenimientos
 */
export const mantenimientoApi = {
  ...createCrudApi(API_URLS.MANTENIMIENTO_URL),

  /**
   * Obtener mantenimientos por vehículo
   */
  getByVehiculo: async (vehiculoId, params = {}) => {
    const response = await restclient.get(
      `${API_URLS.MANTENIMIENTO_URL}/vehiculo/${vehiculoId}`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener mantenimientos pendientes
   */
  getPendientes: async (params = {}) => {
    const response = await restclient.get(
      `${API_URLS.MANTENIMIENTO_URL}/pendientes`,
      { params }
    );
    return response.data;
  },

  /**
   * Completar mantenimiento
   */
  completar: async (mantenimientoId, data) => {
    const response = await restclient.put(
      `${API_URLS.MANTENIMIENTO_URL}/${mantenimientoId}/completar`,
      data
    );
    return response.data;
  },
};

/**
 * API de Tipos de Mantenimiento
 */
export const tipoMantenimientoApi = createCrudApi(
  API_URLS.TIPO_MANTENIMIENTO_URL
);
