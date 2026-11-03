import { useQuery } from "@tanstack/react-query";

import { vehiculoApi } from "@api";

/**
 * `GET /api/vehiculo/enMantenimiento` (SHG-BE-108) — vehículos que `disponibles`
 * excluye por un mantenimiento solapado con `[desde, hasta)`, para mostrarlos
 * deshabilitados y con el motivo. Misma ventana que `useGetVehiculosDisponibles`
 * (la query key incluye `desde`/`hasta`, así que cambiar las fechas vuelve a
 * consultar); sin ventana queda `enabled: false`.
 * @param {{ desde?: string, hasta?: string, sucursalId?: number }} params
 */
export const useGetVehiculosEnMantenimiento = ({
  desde,
  hasta,
  sucursalId,
} = {}) =>
  useQuery({
    queryKey: ["vehiculos-en-mantenimiento", desde, hasta, sucursalId],
    queryFn: () => vehiculoApi.getEnMantenimiento({ desde, hasta, sucursalId }),
    enabled: Boolean(desde && hasta),
  });
