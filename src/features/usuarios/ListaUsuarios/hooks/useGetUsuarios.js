import { mapValues } from "es-toolkit";
import { useQueryClient, useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";
import { useOperatingContext } from "@contexts/operatingContext";
import { usuarioApi } from "../../api/usuarios.api";

const PAGE_LIMIT = 10;

const paginateClientSide = (items, page, size) => {
  const start = (page - 1) * size;
  return items.slice(start, start + size);
};

/**
 * Hook para obtener usuarios con paginación usando la API real.
 *
 * **Gap de backend documentado (SHG-FE-052):** `UserFilter` (`GET /api/user`)
 * no expone ningún param de sucursal para que un SUPERUSER acote el listado
 * (a diferencia de `EnvioFilter.sucursal`) — un `sucursalId`/`sucursal` extra
 * es simplemente ignorado por Spring. Mismo patrón que `useGetViajes`:
 * mientras no exista soporte backend, con una sucursal operativa activa
 * pedimos `GET /api/user/all` (mismo filtro, sin paginar), filtramos por
 * `usuario.sucursal.id` y paginamos client-side para que `total` quede
 * consistente. Sin selección (o ADMIN, que no ve el selector) el
 * comportamiento es el de siempre: 100% server-side.
 * @param {number} pageLimit - Cantidad de elementos por página
 */
export const useGetUsuarios = (pageLimit = PAGE_LIMIT) => {
  const queryClient = useQueryClient();
  const paramsOptions = useParams();
  const { isSuperUser, activeSucursalId } = useOperatingContext();

  const filterParams = mapValues(paramsOptions.params.filters, (filter) => filter.values);
  const page = paramsOptions.params.page || 1;
  const scopedBySucursal = isSuperUser && activeSucursalId != null;

  // Normalizar parámetros para el backend
  const normalizedParams = {
    page: page - 1, // Convertir de 1-indexed (UI) a 0-indexed (backend)
    size: pageLimit,
    ...filterParams,
  };

  const fetchScoped = async (filters) => {
    const all = await usuarioApi.getAll(filters);
    return (all ?? []).filter((usuario) => usuario.sucursal?.id === activeSucursalId);
  };

  /**
   * Trae hasta `limit` usuarios con los filtros actuales (para exportar a CSV).
   * @param {number} limit
   * @returns {Promise<{ rows: any[], total: number }>}
   */
  const fetchExportRows = async (limit) => {
    if (scopedBySucursal) {
      const filtered = await fetchScoped(filterParams);
      return { rows: filtered.slice(0, limit), total: filtered.length };
    }
    const response = await usuarioApi.get({ ...filterParams, page: 0, size: limit });
    return {
      rows: response?.content ?? [],
      total: response?.totalElements ?? 0,
    };
  };

  const usuariosQuery = useQuery({
    queryFn: async () => {
      if (scopedBySucursal) {
        const filtered = await fetchScoped(filterParams);
        return {
          total: filtered.length,
          results: paginateClientSide(filtered, page, pageLimit),
        };
      }

      const response = await usuarioApi.get(normalizedParams);
      return {
        total: response?.totalElements || 0,
        results: response?.content || [],
      };
    },
    queryKey: ["usuarios", JSON.stringify(normalizedParams), scopedBySucursal, activeSucursalId],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ["usuarios"] });
    usuariosQuery.refetch();
  };

  return { usuariosQuery, refetch, fetchExportRows, PAGE_LIMIT: pageLimit, ...paramsOptions };
};
