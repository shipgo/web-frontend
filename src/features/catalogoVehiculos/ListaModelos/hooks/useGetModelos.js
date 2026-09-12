import { mapValues } from "es-toolkit";
import { useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";
import { modeloApi } from "../../api/catalogoVehiculos.api";

const EMPTY_RESULTS = [];

/**
 * Hook para obtener modelos paginados (`GET /api/modelo`, `ModeloFilter {
 * nombre, marca, marcaId, anio, anioInicio, anioFin, sort }` —
 * `ENDPOINTS.md` §12). `marcaId` es exact match (`SHG-BE-007`); mismo patrón
 * que `useGetSucursales`/`useGetMarcas`.
 * @param {number} pageLimit
 */
export const useGetModelos = (pageLimit = 10) => {
  const paramsOptions = useParams();

  const normalizedParams = {
    page: (paramsOptions.params.page || 1) - 1, // 0-indexed
    size: pageLimit,
    ...mapValues(paramsOptions.params.filters, (filter) => filter.values),
  };

  const {
    isError,
    data: backendData,
    isFetching: isLoading,
    refetch: refetchModelos,
  } = useQuery({
    queryFn: async () => modeloApi.get(normalizedParams),
    queryKey: ["modelos", JSON.stringify(normalizedParams)],
  });

  const data = {
    total: backendData?.totalElements || 0,
    results: backendData?.content || EMPTY_RESULTS,
    totalPages: backendData?.totalPages || 0,
  };

  return {
    data,
    isError,
    isLoading,
    refetchModelos,
    ...paramsOptions,
  };
};
