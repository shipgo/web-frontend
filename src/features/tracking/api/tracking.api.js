import { restclient } from '@config/restclient';
import { API_URLS } from '@constants/apiUrls';
import { captchaHeader } from '@config/captcha';

/**
 * Capa API del tracking público (guest) — `GET /api/public/tracking/{codigo}`.
 *
 * Fuente de verdad: `planning/CONTRACTS.md §7` (CONTRACT-007) + backend
 * `PublicTrackingController` / `PublicTrackingDTO` (`SHG-BE-001`).
 *
 * Endpoint SIN auth (whitelist `/api/public/**` en `WebSecurityConfig`) y
 * rate-limited por IP: al superar el umbral el backend responde `429` con
 * `{ statusCode: 429, message }` y cabecera `Retry-After`.
 *
 * También exige captcha (SHG-BE-032 / SHG-FE-043): sin un token vigente de
 * Cloudflare Turnstile en el header `X-Captcha-Token` responde `400`
 * `{ statusCode, message, code: "captcha_invalid" }` (ver `@config/captcha`).
 *
 * @typedef {Object} PublicTrackingHistorialItem
 * @property {string} estado  Valor canónico snake_case (`@domain/estados`).
 * @property {string} fecha   ISO `LocalDateTime`.
 *
 * @typedef {Object} PublicTrackingDestino
 * @property {string} localidad
 * @property {string} provincia
 *
 * @typedef {Object} PublicTrackingUbicacion
 * @property {number} lat     Coordenada redondeada (~1 km de resolución).
 * @property {number} lng
 * @property {string} fecha   ISO `LocalDateTime`.
 *
 * @typedef {Object} PublicTrackingDTO
 * @property {string} codigoSeguimiento
 * @property {string} estado                              Valor canónico snake_case.
 * @property {string} estadoLabel                         Label ya resuelto por el backend.
 * @property {PublicTrackingHistorialItem[]} historial
 * @property {PublicTrackingDestino} [destino]            Sólo localidad + provincia (sin dirección exacta).
 * @property {string} [fechaEstimada]                     ISO `LocalDate`, sólo si el envío ya está en un viaje.
 * @property {PublicTrackingUbicacion} [ultimaUbicacionAprox]  Sólo si el envío está `en_camino`.
 * @property {string} [palabraEntrega]  Palabra de entrega (`SHG-BE-042`) — ausente si `null`
 *   (`@JsonInclude(NON_NULL)`). El destinatario se la dice al chofer al recibir el envío. Secreto
 *   remitente↔destinatario↔chofer: NUNCA se expone en `EnvioDTO` (panel operador).
 *
 * Campos OMITIDOS a propósito por privacidad (el DTO del backend ya los filtra):
 * nombre / apellido / email / teléfono del remitente y del receptor, y la
 * dirección exacta del destino. El front NO agrega nada por fuera de este shape.
 */

export const publicTrackingApi = {
  /**
   * `GET /api/public/tracking/{codigo}`.
   * @param {string} codigo Código de seguimiento (se envía tal cual, ya normalizado por el caller).
   * @param {string} captchaToken Token vigente de Cloudflare Turnstile (`useCaptcha`).
   * @returns {Promise<PublicTrackingDTO>}
   */
  track: async (codigo, captchaToken) => {
    const { data } = await restclient.get(
      `${API_URLS.PUBLIC_TRACKING_URL}/${encodeURIComponent(codigo)}`,
      { headers: captchaHeader(captchaToken) },
    );
    return data;
  },
};
