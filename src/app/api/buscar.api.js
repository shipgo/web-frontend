import { restclient } from '@config/restclient';
import { API_URLS } from '@constants/apiUrls';

/**
 * @typedef {Object} ResultadoBusquedaDTO
 * @property {'envio'|'viaje'|'usuario'|'vehiculo'|'sucursal'} tipo
 * @property {number} id
 * @property {string} label
 * @property {string|null} subtitle
 */

/**
 * @typedef {Object} BusquedaResponseDTO  Shape del spotlight (ENDPOINTS.md §24). Las 5 claves
 * SIEMPRE están presentes como array (nunca `null`).
 * @property {ResultadoBusquedaDTO[]} envios
 * @property {ResultadoBusquedaDTO[]} viajes
 * @property {ResultadoBusquedaDTO[]} usuarios
 * @property {ResultadoBusquedaDTO[]} vehiculos
 * @property {ResultadoBusquedaDTO[]} sucursales
 */

/**
 * API de búsqueda unificada del spotlight de navegación — `GET /api/buscar`
 * (ENDPOINTS.md §24 · SHG-BE-045).
 *
 * Sólo SUPERUSER/ADMIN pueden pegarle (403 para el resto) — el caller (spotlight)
 * no debe invocarla si el usuario no es SU/AD.
 */
export const buscarApi = {
  /**
   * @param {{ q: string, limit?: number }} params  `q` con < 2 caracteres trae los 5 buckets
   * vacíos (guard del backend) — el front igual evita pegarle con `q` corto (debounce).
   * @returns {Promise<BusquedaResponseDTO>}
   */
  buscar: async ({ q, limit } = {}) => {
    const response = await restclient.get(API_URLS.BUSCAR_URL, {
      params: { q, limit },
    });
    return response.data;
  },
};
