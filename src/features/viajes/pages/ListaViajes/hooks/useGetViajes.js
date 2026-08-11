import { mapValues } from "es-toolkit";
import { useQueryClient, useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";
import { viajeApi } from "../../../api/viajes.api";

const PAGE_LIMIT = 10;

/**
 * Hook para obtener viajes con paginación usando la API real
 * @param {number} pageLimit - Cantidad de elementos por página
 */
export const useGetViajes = (pageLimit = PAGE_LIMIT) => {
  const queryClient = useQueryClient();
  const paramsOptions = useParams();

  // Normalizar parámetros para el backend
  // El backend espera: page (0-indexed), size, y otros filtros
  const normalizedParams = {
    page: (paramsOptions.params.page || 1) - 1, // Convertir de 1-indexed (UI) a 0-indexed (backend)
    size: pageLimit,
    ...mapValues(paramsOptions.params.filters, (filter) => filter.values),
  };

  const viajesQuery = useQuery({
    queryFn: async () => {
      const response = await viajeApi.get(normalizedParams);
      return {
        total: response?.totalElements || 0,
        results: response?.content || [],
      };
    },
    queryKey: ["viajes", JSON.stringify(normalizedParams)],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ["viajes"] });
    viajesQuery.refetch();
  };

  return { viajesQuery, refetch, PAGE_LIMIT: pageLimit, ...paramsOptions };
};
