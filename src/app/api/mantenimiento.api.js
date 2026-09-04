import { API_URLS } from '@constants/apiUrls';
import { createCrudApi, createReadOnlyApi } from './base.api';

/**
 * @typedef {Object} MantenimientoFilter
 * @property {string} [nombre]   Contains sobre `nombreMecanico` / `apellidoMecanico` / concatenación.
 * @property {string} [patente]  Contains sobre la patente del vehículo.
 * @property {string} [sort]     `campo:asc` / `campo:desc`.
 */

/**
 * @typedef {Object} MantenimientoReqDTO
 * @property {string} nombreMecanico
 * @property {string} apellidoMecanico
 * @property {string} [descripcion]
 * @property {number} tipoMantenimientoID
 * @property {number} vehiculoID
 * @property {string} [fechaHoraMantenimiento]
 * @property {string} [fechaHoraRegistro]
 */

/**
 * API de Mantenimientos — `/api/mantenimiento` (ENDPOINTS.md §13).
 *
 * `Mantenimiento` es un registro histórico: NO tiene estado / ciclo de vida
 * (no hay "pendiente" ni "completar"). Editar = `update(id, data)`.
 * Para "mantenimientos de un vehículo" usar `getAll({ patente })` o `get({ patente })`.
 */
export const mantenimientoApi = createCrudApi(API_URLS.MANTENIMIENTO_URL);

/**
 * API de Tipos de Mantenimiento — `/api/tipoMantenimiento` (catálogo read-only, ENDPOINTS.md §17).
 */
export const tipoMantenimientoApi = createReadOnlyApi(
  API_URLS.TIPO_MANTENIMIENTO_URL,
);
