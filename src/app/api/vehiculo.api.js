import { restclient } from "@config/restclient";
import { API_URLS } from "@constants/apiUrls";
import { createCrudApi } from "./base.api";

/**
 * API de Vehículos
 */
export const vehiculoApi = {
  ...createCrudApi(API_URLS.VEHICULO_URL),

  /**
   * Obtener vehículos disponibles
   */
  getDisponibles: async (params = {}) => {
    const response = await restclient.get(
      `${API_URLS.VEHICULO_URL}/disponibles`,
      { params }
    );
    return response.data;
  },

  /**
   * Obtener vehículos por sucursal
   */
  getBySucursal: async (sucursalId, params = {}) => {
    const response = await restclient.get(
      `${API_URLS.VEHICULO_URL}/sucursal/${sucursalId}`,
      { params }
    );
    return response.data;
  },

  /**
   * Actualizar estado del vehículo
   */
  updateEstado: async (vehiculoId, estado) => {
    const response = await restclient.put(
      `${API_URLS.VEHICULO_URL}/${vehiculoId}/estado`,
      { estado }
    );
    return response.data;
  },
};

/**
 * API de Marcas
 */
export const marcaApi = createCrudApi(API_URLS.MARCA_URL);

/**
 * API de Modelos
 */
export const modeloApi = {
  ...createCrudApi(API_URLS.MODELO_URL),

  /**
   * Obtener modelos por marca
   */
  getByMarca: async (marcaId, params = {}) => {
    const response = await restclient.get(
      `${API_URLS.MODELO_URL}/marca/${marcaId}`,
      { params }
    );
    return response.data;
  },
};

/**
 * API de Tipos de Vehículo
 */
export const tipoVehiculoApi = createCrudApi(API_URLS.TIPO_VEHICULO_URL);

/**
 * API de Combustibles
 */
export const combustibleApi = createCrudApi(API_URLS.COMBUSTIBLE_URL);

/**
 * API de Tipos de Rueda
 */
export const tipoRuedaApi = createCrudApi(API_URLS.TIPO_RUEDA_URL);
