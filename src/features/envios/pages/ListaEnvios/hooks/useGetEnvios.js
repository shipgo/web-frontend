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
  const normalizedParams = {
    page: (paramsOptions.params.page || 1) - 1, // Convertir de 1-indexed (UI) a 0-indexed (backend)
    size: pageLimit,
    ...mapValues(paramsOptions.params.filters, (filter) => filter.values),
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

  return { enviosQuery, refetch, PAGE_LIMIT: pageLimit, ...paramsOptions };
};
