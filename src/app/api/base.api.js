import { restclient } from '@config/restclient';

/**
 * @typedef {Object} PageParams
 * @property {number} [page]  Página 0-indexed (Spring `Page`).
 * @property {number} [size]  Tamaño de página.
 * @property {string} [sort]  Orden en formato `campo:asc` / `campo:desc`
 *   (custom del backend, `utils/SortUtils.parseSort` — NO el `campo,asc` de Spring).
 */

/**
 * @template T
 * @typedef {Object} Page
 * @property {T[]} content
 * @property {number} totalElements
 * @property {number} totalPages
 * @property {number} number   Página actual (0-indexed).
 * @property {number} size
 */

/**
 * @typedef {Object} ResponseDTO
 * @property {number} [codigo]
 * @property {string} [mensaje]
 */

/**
 * CRUD genérico para las entidades que exponen el set completo de operaciones
 * (`GET /{id}`, `GET /all`, `GET` paginado, `POST`, `PUT /{id}`, `DELETE /{id}`).
 *
 * Usar SOLO para entidades cuyo controller realmente expone esos 6 mappings
 * (ver `ENDPOINTS.md`). Para catálogos read-only usar {@link createReadOnlyApi}.
 *
 * @param {string} baseUrl - URL base del endpoint sin `/api` (ej: '/envio').
 */
export const createCrudApi = (baseUrl) => ({
  /**
   * `GET {baseUrl}/all` — lista completa sin paginar.
   * @param {Object} [params] - Query params del filtro de la entidad.
   */
  getAll: async (params = {}) => {
    const response = await restclient.get(`${baseUrl}/all`, { params });
    return response.data;
  },

  /**
   * `GET {baseUrl}` — lista paginada (`Page<DTO>`).
   * @param {PageParams & Object} [params] - `page`, `size`, `sort` + filtros.
   */
  get: async (params = {}) => {
    const response = await restclient.get(baseUrl, { params });
    return response.data;
  },

  /**
   * `GET {baseUrl}/{id}` — detalle por id.
   * @param {number|string} id
   */
  getById: async (id) => {
    const response = await restclient.get(`${baseUrl}/${id}`);
    return response.data;
  },

  /**
   * `POST {baseUrl}` — alta.
   * @param {Object} data - ReqDTO de la entidad.
   */
  save: async (data) => {
    const response = await restclient.post(baseUrl, data);
    return response.data;
  },

  /**
   * `PUT {baseUrl}/{id}` — edición.
   * @param {number|string} id
   * @param {Object} data - ReqDTO de la entidad.
   */
  update: async (id, data) => {
    const response = await restclient.put(`${baseUrl}/${id}`, data);
    return response.data;
  },

  /**
   * `DELETE {baseUrl}/{id}` — baja.
   * @param {number|string} id
   * @returns {Promise<ResponseDTO>}
   */
  delete: async (id) => {
    const response = await restclient.delete(`${baseUrl}/${id}`);
    return response.data;
  },
});

/**
 * API para catálogos de solo lectura (ENDPOINTS.md §17 y afines): solo exponen
 * `GET {baseUrl}/{id}` y `GET {baseUrl}/all`. No tienen listado paginado ni
 * `POST` / `PUT` / `DELETE`.
 *
 * @param {string} baseUrl
 */
export const createReadOnlyApi = (baseUrl) => ({
  /**
   * `GET {baseUrl}/all`
   * @param {Object} [params] - Filtro (ej. `{ nombre, sort }`) si el catálogo lo soporta.
   */
  getAll: async (params = {}) => {
    const response = await restclient.get(`${baseUrl}/all`, { params });
    return response.data;
  },

  /**
   * `GET {baseUrl}/{id}`
   * @param {number|string} id
   */
  getById: async (id) => {
    const response = await restclient.get(`${baseUrl}/${id}`);
    return response.data;
  },
});

/**
 * Marca un método de la capa `api/` que necesita un endpoint de backend que
 * TODAVÍA NO EXISTE en `ENDPOINTS.md`. Devuelve una función que, al invocarse,
 * lanza un error explícito (en vez de pegarle a una ruta fantasma que da 404/403
 * silencioso). Ver `CONTRACTS.md §6`.
 *
 * @param {string} beTask - Tarea de backend que lo destraba (ej: 'SHG-BE-022').
 * @param {string} detalle - Qué haría el método / endpoint esperado.
 * @returns {() => never}
 */
export const notImplemented = (beTask, detalle) => () => {
  throw new Error(
    `[api] Método no disponible: requiere el endpoint de ${beTask} — ${detalle}. ` +
      'Todavía no existe en ENDPOINTS.md; no llamar hasta que la tarea backend esté done.',
  );
};
