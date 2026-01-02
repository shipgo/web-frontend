import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";
import { createCrudApi } from "./base.api";

/**
 * API de Sucursales
 */
export const sucursalApi = {
  ...createCrudApi(API_URLS.SUCURSAL_URL),

  /**
   * Obtener sucursales activas
   */
  getActivas: async (params = {}) => {
    const response = await restclient.get(`${API_URLS.SUCURSAL_URL}/activas`, {
      params,
    });
    return response.data;
  },

  /**
   * Obtener sucursales por provincia
   */
  getByProvincia: async (provinciaId, params = {}) => {
    const response = await restclient.get(
      `${API_URLS.SUCURSAL_URL}/provincia/${provinciaId}`,
      { params }
    );
    return response.data;
  },
};
