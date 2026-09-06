import { mapValues } from 'es-toolkit';
import { useQueryClient, useQuery } from '@tanstack/react-query';

import { useParams } from '@hooks/useParams';
import { envioApi } from '@api';

const PAGE_LIMIT = 10;
const EMPTY_RESULTS = [];

/**
 * Hook para obtener envíos con paginación usando la API real (`GET /api/envio`).
 *
 * Los filtros llegan de `ListaEnviosFiltros` como `{ [param]: { label, values } }`
 * y acá se aplanan a los nombres exactos de `EnvioFilter` (`destino`, `search`,
 * `estado`, `fechaDesde`, `fechaHasta` — CONTRACTS.md §4 / SHG-BE-004).
 * @param {number} pageLimit - Cantidad de elementos por página (default: 10)
 */
export const useGetEnvios = (pageLimit = PAGE_LIMIT) => {
  const queryClient = useQueryClient();
  const paramsOptions = useParams();

  // Normalizar parámetros para el backend
  // El backend espera: page (0-indexed), size, y los filtros de EnvioFilter
  const filterParams = mapValues(paramsOptions.params.filters, (filter) => filter.values);

  const normalizedParams = {
    page: (paramsOptions.params.page || 1) - 1, // Convertir de 1-indexed (UI) a 0-indexed (backend)
    size: pageLimit,
    ...filterParams,
  };

  /**
   * Trae hasta `limit` envíos con los filtros actuales aplicados (para exportar a
   * CSV, no sólo la página visible). Ver `useCsvExport`.
   * @param {number} limit
   * @returns {Promise<{ rows: any[], total: number }>}
   */
  const fetchExportRows = async (limit) => {
    const response = await envioApi.get({ ...filterParams, page: 0, size: limit });
    return {
      rows: response?.content ?? EMPTY_RESULTS,
      total: response?.totalElements ?? 0,
    };
  };

  const enviosQuery = useQuery({
    queryFn: async () => {
      const response = await envioApi.get(normalizedParams);
      return {
        total: response?.totalElements || 0,
        results: response?.content || EMPTY_RESULTS,
        totalPages: response?.totalPages || 0,
      };
    },
    queryKey: ['envios', JSON.stringify(normalizedParams)],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ['envios'] });
    enviosQuery.refetch();
  };

  return { enviosQuery, refetch, fetchExportRows, PAGE_LIMIT: pageLimit, ...paramsOptions };
};
