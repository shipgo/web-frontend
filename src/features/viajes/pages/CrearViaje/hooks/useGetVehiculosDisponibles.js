import { useQuery } from "@tanstack/react-query";

import { vehiculoApi } from "@api";

/**
 * `GET /api/vehiculo/disponibles` (SHG-BE-006) — vehículos `disponible` sin
 * ningún viaje "ocupante" que solape `[desde, hasta]`. `desde`/`hasta` son las
 * fechas planificadas cargadas en `SeccionDetalles`; hasta no tenerlas, la
 * query queda `enabled: false` (no tiene sentido pedir disponibilidad sin
 * ventana de fechas).
 * @param {{ desde?: string, hasta?: string, sucursalId?: number, viajeIdExcluido?: number }} params
 */
export const useGetVehiculosDisponibles = ({
  desde,
  hasta,
  sucursalId,
  viajeIdExcluido,
} = {}) =>
  useQuery({
    queryKey: [
      "vehiculos-disponibles",
      desde,
      hasta,
      sucursalId,
      viajeIdExcluido,
    ],
    queryFn: () =>
      vehiculoApi.getDisponibles({ desde, hasta, sucursalId, viajeIdExcluido }),
    enabled: Boolean(desde && hasta),
  });
