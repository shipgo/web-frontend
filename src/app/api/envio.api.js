import { restclient } from '@config/restclient';
import { API_URLS } from '@constants/apiUrls';
import { createCrudApi } from './base.api';

/**
 * @typedef {Object} EnvioFilter
 * @property {string} [destino]     Match parcial contra la dirección de destino.
 * @property {string} [search]      Case/acento-insensible contra nombre/apellido/codigoSeguimiento.
 * @property {string|string[]} [estado]  Valor(es) canónico(s) → `estado IN (...)` (param repetido).
 * @property {string} [fechaDesde]  `yyyy-MM-dd`, límite inferior inclusive (fecha de alta).
 * @property {string} [fechaHasta]  `yyyy-MM-dd`, límite superior inclusive.
 * @property {number} [sucursal]    Id de sucursal de origen (solo SUPERUSER).
 * @property {string} [sort]        `campo:asc` / `campo:desc`.
 */

/**
 * @typedef {Object} DetalleEnvioReqDTO
 * @property {number} categoriaID
 * @property {string} [descripcion]
 * @property {number} peso
 */

/**
 * @typedef {Object} EnvioReqDTO
 * @property {string} nombre
 * @property {string} apellido
 * @property {string} emailRemitente
 * @property {string} emailReceptor
 * @property {string} prefijo
 * @property {string} telefono
 * @property {Object} destino               PuntoEntregaDTO (`@NotNull @Valid`).
 * @property {DetalleEnvioReqDTO[]} detalleEnvios  `@NotEmpty`.
 */

const envioCrud = createCrudApi(API_URLS.ENVIO_URL);

/**
 * API de Envíos — `/api/envio` (ENDPOINTS.md §4).
 */
export const envioApi = {
  ...envioCrud,

  /**
   * `GET /api/envio/viaje/{idViaje}` — envíos asociados a un viaje.
   * @param {number|string} idViaje
   */
  getByViaje: async (idViaje) => {
    const response = await restclient.get(
      `${API_URLS.ENVIO_URL}/viaje/${idViaje}`,
    );
    return response.data;
  },

  /**
   * `GET /api/envio/paraViaje` — envíos `en_sucursal` agrupados por localidad
   * destino (`LocalidadConEnviosDTO[]`), para armar un viaje. Ver SHG-BE-020.
   */
  getParaViaje: async () => {
    const response = await restclient.get(`${API_URLS.ENVIO_URL}/paraViaje`);
    return response.data;
  },

  /**
   * `PUT /api/envio/{id}/entregar` — marca el envío como `entregado` (SU/AD/CH).
   *
   * Body **obligatorio** desde `SHG-BE-042` (antes no se mandaba nada): `dniReceptor`
   * es requerido (`@NotEmpty`, sin validación de formato); `palabraEntregaIngresada`
   * es opcional del lado del form (el operador no sabe de antemano si el envío tiene
   * `palabraEntrega` generada — el backend la ignora si no aplica, o responde `400`
   * `{ code: "delivery_word_mismatch" }` si no coincide). `latitud`/`longitud`
   * opcionales (`SHG-BE-043`, sin uso desde la web todavía).
   *
   * @param {number|string} id
   * @param {{ dniReceptor: string, palabraEntregaIngresada?: string, latitud?: number, longitud?: number }} body
   *   `EntregaEnvioReqDTO`.
   */
  entregar: async (id, body) => {
    const response = await restclient.put(
      `${API_URLS.ENVIO_URL}/${id}/entregar`,
      body,
    );
    return response.data;
  },

  /**
   * `PUT /api/envio/{id}/falloEntrega` — marca el envío como `rechazado` (SU/AD/CH).
   * @param {number|string} id
   * @param {{ motivo: string }} body  `FalloEntregaEnvioReqDTO` (`motivo` `@NotEmpty`).
   */
  falloEntrega: async (id, body) => {
    const response = await restclient.put(
      `${API_URLS.ENVIO_URL}/${id}/falloEntrega`,
      body,
    );
    return response.data;
  },
};

/**
 * API de Detalles de Envío — `/api/detalleEnvio` (ENDPOINTS.md §5).
 * No hay listado paginado estándar (`/paginado/{pagina}` es legacy size 2).
 */
export const detalleEnvioApi = {
  /**
   * `GET /api/detalleEnvio/{detalleEnvioId}`
   * @param {number|string} id
   */
  getById: async (id) => {
    const response = await restclient.get(
      `${API_URLS.DETALLE_ENVIO_URL}/${id}`,
    );
    return response.data;
  },

  /**
   * `GET /api/detalleEnvio/all`
   */
  getAll: async () => {
    const response = await restclient.get(`${API_URLS.DETALLE_ENVIO_URL}/all`);
    return response.data;
  },

  /**
   * `GET /api/detalleEnvio?envio={id}` — detalles de un envío.
   * @param {number|string} envioId
   */
  getByEnvio: async (envioId) => {
    const response = await restclient.get(API_URLS.DETALLE_ENVIO_URL, {
      params: { envio: envioId },
    });
    return response.data;
  },

  /**
   * `POST /api/detalleEnvio`
   * @param {Object} data - entidad `DetalleEnvio`.
   */
  save: async (data) => {
    const response = await restclient.post(API_URLS.DETALLE_ENVIO_URL, data);
    return response.data;
  },

  /**
   * `PUT /api/detalleEnvio/{detalleEnvioId}`
   * ⚠️ El backend tiene el `@PathVariable` mal escrito: mandar el id también en el body.
   * @param {number|string} id
   * @param {Object} data - entidad `DetalleEnvio`.
   */
  update: async (id, data) => {
    const response = await restclient.put(
      `${API_URLS.DETALLE_ENVIO_URL}/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * `DELETE /api/detalleEnvio/{detalleEnvioId}`
   * @param {number|string} id
   */
  delete: async (id) => {
    const response = await restclient.delete(
      `${API_URLS.DETALLE_ENVIO_URL}/${id}`,
    );
    return response.data;
  },

  /**
   * `GET /api/detalleEnvio/cantidadPorTipo` — `ReporteNombreCantidad[]` (dashboard por categoría).
   */
  getCantidadPorTipo: async () => {
    const response = await restclient.get(
      `${API_URLS.DETALLE_ENVIO_URL}/cantidadPorTipo`,
    );
    return response.data;
  },
};

/**
 * API de Puntos de Entrega — `/api/puntoEntrega` (ENDPOINTS.md §6).
 * El listado es legacy: query `localidad` | `provincia` | `nombre` + `pagina` (size 4),
 * NO `page`/`size`. No hay `/all`.
 */
export const puntoEntregaApi = {
  /**
   * `GET /api/puntoEntrega/{puntoId}` (AD/CH/CA — no SU).
   * @param {number|string} id
   */
  getById: async (id) => {
    const response = await restclient.get(
      `${API_URLS.PUNTO_ENTREGA_URL}/${id}`,
    );
    return response.data;
  },

  /**
   * `GET /api/puntoEntrega?{localidad|provincia|nombre}&pagina` — `Page<PuntoEntrega>` (legacy).
   * @param {{ localidad?: string, provincia?: string, nombre?: string, pagina?: number }} params
   */
  getPaginado: async (params = {}) => {
    const response = await restclient.get(API_URLS.PUNTO_ENTREGA_URL, {
      params,
    });
    return response.data;
  },

  /**
   * `POST /api/puntoEntrega`
   * @param {Object} data - entidad `PuntoEntrega`.
   */
  save: async (data) => {
    const response = await restclient.post(API_URLS.PUNTO_ENTREGA_URL, data);
    return response.data;
  },

  /**
   * `PUT /api/puntoEntrega/{puntoId}`
   * @param {number|string} id
   * @param {Object} data
   */
  update: async (id, data) => {
    const response = await restclient.put(
      `${API_URLS.PUNTO_ENTREGA_URL}/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * `DELETE /api/puntoEntrega/{puntoId}`
   * @param {number|string} id
   */
  delete: async (id) => {
    const response = await restclient.delete(
      `${API_URLS.PUNTO_ENTREGA_URL}/${id}`,
    );
    return response.data;
  },
};
