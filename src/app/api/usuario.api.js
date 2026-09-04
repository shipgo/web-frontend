import { restclient } from '@config/restclient';
import { API_URLS } from '@constants/apiUrls';
import { createCrudApi, createReadOnlyApi } from './base.api';

/**
 * @typedef {Object} UserFilter
 * @property {string} [email]
 * @property {string} [username]
 * @property {string} [nombre]     Contains sobre `nombre` OR `apellido` OR `"nombre apellido"`.
 * @property {string} [dni]
 * @property {string} [authority]  Contains sobre el name del rol (ej. `admin`, `superuser`, `CHOFER`).
 * @property {string} [localidad]  Contains sobre nombre de localidad OR provincia.
 * @property {string} [sort]
 */

/**
 * @typedef {Object} UserReqDTO
 * @property {string} username
 * @property {string} nombre
 * @property {string} apellido
 * @property {string} fechaNacimiento
 * @property {string} prefijo
 * @property {string} telefono
 * @property {string} nombreCalle
 * @property {string} numeroCalle
 * @property {string} email
 * @property {number} [sucursalID]
 * @property {string[]} authorities  Ej. `["ROLE_ADMIN"]` (`@NotEmpty`).
 * @property {string} dni
 * @property {number} tipoDocumentoID
 * @property {number} sexoID
 * @property {number} localidadID
 */

const usuarioCrud = createCrudApi(API_URLS.USER_URL);

/**
 * API de Usuarios — `/api/user` (ENDPOINTS.md §2).
 *
 * `get` / `getAll` aceptan {@link UserFilter}. No hay un endpoint de usuarios por
 * rol vía path: filtrar por rol es `getAll({ authority: 'ROLE_CHOFER' })`.
 * El force-reset de credenciales de admin por id no existe — se usa el flujo público
 * `POST /api/user/resetPassword { userEmail }` (ver `auth.store.js`).
 */
export const usuarioApi = {
  ...usuarioCrud,

  /**
   * `GET /api/user/all?authority=ROLE_CHOFER` — choferes de la sucursal / empresa (según rol).
   * El backend hace match `contains` sobre el name del rol, así que el valor canónico
   * `ROLE_CHOFER` matchea igual que `CHOFER`.
   * @param {UserFilter} [params]
   */
  getChoferes: async (params = {}) => {
    const response = await restclient.get(`${API_URLS.USER_URL}/all`, {
      params: { ...params, authority: 'ROLE_CHOFER' },
    });
    return response.data;
  },

  /**
   * `GET /api/user/choferes-disponibles` — choferes sin viaje solapado en `[desde, hasta]`
   * (`UserDTO[]`, ordenados por `apellido, nombre`). SHG-BE-006.
   * `400` si falta `desde`/`hasta` o `hasta <= desde`.
   * @param {import('./vehiculo.api').DisponibilidadParams} params
   */
  getChoferesDisponibles: async (params) => {
    const response = await restclient.get(
      `${API_URLS.USER_URL}/choferes-disponibles`,
      { params },
    );
    return response.data;
  },

  /**
   * `PUT /api/user/updateToken` — registra el token de notificaciones push del usuario logueado.
   * @param {string} token
   */
  updateToken: async (token) => {
    const response = await restclient.put(`${API_URLS.USER_URL}/updateToken`, {
      token,
    });
    return response.data;
  },

  /**
   * `POST /api/files` (multipart, campo `file`) — sube la foto de perfil del usuario logueado.
   * NO existe `POST /api/user/files`.
   * @param {File} file
   */
  uploadProfileFile: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await restclient.post(API_URLS.FILES_URL, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

/**
 * API de Authorities — `/api/authority` (ENDPOINTS.md §3). Catálogo read-only.
 * Es el reemplazo del recurso "rol" (que la API no expone): `getAll()` → `GET /api/authority/all`.
 */
export const authorityApi = createReadOnlyApi(API_URLS.AUTHORITY_URL);
