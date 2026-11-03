import { useQuery } from '@tanstack/react-query';

import { trackingApi, viajeApi } from '@api';

/**
 * Trae el viaje (`viajeApi.getById`) y, sólo si está `en_camino`, la última
 * ubicación conocida (`trackingApi.getUltimaUbicacion`) y el historial
 * completo de puntos GPS (`trackingApi.getHistorial`) para el mini-mapa
 * (SHG-QA-010: `ViajeMapa` traza el recorrido, no sólo la última posición).
 *
 * Ninguna de las dos queries de tracking rompe la pantalla si falla (sin GPS
 * todavía, 404, etc.): `retry: false` y el consumidor sólo las usa si `data`
 * está presente.
 */
export const useViajeDetalle = (id) => {
  const viajeQuery = useQuery({
    queryKey: ['viajes', 'detalle', id],
    queryFn: () => viajeApi.getById(id),
    enabled: !!id,
  });

  const estado = viajeQuery.data?.estado;
  const trackingHabilitado = !!id && estado === 'en_camino';

  const ubicacionQuery = useQuery({
    queryKey: ['tracking', 'ultima-ubicacion', id],
    queryFn: () => trackingApi.getUltimaUbicacion(id),
    enabled: trackingHabilitado,
    retry: false,
    staleTime: 30_000,
  });

  const historialQuery = useQuery({
    queryKey: ['tracking', 'historial', id],
    queryFn: () => trackingApi.getHistorial(id),
    enabled: trackingHabilitado,
    retry: false,
    staleTime: 30_000,
  });

  return { viajeQuery, ubicacionQuery, historialQuery };
};
