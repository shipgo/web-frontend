import { mapValues } from "es-toolkit";
import { useQueryClient, useQuery } from "@tanstack/react-query";

import { useParams } from "@hooks/useParams";
import { useOperatingContext } from "@contexts/operatingContext";
import { viajeApi } from "../../../api/viajes.api";

const PAGE_LIMIT = 10;

/**
 * Recorta client-side una lista ya filtrada a la página pedida (1-indexed).
 * Sólo se usa en el modo "scoped por sucursal" de abajo.
 */
const paginateClientSide = (items, page, size) => {
  const start = (page - 1) * size;
  return items.slice(start, start + size);
};

/**
 * Hook para obtener viajes con paginación usando la API real.
 *
 * **Gap de backend documentado (SHG-FE-052):** a diferencia de `EnvioFilter`
 * (que tiene `sucursal`, SHG-BE-004), `ViajeFilter` (`GET /api/viaje`) NO
 * expone ningún param de sucursal — verificado en vivo contra el backend real:
 * `GET /api/viaje?sucursalId=<otra>` devuelve exactamente lo mismo que sin el
 * param (Spring ignora los params que `@ModelAttribute` no puede bindear). Un
 * SUPERUSER siempre ve **toda la empresa** en este listado sin poder acotar a
 * una sola sucursal desde el servidor.
 *
 * Mientras no exista ese soporte (se documenta para abrir la tarea de
 * backend, análoga a `EnvioFilter.sucursal`), cuando el SUPERUSER eligió una
 * sucursal operativa en el header hacemos el scoping 100% **client-side**:
 * pedimos `GET /api/viaje/all` (mismos filtros, sin paginar), filtramos por
 * `viaje.sucursal.id` y paginamos nosotros el resultado — así `total`/
 * `totalPages` quedan consistentes con lo que se muestra (a costa de traer
 * más filas de las que se ven). Sin selección (o para ADMIN, que ni ve el
 * selector) el comportamiento es exactamente el de antes: paginado 100%
 * server-side.
 * @param {number} pageLimit - Cantidad de elementos por página
 */
export const useGetViajes = (pageLimit = PAGE_LIMIT) => {
  const queryClient = useQueryClient();
  const paramsOptions = useParams();
  const { isSuperUser, activeSucursalId } = useOperatingContext();

  // Normalizar parámetros para el backend
  // El backend espera: page (0-indexed), size, y otros filtros
  const filterParams = mapValues(paramsOptions.params.filters, (filter) => filter.values);
  const page = paramsOptions.params.page || 1;
  const scopedBySucursal = isSuperUser && activeSucursalId != null;

  const normalizedParams = {
    page: page - 1, // Convertir de 1-indexed (UI) a 0-indexed (backend)
    size: pageLimit,
    ...filterParams,
  };

  const fetchScoped = async (filters) => {
    const all = await viajeApi.getAll(filters);
    return (all ?? []).filter((viaje) => viaje.sucursal?.id === activeSucursalId);
  };

  /**
   * Trae hasta `limit` viajes con los filtros actuales (para exportar a CSV).
   * @param {number} limit
   * @returns {Promise<{ rows: any[], total: number }>}
   */
  const fetchExportRows = async (limit) => {
    if (scopedBySucursal) {
      const filtered = await fetchScoped(filterParams);
      return { rows: filtered.slice(0, limit), total: filtered.length };
    }
    const response = await viajeApi.get({ ...filterParams, page: 0, size: limit });
    return {
      rows: response?.content ?? [],
      total: response?.totalElements ?? 0,
    };
  };

  const viajesQuery = useQuery({
    queryFn: async () => {
      if (scopedBySucursal) {
        const filtered = await fetchScoped(filterParams);
        return {
          total: filtered.length,
          results: paginateClientSide(filtered, page, pageLimit),
        };
      }

      const response = await viajeApi.get(normalizedParams);
      return {
        total: response?.totalElements || 0,
        results: response?.content || [],
      };
    },
    queryKey: ["viajes", JSON.stringify(normalizedParams), scopedBySucursal, activeSucursalId],
  });

  const refetch = () => {
    queryClient.removeQueries({ queryKey: ["viajes"] });
    viajesQuery.refetch();
  };

  return { viajesQuery, refetch, fetchExportRows, PAGE_LIMIT: pageLimit, ...paramsOptions };
};
