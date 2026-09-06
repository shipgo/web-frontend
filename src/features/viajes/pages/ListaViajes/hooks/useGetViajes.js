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
  const filterParams = mapValues(paramsOptions.params.filters, (filter) => filter.values);

  const normalizedParams = {
    page: (paramsOptions.params.page || 1) - 1, // Convertir de 1-indexed (UI) a 0-indexed (backend)
    size: pageLimit,
    ...filterParams,
  };

  /**
   * Trae hasta `limit` viajes con los filtros actuales (para exportar a CSV).
   * @param {number} limit
   * @returns {Promise<{ rows: any[], total: number }>}
   */
  const fetchExportRows = async (limit) => {
    const response = await viajeApi.get({ ...filterParams, page: 0, size: limit });
    return {
      rows: response?.content ?? [],
      total: response?.totalElements ?? 0,
    };
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

  return { viajesQuery, refetch, fetchExportRows, PAGE_LIMIT: pageLimit, ...paramsOptions };
};
