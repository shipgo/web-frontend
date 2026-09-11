import { restclient } from '@config/restclient';
import { API_URLS } from '@constants/apiUrls';
import {
  createCrudApi,
  createReadOnlyApi,
  notImplemented,
} from './base.api';

/**
 * API de Categorías — `/api/categoria` (ENDPOINTS.md §16). CRUD completo.
 * Filtro `NombreFilter { nombre, sort }`.
 */
export const categoriaApi = createCrudApi(API_URLS.CATEGORIA_URL);

/**
 * API de Sexo — `/api/sexo` (catálogo read-only, ENDPOINTS.md §17).
 */
export const sexoApi = createReadOnlyApi(API_URLS.SEXO_URL);

/**
 * API de Tipos de Documento — `/api/tipoDocumento` (catálogo read-only, ENDPOINTS.md §17).
 */
export const tipoDocumentoApi = createReadOnlyApi(API_URLS.TIPO_DOC_URL);

/**
 * API de Calificaciones de Chofer — `/api/calificacionChofer` (ENDPOINTS.md §18).
 * NO existe `/all`. El listado es por página (`/pagina/{pagina}`) o por query
 * (`idViaje` | `nombre` | `apellido` | `calificacion` + `pagina`).
 */
export const calificacionChoferApi = {
  /**
   * `GET /api/calificacionChofer/{id}` — calificaciones de un chofer (`CalificacionChofer[]`).
   * @param {number|string} choferId
   */
  getByChofer: async (choferId) => {
    const response = await restclient.get(
      `${API_URLS.CALIFICACION_CHOFER_URL}/${choferId}`,
    );
    return response.data;
  },

  /**
   * `GET /api/calificacionChofer/pagina/{pagina}` — `Page<CalificacionChofer>` (size 4).
   * @param {number} pagina
   */
  getPagina: async (pagina) => {
    const response = await restclient.get(
      `${API_URLS.CALIFICACION_CHOFER_URL}/pagina/${pagina}`,
    );
    return response.data;
  },

  /**
   * `GET /api/calificacionChofer?{idViaje|nombre|apellido|calificacion}&pagina` — `Page` filtrado.
   * @param {{ idViaje?: number, nombre?: string, apellido?: string, calificacion?: number, pagina?: number }} params
   */
  getFiltrado: async (params = {}) => {
    const response = await restclient.get(API_URLS.CALIFICACION_CHOFER_URL, {
      params,
    });
    return response.data;
  },

  /**
   * `POST /api/calificacionChofer`
   * @param {Object} data - entidad `CalificacionChofer`.
   */
  save: async (data) => {
    const response = await restclient.post(
      API_URLS.CALIFICACION_CHOFER_URL,
      data,
    );
    return response.data;
  },

  /**
   * `PUT /api/calificacionChofer/{id}`
   * @param {number|string} id
   * @param {Object} data
   */
  update: async (id, data) => {
    const response = await restclient.put(
      `${API_URLS.CALIFICACION_CHOFER_URL}/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * `DELETE /api/calificacionChofer/{calificacionChoferId}`
   * @param {number|string} id
   */
  delete: async (id) => {
    const response = await restclient.delete(
      `${API_URLS.CALIFICACION_CHOFER_URL}/${id}`,
    );
    return response.data;
  },
};

/**
 * API de Calificaciones de Ruta — `/api/calificacionRuta` (ENDPOINTS.md §19).
 * El listado es `GET /all` (NO el path base `GET /api/calificacionRuta`).
 */
export const calificacionRutaApi = {
  /**
   * `GET /api/calificacionRuta/all`
   */
  getAll: async () => {
    const response = await restclient.get(
      `${API_URLS.CALIFICACION_RUTA_URL}/all`,
    );
    return response.data;
  },

  /**
   * `GET /api/calificacionRuta/{id}`
   * @param {number|string} id
   */
  getById: async (id) => {
    const response = await restclient.get(
      `${API_URLS.CALIFICACION_RUTA_URL}/${id}`,
    );
    return response.data;
  },

  /**
   * `POST /api/calificacionRuta`
   * @param {Object} data - entidad `CalificacionRuta`.
   */
  save: async (data) => {
    const response = await restclient.post(
      API_URLS.CALIFICACION_RUTA_URL,
      data,
    );
    return response.data;
  },

  /**
   * `PUT /api/calificacionRuta/{id}`
   * @param {number|string} id
   * @param {Object} data
   */
  update: async (id, data) => {
    const response = await restclient.put(
      `${API_URLS.CALIFICACION_RUTA_URL}/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * `DELETE /api/calificacionRuta/{calificacionRutaId}`
   * @param {number|string} id
   */
  delete: async (id) => {
    const response = await restclient.delete(
      `${API_URLS.CALIFICACION_RUTA_URL}/${id}`,
    );
    return response.data;
  },
};

/**
 * API de Huella de Carbono — `/api/huellaCarbono` (ENDPOINTS.md §20).
 * ⚠️ Hoy TODO el controller es público (sin token). No hay `GET /{id}` ni update.
 */
export const huellaCarbonoApi = {
  /**
   * `GET /api/huellaCarbono?fechaInicio&fechaFin` — `HuellaCarbono[]` en el período.
   * @param {{ fechaInicio: string, fechaFin: string }} params  `yyyy-MM-dd'T'HH:mm:ss`.
   */
  getByPeriodo: async (params) => {
    const response = await restclient.get(API_URLS.HUELLA_CARBONO_URL, {
      params,
    });
    return response.data;
  },

  /**
   * `GET /api/huellaCarbono/all` — `HuellaCarbono[]`.
   */
  getAll: async () => {
    const response = await restclient.get(
      `${API_URLS.HUELLA_CARBONO_URL}/all`,
    );
    return response.data;
  },

  /**
   * `GET /api/huellaCarbono/comparar?fechaInicio&fechaFin` — `Double` (% vs período base).
   * @param {{ fechaInicio: string, fechaFin: string }} params
   */
  comparar: async (params) => {
    const response = await restclient.get(
      `${API_URLS.HUELLA_CARBONO_URL}/comparar`,
      { params },
    );
    return response.data;
  },

  /**
   * `POST /api/huellaCarbono`
   * @param {Object} data - entidad `HuellaCarbono`.
   */
  save: async (data) => {
    const response = await restclient.post(
      API_URLS.HUELLA_CARBONO_URL,
      data,
    );
    return response.data;
  },

  /**
   * `DELETE /api/huellaCarbono/{huellaCarbonoId}`
   * @param {number|string} id
   */
  delete: async (id) => {
    const response = await restclient.delete(
      `${API_URLS.HUELLA_CARBONO_URL}/${id}`,
    );
    return response.data;
  },
};

/**
 * API de Notificaciones — `/api/notificaciones` (ENDPOINTS.md §21).
 * El listado es del usuario logueado (`GET /api/notificaciones`, sin `/all`).
 * El update lleva el id en el body, NO en el path. No hay `GET /{id}`.
 */
export const notificacionesApi = {
  /**
   * `GET /api/notificaciones` — `Notificacion[]` del usuario logueado.
   */
  getMias: async () => {
    const response = await restclient.get(API_URLS.NOTIFICACIONES_URL);
    return response.data;
  },

  /**
   * `POST /api/notificaciones`
   * @param {Object} data - entidad `Notificacion`.
   */
  save: async (data) => {
    const response = await restclient.post(API_URLS.NOTIFICACIONES_URL, data);
    return response.data;
  },

  /**
   * `PUT /api/notificaciones` — el id va DENTRO de `data`.
   * @param {Object} data - entidad `Notificacion` con `id`.
   */
  update: async (data) => {
    const response = await restclient.put(API_URLS.NOTIFICACIONES_URL, data);
    return response.data;
  },

  /**
   * `DELETE /api/notificaciones/{id}`
   * @param {number|string} id
   */
  delete: async (id) => {
    const response = await restclient.delete(
      `${API_URLS.NOTIFICACIONES_URL}/${id}`,
    );
    return response.data;
  },
};

/**
 * API de Empresa — `/api/empresa` (ENDPOINTS.md §15).
 * `SHG-BE-022` (done) agregó `GET /api/empresa/mia` — devuelve la empresa del
 * SUPERUSER logueado (`{ id, nombre }`), resuelta server-side. Verificado
 * contra el backend real corriendo en dev (SHG-FE-052): no existe `GET
 * /api/empresa` (sin id) ni un listado — sólo el detalle "mía". `ENDPOINTS.md`
 * §15 quedó desactualizado tras SHG-BE-022 (no se toca acá, es `planning/`).
 */
export const empresaApi = {
  /**
   * `GET /api/empresa/mia` — `EmpresaDTO { id, nombre }` de la empresa del
   * SUPERUSER logueado. Rol `SUPERUSER`.
   */
  getMia: async () => {
    const response = await restclient.get(`${API_URLS.EMPRESA_URL}/mia`);
    return response.data;
  },

  // No existe listado ni `GET /api/empresa/{id}` de propósito general (el
  // modelo es 1 empresa por instalación) — sólo `getMia()` de arriba.
  getAll: notImplemented(
    'SHG-BE-022',
    'GET de empresa (listado) para el panel SUPERUSER — usar getMia()',
  ),
  get: notImplemented(
    'SHG-BE-022',
    'GET de empresa (listado paginado) para el panel SUPERUSER — usar getMia()',
  ),
  getById: notImplemented(
    'SHG-BE-022',
    'GET /api/empresa/{id} (detalle de empresa) — usar getMia()',
  ),

  /**
   * `POST /api/empresa` — crea empresa + sucursal inicial. Devuelve `UserDTO`.
   * @param {{ nombre: string, sucursal: Object }} data  `EmpresaReqDTO`.
   */
  save: async (data) => {
    const response = await restclient.post(API_URLS.EMPRESA_URL, data);
    return response.data;
  },

  /**
   * `PUT /api/empresa/{id}`
   * @param {number|string} id
   * @param {{ nombre: string, sucursal: Object }} data  `EmpresaReqDTO`.
   */
  update: async (id, data) => {
    const response = await restclient.put(
      `${API_URLS.EMPRESA_URL}/${id}`,
      data,
    );
    return response.data;
  },

  /**
   * `DELETE /api/empresa/{id}`
   * @param {number|string} id
   */
  delete: async (id) => {
    const response = await restclient.delete(
      `${API_URLS.EMPRESA_URL}/${id}`,
    );
    return response.data;
  },
};

/**
 * Atajos de catálogos usados por los forms (todos resuelven contra `GET /api/<cat>/all`).
 */
export const catalogsApi = {
  getSexos: () => sexoApi.getAll(),
  getTiposDocumento: () => tipoDocumentoApi.getAll(),
  getCategorias: () => categoriaApi.getAll(),
};
