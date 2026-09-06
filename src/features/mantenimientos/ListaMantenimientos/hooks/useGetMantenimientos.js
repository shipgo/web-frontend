import { mapValues } from "es-toolkit";
import { useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";
import { mantenimientoApi } from "../../api/mantenimientos.api";

const EMPTY_RESULTS = [];

/**
 * Mantenimientos paginados (`GET /api/mantenimiento`, `Page<MantenimientoDTO>`).
 *
 * Los filtros llegan de `ListaMantenimientosFiltros` como
 * `{ [param]: { label, values } }` y se aplanan a los nombres exactos de
 * `MantenimientoFilter` (`nombre`, `patente` — ver `CONTRACTS.md §4`).
 *
 * @param {number} pageLimit - Cantidad de elementos por página.
 */
export const useGetMantenimientos = (pageLimit = 10) => {
  const paramsOptions = useParams();

  const filterParams = mapValues(paramsOptions.params.filters, (filter) => filter.values);

  const normalizedParams = {
    page: (paramsOptions.params.page || 1) - 1, // 1-indexed (UI) -> 0-indexed (backend)
    size: pageLimit,
    ...filterParams,
  };

  /**
   * Trae hasta `limit` mantenimientos con los filtros actuales (para exportar a CSV).
   * @param {number} limit
   * @returns {Promise<{ rows: any[], total: number }>}
   */
  const fetchExportRows = async (limit) => {
    const response = await mantenimientoApi.get({ ...filterParams, page: 0, size: limit });
    return {
      rows: response?.content ?? EMPTY_RESULTS,
      total: response?.totalElements ?? 0,
    };
  };

  const {
    isError,
    data: backendData,
    isFetching: isLoading,
    refetch: refetchMantenimientos,
  } = useQuery({
    queryFn: () => mantenimientoApi.get(normalizedParams),
    queryKey: ["mantenimientos", JSON.stringify(normalizedParams)],
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
    refetchMantenimientos,
    fetchExportRows,
    ...paramsOptions,
  };
};
