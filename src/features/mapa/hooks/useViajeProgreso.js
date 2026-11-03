import { useQuery } from '@tanstack/react-query';

import { trackingApi } from '@api/tracking.api';

/**
 * Progreso de entregas del viaje seleccionado: paradas entregadas/totales y
 * envíos pendientes, desde el snapshot de `SHG-BE-015`
 * (`GET /api/tracking/viaje/{id}/estado`). Sólo tiene sentido mientras el
 * viaje está `en_camino` (mismo alcance que muestra el mapa en vivo).
 *
 * Se refetchea periódicamente porque el progreso puede cambiar por eventos
 * (paradas entregadas) que el stream SSE de ubicación no anuncia — sólo
 * manda `location-update`/`viaje-iniciado`/`viaje-finalizado`.
 */
export const useViajeProgreso = (viajeId) => {
  const query = useQuery({
    queryKey: ['viaje-progreso', viajeId],
    queryFn: () => trackingApi.getEstadoViaje(viajeId),
    enabled: !!viajeId,
    refetchInterval: 20_000,
    retry: false,
  });

  return { progreso: query.data ?? null, ...query };
};
