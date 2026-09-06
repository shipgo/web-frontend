import { restclient } from '@config/restclient';

/**
 * Capa API del dashboard — `GET /api/dashboard/resumen` y `GET /api/dashboard/series`
 * (`SHG-BE-003`, ver `planning/ENDPOINTS.md §23` y `CONTRACTS.md §10`).
 *
 * No hay entrada para `/dashboard` en `@constants/apiUrls` (esa constante vive en
 * `src/app/` y esta tarea está acotada a `src/features/dashboard/**`), así que el
 * path se define acá. `restclient` ya tiene `baseURL: '/api'`.
 *
 * Ambos endpoints son SU/AD (la web es exclusiva de esos roles, `CONTRACTS.md §3`).
 * `desde` y `hasta` (`yyyy-MM-dd`) son obligatorios y el backend exige
 * `hasta > desde` (rechaza rangos de un solo día con 400). `sucursalId` (Long) sólo
 * lo respeta un SUPERUSER; para un ADMIN el backend siempre usa su propia sucursal.
 */

const DASHBOARD_URL = '/dashboard';

/**
 * @typedef {Object} DashboardParams
 * @property {string} desde        `yyyy-MM-dd` (inclusive).
 * @property {string} hasta        `yyyy-MM-dd` (inclusive, > `desde`).
 * @property {number|null} [sucursalId]  Id de sucursal (sólo SUPERUSER).
 */

const toQuery = ({ desde, hasta, sucursalId } = {}) => {
  const params = { desde, hasta };
  if (sucursalId != null && sucursalId !== '') {
    params.sucursalId = sucursalId;
  }
  return params;
};

export const dashboardApi = {
  /**
   * `GET /api/dashboard/resumen` — KPIs agregados (`DashboardResumenDTO`).
   * @param {DashboardParams} params
   */
  getResumen: async (params) => {
    const response = await restclient.get(`${DASHBOARD_URL}/resumen`, {
      params: toQuery(params),
    });
    return response.data;
  },

  /**
   * `GET /api/dashboard/series` — series temporales para los charts (`DashboardSeriesDTO`).
   * @param {DashboardParams} params
   */
  getSeries: async (params) => {
    const response = await restclient.get(`${DASHBOARD_URL}/series`, {
      params: toQuery(params),
    });
    return response.data;
  },
};
