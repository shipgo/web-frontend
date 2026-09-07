import { restclient } from '@config/restclient';
import { API_URLS } from '@constants/apiUrls';

/**
 * Capa API del portal CUSTOMER.
 *
 * Fuente de verdad: `planning/CONTRACTS.md §7` (CONTRACT-007) + backend
 * `SHG-BE-002` (registro + verificación + "mis envíos") y `SHG-BE-024`
 * (`GET /api/customer/me`).
 *
 * @typedef {Object} RegisterReqDTO
 * @property {string} email
 * @property {string} password   Mínimo 8 caracteres (validado también server-side).
 * @property {string} nombre
 * @property {string} apellido
 * @property {string} telefono
 *
 * @typedef {Object} CustomerMeDTO
 * @property {string} email
 * @property {string} nombre
 * @property {string} apellido
 * @property {string} telefono
 * @property {boolean} emailVerificado
 */

export const registroApi = {
  /**
   * `POST /api/register` — público. Crea SIEMPRE un `ROLE_CUSTOMER` (nunca acepta
   * rol). La cuenta queda deshabilitada hasta verificar el email.
   *
   * `201 { codigo: 201, mensaje }`. Errores `400 { statusCode, message }`
   * (email inválido / password corta / campos vacíos / email ya registrado).
   *
   * @param {RegisterReqDTO} body
   * @returns {Promise<{ codigo?: number, mensaje?: string }>}
   */
  register: async (body) => {
    const { data } = await restclient.post(API_URLS.REGISTER_URL, body);
    return data;
  },

  /**
   * `GET /api/register/verify?token=...` — público. Activa la cuenta.
   * `200 { codigo, mensaje }`, `404` token inexistente, `400` token expirado (24 h).
   *
   * @param {string} token
   * @returns {Promise<{ codigo?: number, mensaje?: string }>}
   */
  verify: async (token) => {
    const { data } = await restclient.get(API_URLS.REGISTER_VERIFY_URL, {
      params: { token },
    });
    return data;
  },
};

export const portalApi = {
  /**
   * `GET /api/customer/me` — sólo `ROLE_CUSTOMER`. Se resuelve server-side desde
   * la sesión (sin params). `401` anónimo, `403` para SU/AD/CH/CA.
   *
   * @returns {Promise<CustomerMeDTO>}
   */
  me: async () => {
    const { data } = await restclient.get(API_URLS.CUSTOMER_ME_URL);
    return data;
  },

  /**
   * `GET /api/envio/mios` — sólo `ROLE_CUSTOMER` (ADMIN/SUPER/CHOFER → `403`).
   * Paginado, `Page<EnvioDTO>` (mismo shape que `GET /api/envio`). Devuelve los
   * envíos donde el email del customer == `emailRemitente` OR `emailReceptor`.
   * Orden default `id` desc.
   *
   * @param {{ page?: number, size?: number }} [params]  `page` 0-indexed.
   * @returns {Promise<import('@api/base.api').Page<Object>>}
   */
  misEnvios: async (params = {}) => {
    const { data } = await restclient.get(API_URLS.ENVIO_MIOS_URL, { params });
    return data;
  },
};
