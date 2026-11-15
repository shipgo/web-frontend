import { useQuery } from '@tanstack/react-query';

import { trackingApi } from '@api/tracking.api';
import { coordenadasDeHistorial } from '@utils/trackGps';

const REFETCH_MS = 30_000;

/**
 * Recorrido GPS real del viaje seleccionado como `[[lng, lat], ...]`.
 *
 * Comparte queryKey con `useViajeDetalle` (misma caché cruda); la
 * transformación va en `select`. Refetch periódico porque el SSE no envía el
 * historial. Si falla (403/404/sin GPS) devuelve `[]` sin error visible.
 */
export const useHistorialViaje = (viajeId) => {
  const query = useQuery({
    queryKey: ['tracking', 'historial', viajeId],
    queryFn: () => trackingApi.getHistorial(viajeId),
    enabled: !!viajeId,
    retry: false,
    staleTime: REFETCH_MS,
    refetchInterval: REFETCH_MS,
    select: coordenadasDeHistorial,
  });
  return { coordenadas: query.data ?? [], isLoading: query.isLoading };
};
