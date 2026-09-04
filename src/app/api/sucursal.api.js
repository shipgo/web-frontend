import { restclient } from '@config/restclient';
import { API_URLS } from '@constants/apiUrls';
import { createCrudApi } from './base.api';

/**
 * @typedef {Object} SucursalFilter
 * @property {string} [nombre]
 * @property {string} [email]
 * @property {string} [telefono]   Contains sobre `prefijo || telefono`.
 * @property {string} [direccion]  Contains sobre la dirección del punto de entrega.
 * @property {string} [sort]
 */

/**
 * @typedef {Object} SucursalReqDTO
 * @property {string} nombre
 * @property {string} email
 * @property {string} prefijo
 * @property {string} telefono
 * @property {Object} puntoEntrega  PuntoEntregaReqDTO.
 */

/**
 * API de Sucursales — `/api/sucursal` (ENDPOINTS.md §14). Todos los mappings son SUPERUSER-only
 * (salvo `sucursalesRestantes`). No hay concepto de "sucursal activa" ni filtro por provincia
 * (para eso: `getAll()` + filtro client-side).
 */
export const sucursalApi = {
  ...createCrudApi(API_URLS.SUCURSAL_URL),

  /**
   * `GET /api/sucursal/sucursalesRestantes` — `SucursalDTO[]` (SU/AD).
   */
  getSucursalesRestantes: async () => {
    const response = await restclient.get(
      `${API_URLS.SUCURSAL_URL}/sucursalesRestantes`,
    );
    return response.data;
  },
};
