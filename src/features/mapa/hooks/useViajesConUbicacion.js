import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';

import { trackingApi } from '@api/tracking.api';
import { useTracking } from '../contexts/tracking';

const getChoferNombre = (chofer) =>
  chofer ? `${chofer.nombre ?? ''} ${chofer.apellido ?? ''}`.trim() : 'Sin chofer asignado';

/**
 * Viajes en curso (`useTracking`) enriquecidos con su última ubicación
 * conocida: prioriza el stream SSE en vivo (`locationsByViajeId`) y cae a
 * `GET /api/tracking/viaje/{id}/last` para los que todavía no emitieron
 * ningún ping por ese canal (recién abierto el mapa, o el chofer no reportó
 * ubicación desde que se generó el viaje).
 *
 * Devuelve, por cada viaje: `patente`, `choferNombre`, `sucursalNombre`,
 * `currentLocation` (`[lng, lat]` o `null` si no hay ninguna ubicación
 * todavía) y `ultimaActualizacion` (timestamp de esa ubicación).
 */
export const useViajesConUbicacion = () => {
  const { viajesActivos, locationsByViajeId, status, isLoading } = useTracking();

  const viajesSinUbicacionLive = viajesActivos.filter((viaje) => !locationsByViajeId[viaje.id]);
  const ubicacionesIniciales = useQueries({
    queries: viajesSinUbicacionLive.map((viaje) => ({
      queryKey: ['ultima-ubicacion', viaje.id],
      queryFn: () => trackingApi.getUltimaUbicacion(viaje.id),
      retry: false,
      staleTime: 30_000,
    })),
  });
  const ubicacionInicialPorViajeId = useMemo(
    () =>
      Object.fromEntries(
        viajesSinUbicacionLive.map((viaje, index) => [viaje.id, ubicacionesIniciales[index]?.data]),
      ),
    [viajesSinUbicacionLive, ubicacionesIniciales],
  );

  const viajes = useMemo(
    () =>
      viajesActivos.map((viaje) => {
        const ubicacion = locationsByViajeId[viaje.id] ?? ubicacionInicialPorViajeId[viaje.id];
        return {
          ...viaje,
          patente: viaje.vehiculo?.patente ?? 'Sin patente',
          choferNombre: getChoferNombre(viaje.chofer),
          sucursalNombre: viaje.sucursal?.nombre,
          currentLocation: ubicacion ? [ubicacion.longitud, ubicacion.latitud] : null,
          ultimaActualizacion: ubicacion?.timestamp ?? null,
        };
      }),
    [viajesActivos, locationsByViajeId, ubicacionInicialPorViajeId],
  );

  return { viajes, status, isLoading };
};
