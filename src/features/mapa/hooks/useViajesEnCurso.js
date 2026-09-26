import { useQuery } from '@tanstack/react-query';

import { ESTADOS_VIAJE_CON_TRACKING } from '@domain/estados';
import { viajeApi } from '@api/viaje.api';

/**
 * Viajes "trackeables" (`en_camino` + `con_problemas`, ver
 * `ESTADOS_VIAJE_CON_TRACKING`) visibles para el usuario actual. El backend ya
 * restringe el resultado a la sucursal (ADMIN) o empresa (SUPERUSER) del
 * usuario.
 *
 * `con_problemas` se sumó en SHG-FE-096 para que "Monitorear" (menú de fila de
 * `ListaViajesTabla`) y `/mapa?viaje=:id` funcionen también para un viaje con
 * incidente reportado: sigue despachado, no es un estado terminal
 * (`ESTADOS_TERMINALES.viaje`), así que tiene sentido seguir viéndolo en el
 * mapa aunque el stream SSE de `/api/tracking/stream` (sólo `en_camino`,
 * `useTrackingStream`) no le mande actualizaciones en vivo — la última
 * ubicación conocida sigue resolviéndose vía `GET /api/tracking/viaje/{id}/last`
 * (`useViajesConUbicacion`).
 *
 * El array se manda como param repetido (`estado=en_camino&estado=con_problemas`,
 * CONTRACTS.md §4) gracias al `paramsSerializer: { indexes: null }` global de
 * `restclient`.
 *
 * @param {number} refetchTrigger - al cambiar, se refetchea el listado
 * (útil para sincronizar con eventos "viaje-iniciado" del stream SSE)
 */
export const useViajesEnCurso = (refetchTrigger = 0) => {
  const query = useQuery({
    queryKey: ['viajes-en-curso', refetchTrigger],
    queryFn: () => viajeApi.getAll({ estado: ESTADOS_VIAJE_CON_TRACKING }),
  });

  return { viajes: query.data ?? [], ...query };
};
