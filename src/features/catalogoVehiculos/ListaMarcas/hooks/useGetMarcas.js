import { mapValues } from "es-toolkit";
import { useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";
import { marcaApi } from "../../api/catalogoVehiculos.api";

const EMPTY_RESULTS = [];

/**
 * Hook para obtener marcas paginadas (`GET /api/marca`, `NombreFilter {
 * nombre, sort }` — `ENDPOINTS.md` §11), mismo patrón que
 * `sucursales/ListaSucursales/hooks/useGetSucursales.js`.
 * @param {number} pageLimit
 */
export const useGetMarcas = (pageLimit = 10) => {
  const paramsOptions = useParams();

  const filterParams = mapValues(paramsOptions.params.filters, (filter) => filter.values);

  const normalizedParams = {
    page: (paramsOptions.params.page || 1) - 1, // 0-indexed
    size: pageLimit,
    ...filterParams,
  };

  /**
   * Trae hasta `limit` marcas con los filtros actuales (para exportar a CSV).
   * @param {number} limit
   * @returns {Promise<{ rows: any[], total: number }>}
   */
  const fetchExportRows = async (limit) => {
    const response = await marcaApi.get({ ...filterParams, page: 0, size: limit });
    return {
      rows: response?.content ?? EMPTY_RESULTS,
      total: response?.totalElements ?? 0,
    };
  };

  const {
    isError,
    data: backendData,
    isFetching: isLoading,
    refetch: refetchMarcas,
  } = useQuery({
    queryFn: async () => marcaApi.get(normalizedParams),
    queryKey: ["marcas", JSON.stringify(normalizedParams)],
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
    refetchMarcas,
    fetchExportRows,
    ...paramsOptions,
  };
};
