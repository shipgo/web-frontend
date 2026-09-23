import { useQuery } from "@tanstack/react-query";

import { sucursalApi } from "@api";

/**
 * Opciones del selector de "sucursal de retiro" (`SHG-FE-079`,
 * `SHG-CONTRACT-012`). Usa `GET /api/sucursal/paraEntrega` (nuevo,
 * `SHG-BE-061`) — **no** `useSucursalesOptions`
 * (`dashboard/pages/Dashboard/hooks/useDashboardData.js`), que pega a
 * `GET /api/sucursal/all` (SUPERUSER-only, otro propósito) ni
 * `sucursalApi.getSucursalesRestantes` (excluye la sucursal propia — pensado
 * para elegir una parada intermedia de un recorrido, no para esto).
 *
 * `enabled` evita la llamada mientras el form está en modo "domicilio" (no
 * hace falta la lista hasta que el usuario elige "retiro en sucursal").
 *
 * @param {{ enabled?: boolean }} [options]
 * @returns {{ options: {value:string,label:string}[], isLoading: boolean, isError: boolean, refetch: Function }}
 */
export const useSucursalesParaEntrega = ({ enabled = true } = {}) => {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["sucursales-para-entrega"],
    queryFn: () => sucursalApi.getParaEntrega(),
    enabled,
    staleTime: 5 * 60_000,
  });

  const options = (data ?? []).map((sucursal) => {
    const puntoEntrega = sucursal.puntoEntrega ?? {};
    const direccion =
      puntoEntrega.nombreCalle || puntoEntrega.numeroCalle
        ? `${puntoEntrega.nombreCalle ?? ""} ${puntoEntrega.numeroCalle ?? ""}`.trim()
        : null;

    return {
      value: String(sucursal.id),
      label: direccion ? `${sucursal.nombre} — ${direccion}` : sucursal.nombre,
    };
  });

  return { options, isLoading, isError, refetch };
};
