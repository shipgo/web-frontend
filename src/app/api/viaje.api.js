import { restclient } from '@config/restclient';
import { API_URLS } from '@constants/apiUrls';
import { createCrudApi } from './base.api';

/**
 * @typedef {Object} ViajeFilter
 * @property {string} [search]      Case/acento-insensible contra patente y nombre/apellido de chofer(es).
 * @property {string} [nombreChofer]  Deprecado → usar `search`.
 * @property {string|string[]} [estado]  Valor(es) canónico(s) de viaje (param repetido).
 * @property {string} [fechaDesde]  `LocalDateTime` ISO, inclusive, sobre `fechaHoraInicioPlanificada`.
 * @property {string} [fechaHasta]  `LocalDateTime` ISO, inclusive.
 * @property {string} [sort]        `campo:asc` / `campo:desc` (default `id:asc`).
 */

/**
 * @typedef {Object} EnvioPuntoEntregaReqDTO
 * @property {number[]} enviosID
 * @property {number} [puntoEntregaID]      XOR con `sucursalDestinoID`.
 * @property {number} [sucursalDestinoID]   XOR con `puntoEntregaID`.
 */

/**
 * @typedef {Object} ViajeReqDTO
 * @property {Object} viaje  `{ fechaHoraInicioPlanificada, fechaHoraFinPlanificada, vehiculoID, choferesID[] }`.
 *   Las fechas reales (`fechaHoraInicio` / `fechaHoraFin`) son nullable (SHG-BE-021): el cliente
 *   sólo manda las 2 planificadas. `responsable` y `sucursal` los resuelve el backend.
 * @property {EnvioPuntoEntregaReqDTO[]} enviosPuntoEntrega  `@NotEmpty`. El `orden` de los
 *   recorridos = el orden de este array.
 */

const viajeCrud = createCrudApi(API_URLS.VIAJE_URL);

/**
 * API de Viajes — `/api/viaje` (ENDPOINTS.md §7).
 *
 * `getAll` / `get` aceptan {@link ViajeFilter}. Los quick-filters del front
 * ("Atrasados", "Salen hoy", "En curso") se componen con `estado` + `fechaDesde`/`fechaHasta`
 * (ver CONTRACTS.md §4) — NO hay endpoints dedicados.
 */
export const viajeApi = {
  ...viajeCrud,

  /**
   * `GET /api/viaje/chofer/{id}` — viajes de un chofer (`ViajeDTO[]`).
   * @param {number|string} choferId
   */
  getByChofer: async (choferId) => {
    const response = await restclient.get(
      `${API_URLS.VIAJE_URL}/chofer/${choferId}`,
    );
    return response.data;
  },

  /**
   * `PUT /api/viaje/{id}/finalizar` — estado → `finalizado` (SU/AD/CH).
   * @param {number|string} id
   */
  finalizar: async (id) => {
    const response = await restclient.put(
      `${API_URLS.VIAJE_URL}/${id}/finalizar`,
    );
    return response.data;
  },

  /**
   * `PUT /api/viaje/{id}/reanudar` — `con_problemas` → `en_camino` (SU/AD/CH), sin body.
   * `409` si el viaje no está `con_problemas` o el chofer ya tiene otro `en_camino`. SHG-BE-097.
   * @param {number|string} id
   */
  reanudar: async (id) => {
    const response = await restclient.put(
      `${API_URLS.VIAJE_URL}/${id}/reanudar`,
    );
    return response.data;
  },

  /**
   * `PUT /api/viaje/{id}/cancelar` — estado → `cancelado` + rollback (SU/AD). SHG-BE-009.
   * `409` si el viaje no está en un estado cancelable (`creado`/`planificado`/`en_proceso_de_carga`).
   * @param {number|string} id
   * @param {{ motivo?: string }} [body]  `CancelarViajeReqDTO` — body opcional.
   */
  cancelar: async (id, body) => {
    const response = await restclient.put(
      `${API_URLS.VIAJE_URL}/${id}/cancelar`,
      body ?? {},
    );
    return response.data;
  },

  /**
   * `PUT /api/viaje/{viajeId}/recorrido/{recorridoId}/entregarSucursal` (SU/CH).
   * @param {number|string} viajeId
   * @param {number|string} recorridoId
   */
  entregarSucursal: async (viajeId, recorridoId) => {
    const response = await restclient.put(
      `${API_URLS.VIAJE_URL}/${viajeId}/recorrido/${recorridoId}/entregarSucursal`,
    );
    return response.data;
  },

  /**
   * `POST /api/viaje/{id}/chofer/aceptar` — el chofer acepta el viaje (CH/SU/AD).
   * @param {number|string} id
   */
  aceptarChofer: async (id) => {
    const response = await restclient.post(
      `${API_URLS.VIAJE_URL}/${id}/chofer/aceptar`,
    );
    return response.data;
  },

  /**
   * `POST /api/viaje/{id}/rechazar` — el chofer rechaza el viaje (CH/SU/AD).
   * @param {number|string} id
   */
  rechazar: async (id) => {
    const response = await restclient.post(
      `${API_URLS.VIAJE_URL}/${id}/rechazar`,
    );
    return response.data;
  },
};

