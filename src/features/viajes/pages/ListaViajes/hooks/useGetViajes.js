import { mapValues } from "es-toolkit";
import { useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";
import { viajeApi } from "../../../api/viajes.api";

/**
 * Hook para obtener viajes con paginación usando la API real
 * @param {number} pageLimit - Cantidad de elementos por página
 */
export const useGetViajes = (pageLimit = 10) => {
  const paramsOptions = useParams();

  // Normalizar parámetros para el backend
  // El backend espera: page (0-indexed), size, y otros filtros
  const normalizedParams = {
    page: (paramsOptions.params.page || 1) - 1, // Convertir de 1-indexed (UI) a 0-indexed (backend)
    size: pageLimit,
    ...mapValues(paramsOptions.params.filters, (filter) => filter.values),
  };

  const {
    isError,
    data: backendData,
    isFetching: isLoading,
    refetch: refetchViajes,
  } = useQuery({
    queryFn: async () => {
      const response = await viajeApi.get(normalizedParams);
      return response;
    },
    queryKey: ["viajes", JSON.stringify(normalizedParams)],
  });

  // Transformar respuesta del backend al formato esperado por el componente
  const data = {
    total: backendData?.totalElements || 0,
    results: backendData?.content || [],
    totalPages: backendData?.totalPages || 0,
  };

  return {
    data,
    isError,
    isLoading,
    refetchViajes,
    ...paramsOptions,
  };
};
