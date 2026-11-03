import { restclient } from '@config/restclient';
import { API_URLS } from '@constants/apiUrls';
import { createReadOnlyApi } from './base.api';

/**
 * API de Provincias — `/api/provincias` (catálogo read-only, ENDPOINTS.md §17).
 * `getAll` acepta `ProvinciaFilter { nombre, sort }`.
 */
export const provinciaApi = createReadOnlyApi(API_URLS.PROVINCIAS_URL);

/**
 * API de Localidades — `/api/localidades` (catálogo read-only, ENDPOINTS.md §17).
 * No hay endpoint de búsqueda por texto libre: buscar por nombre = `getAll({ nombre })`
 * (`LocalidadFilter { nombre, provincia, sort }`).
 */
export const localidadApi = {
  ...createReadOnlyApi(API_URLS.LOCALIDADES_URL),

  /**
   * `GET /api/localidades/provincia/{provinciaID}` — localidades de una provincia (`LocalidadDTO[]`).
   * @param {number|string} provinciaId
   */
  getByProvincia: async (provinciaId) => {
    const response = await restclient.get(
      `${API_URLS.LOCALIDADES_URL}/provincia/${provinciaId}`,
    );
    return response.data;
  },
};

/**
 * API consolidada de ubicaciones (fachada usada por los forms).
 */
export const locationApi = {
  getProvincias: () => provinciaApi.getAll(),
  getLocalidadesByProvincia: (provinciaId) =>
    localidadApi.getByProvincia(provinciaId),
  /** Buscar localidades por nombre → `GET /api/localidades/all?nombre=<q>`. */
  searchLocalidades: (nombre) => localidadApi.getAll({ nombre }),
};
