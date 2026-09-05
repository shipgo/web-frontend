import { useQuery } from '@tanstack/react-query';

import { trackingApi, viajeApi } from '@api';

/**
 * Trae el viaje (`viajeApi.getById`) y, sólo si está `en_camino`, la última
 * ubicación conocida (`trackingApi.getUltimaUbicacion`) para el mini-mapa.
 *
 * La query de ubicación no rompe la pantalla si falla (sin GPS todavía, 404,
 * etc.): `retry: false` y el consumidor sólo la usa si `data` está presente.
 */
export const useViajeDetalle = (id) => {
  const viajeQuery = useQuery({
    queryKey: ['viajes', 'detalle', id],
    queryFn: () => viajeApi.getById(id),
    enabled: !!id,
  });

  const estado = viajeQuery.data?.estado;

  const ubicacionQuery = useQuery({
    queryKey: ['tracking', 'ultima-ubicacion', id],
    queryFn: () => trackingApi.getUltimaUbicacion(id),
    enabled: !!id && estado === 'en_camino',
    retry: false,
    staleTime: 30_000,
  });

  return { viajeQuery, ubicacionQuery };
};
