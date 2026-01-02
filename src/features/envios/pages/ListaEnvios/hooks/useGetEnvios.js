import { mapValues } from "es-toolkit";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useParams } from "@hooks/useParams";
import { envioApi } from "../../../api/envios.api";

/**
 * Hook para obtener envíos con paginación usando la API real
 * @param {number} pageLimit - Cantidad de elementos por página (default: 10)
 */
export const useGetEnvios = (pageLimit = 10) => {
  const queryClient = useQueryClient();
  const paramsOptions = useParams();

  // Normalizar parámetros para el backend
  // El backend espera: page (0-indexed), size, y otros filtros
  const normalizedParams = {
    page: (paramsOptions.params.page || 1) - 1, // Convertir de 1-indexed (UI) a 0-indexed (backend)
    size: pageLimit,
    ...mapValues(paramsOptions.params.filters, (filter) => filter.values),
  };

  const enviosQuery = useQuery({
    queryFn: async () => {
      const response = await envioApi.get(normalizedParams);
      return response;
    },
    queryKey: ["envios", JSON.stringify(normalizedParams)],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ["envios"] });
    enviosQuery.refetch();
  };

  return {
    enviosQuery,
    refetch,
    ...paramsOptions,
  };
};
