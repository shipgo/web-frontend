import { useQuery } from "@tanstack/react-query";

import { vehiculoApi } from "@api";

/**
 * `GET /api/vehiculo/disponibles` (SHG-BE-006) — vehículos sin ningún viaje
 * "ocupante" ni mantenimiento que solape `[desde, hasta)`; desde SHG-BE-132 el
 * estado no decide, salvo `fuera_de_servicio`/`en_service` (que igual entran si
 * son el vehículo del viaje `viajeIdExcluido`). `desde`/`hasta` son las
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
