import { useMutation } from "@tanstack/react-query";

import { viajeApi } from "@api";

/**
 * `POST /api/viaje` (ENDPOINTS.md §7) — alta de viaje. `payload` es el
 * `ViajeReqDTO` armado por {@link buildViajeReqDTO} (`../utils`).
 */
export const useCrearViaje = () =>
  useMutation({
    mutationFn: (payload) => viajeApi.save(payload),
  });
