import { mapValues } from "es-toolkit";
import { useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";
import { vehiculoApi } from "../../api/vehiculos.api";

const EMPTY_RESULTS = [];

/**
 * Hook para obtener vehículos con paginación usando la API real
 * @param {number} pageLimit - Cantidad de elementos por página
 */
export const useGetVehiculos = (pageLimit = 10) => {
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
    refetch: refetchVehiculos,
  } = useQuery({
    queryFn: async () => {
      const response = await vehiculoApi.get(normalizedParams);
      return response;
    },
    queryKey: ["vehiculos", JSON.stringify(normalizedParams)],
  });

  // Transformar respuesta del backend
  const data = {
    total: backendData?.totalElements || 0,
    results: backendData?.content || EMPTY_RESULTS,
    totalPages: backendData?.totalPages || 0,
  };

  return {
    data,
    isError,
    isLoading,
    refetchVehiculos,
    ...paramsOptions,
  };
};
