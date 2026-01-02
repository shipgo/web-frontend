import { mapValues } from "es-toolkit";
import { useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";
import { mantenimientoApi } from "../../api/mantenimientos.api";

/**
 * Hook para obtener mantenimientos con paginación usando la API real
 * @param {number} pageLimit - Cantidad de elementos por página
 */
export const useGetMantenimientos = (pageLimit = 10) => {
  const paramsOptions = useParams();

  // Normalizar parámetros para el backend
  const normalizedParams = {
    page: (paramsOptions.params.page || 1) - 1, // 0-indexed
    size: pageLimit,
    ...mapValues(paramsOptions.params.filters, (filter) => filter.values),
  };

  const {
    isError,
    data: backendData,
    isFetching: isLoading,
    refetch: refetchMantenimientos,
  } = useQuery({
    queryFn: async () => {
      const response = await mantenimientoApi.get(normalizedParams);
      return response;
    },
    queryKey: ["mantenimientos", JSON.stringify(normalizedParams)],
  });

  // Transformar respuesta del backend
  const data = {
    total: backendData?.totalElements || 0,
    results: backendData?.content || [],
    totalPages: backendData?.totalPages || 0,
  };

  return {
    data,
    isError,
    isLoading,
    refetchMantenimientos,
    ...paramsOptions,
  };
};
