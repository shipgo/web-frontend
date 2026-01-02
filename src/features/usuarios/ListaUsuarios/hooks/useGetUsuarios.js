import { mapValues } from "es-toolkit";
import { useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";
import { usuarioApi } from "../../api/usuarios.api";

/**
 * Hook para obtener usuarios con paginación usando la API real
 * @param {number} pageLimit - Cantidad de elementos por página
 */
export const useGetUsuarios = (pageLimit = 10) => {
  const paramsOptions = useParams();

  // Normalizar parámetros para el backend
  const normalizedParams = {
    page: paramsOptions.params.page || 1,
    size: pageLimit,
    ...mapValues(paramsOptions.params.filters, (filter) => filter.values),
  };

  const {
    isError,
    data: backendData,
    isFetching: isLoading,
    refetch: refetchUsuarios,
  } = useQuery({
    queryFn: async () => {
      const response = await usuarioApi.get(normalizedParams);
      return response;
    },
    queryKey: ["usuarios", JSON.stringify(normalizedParams)],
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
    refetchUsuarios,
    ...paramsOptions,
  };
};
