import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";
import { createCrudApi } from "./base.api";

/**
 * API de Provincias
 */
export const provinciaApi = {
  ...createCrudApi(API_URLS.PROVINCIAS_URL),

  /**
   * Obtener todas las provincias (sin paginación)
   */
  getAll: async () => {
    const response = await restclient.get(API_URLS.PROVINCIAS_URL + "/all");
    return response.data;
  },
};

/**
 * API de Localidades
 */
export const localidadApi = {
  ...createCrudApi(API_URLS.LOCALIDADES_URL),

  /**
   * Obtener localidades por provincia
   */
  getByProvincia: async (provinciaId, params = {}) => {
    const response = await restclient.get(
      `${API_URLS.LOCALIDADES_URL}/provincia/${provinciaId}`,
      { params }
    );
    return response.data;
  },

  /**
   * Buscar localidades por nombre
   */
  search: async (query, params = {}) => {
    const response = await restclient.get(
      `${API_URLS.LOCALIDADES_URL}/search`,
      {
        params: { q: query, ...params },
      }
    );
    return response.data;
  },
};

/**
 * API consolidada de ubicaciones
 */
export const locationApi = {
  getProvincias: () => provinciaApi.getAll(),
  getLocalidadesByProvincia: (provinciaId) =>
    localidadApi.getByProvincia(provinciaId),
  searchLocalidades: (query) => localidadApi.search(query),
};
