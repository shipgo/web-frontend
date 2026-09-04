import { restclient } from '@config/restclient';
import { API_URLS } from '@constants/apiUrls';
import { createCrudApi, createReadOnlyApi } from './base.api';

/**
 * @typedef {Object} VehiculoFilter
 * @property {string} [tipoVehiculo]
 * @property {string} [modelo]
 * @property {string} [combustible]
 * @property {string} [tipoRueda]
 * @property {string} [patente]
 * @property {number} [anioCompra]
 * @property {number} [cantidadRuedas]
 * @property {number} [pesoMinimo]
 * @property {number} [pesoMaximo]
 * @property {number} [peso]
 * @property {number} [consumoPromedio]
 * @property {string} [sort]
 */

/**
 * @typedef {Object} DisponibilidadParams  Ventana de disponibilidad (SHG-BE-006).
 * @property {string} desde   ISO date-time — **obligatorio**.
 * @property {string} hasta   ISO date-time — **obligatorio**.
 * @property {number} [sucursalId]       Sólo lo usa SUPERUSER (ADMIN lo ignora).
 * @property {number} [viajeIdExcluido]  Al editar un viaje: su id, para no contarlo como ocupante.
 */

/**
 * @typedef {Object} VehiculoReqDTO
 * @property {number} tipoVehiculoID
 * @property {number} modeloID
 * @property {number} combustibleID
 * @property {number} tipoRuedaID
 * @property {string} patente
 * @property {number} anioCompra
 * @property {number} cantidadRuedas
 * @property {number} kilometraje
 * @property {number} pesoMaximo
 * @property {number} consumoPromedio
 */

/**
 * API de Vehículos — `/api/vehiculo` (ENDPOINTS.md §10).
 * No hay filtro por sucursal ni setter de estado: el backend limita por sucursal
 * a ADMIN y maneja el `estado` del vehículo server-side.
 */
export const vehiculoApi = {
  ...createCrudApi(API_URLS.VEHICULO_URL),

  /**
   * `GET /api/vehiculo/disponibles` — vehículos `disponible` sin viaje solapado
   * en `[desde, hasta]` (`VehiculoDTO[]`, ordenados por patente). SHG-BE-006.
   * `400` si falta `desde`/`hasta` o `hasta <= desde`.
   * @param {DisponibilidadParams} params
   */
  getDisponibles: async (params) => {
    const response = await restclient.get(
      `${API_URLS.VEHICULO_URL}/disponibles`,
      { params },
    );
    return response.data;
  },
};

/**
 * API de Marcas — `/api/marca` (ENDPOINTS.md §11). Filtro `NombreFilter { nombre, sort }`.
 */
export const marcaApi = createCrudApi(API_URLS.MARCA_URL);

/**
 * @typedef {Object} ModeloFilter
 * @property {string} [nombre]      Contains.
 * @property {string} [marca]       Contains sobre `marca.nombre`.
 * @property {number} [marcaId]     Id de marca, exact match (SHG-BE-007).
 * @property {number} [anio]
 * @property {number} [anioInicio]
 * @property {number} [anioFin]
 * @property {string} [sort]
 */

/**
 * API de Modelos — `/api/modelo` (ENDPOINTS.md §12).
 * Para "modelos de una marca" usar `getAll({ marcaId })` (SHG-BE-007), NO un path dedicado.
 */
export const modeloApi = createCrudApi(API_URLS.MODELO_URL);

/**
 * API de Tipos de Vehículo — `/api/tipoVehiculo` (catálogo read-only, ENDPOINTS.md §17).
 */
export const tipoVehiculoApi = createReadOnlyApi(API_URLS.TIPO_VEHICULO_URL);

/**
 * API de Combustibles — `/api/combustible` (catálogo read-only, ENDPOINTS.md §17).
 */
export const combustibleApi = createReadOnlyApi(API_URLS.COMBUSTIBLE_URL);

/**
 * API de Tipos de Rueda — `/api/tipoRueda` (catálogo read-only, ENDPOINTS.md §17).
 */
export const tipoRuedaApi = createReadOnlyApi(API_URLS.TIPO_RUEDA_URL);
