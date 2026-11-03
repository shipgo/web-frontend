import { useQuery } from "@tanstack/react-query";

import { usuarioApi } from "@api";

/**
 * `GET /api/user/choferes-disponibles` (SHG-BE-006) — choferes sin ningún
 * viaje "ocupante" (como chofer único o dentro de `choferes`) que solape
 * `[desde, hasta]`. Mismos params que {@link useGetVehiculosDisponibles}.
 * @param {{ desde?: string, hasta?: string, sucursalId?: number, viajeIdExcluido?: number }} params
 */
export const useChoferesDisponibles = ({
  desde,
  hasta,
  sucursalId,
  viajeIdExcluido,
} = {}) =>
  useQuery({
    queryKey: [
      "choferes-disponibles",
      desde,
      hasta,
      sucursalId,
      viajeIdExcluido,
    ],
    queryFn: () =>
      usuarioApi.getChoferesDisponibles({
        desde,
        hasta,
        sucursalId,
        viajeIdExcluido,
      }),
    enabled: Boolean(desde && hasta),
  });
