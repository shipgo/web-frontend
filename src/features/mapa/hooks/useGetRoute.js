import axios from 'axios';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';

import { viajeApi } from '@api/viaje.api';
import { ordenarParadas } from '../utils/recorridos';
import { useViajeProgreso } from './useViajeProgreso';

const VITE_MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;

const fetchDirections = (waypoints) => {
  const coords = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(';');

  return axios
    .get(`https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}`, {
      params: {
        access_token: VITE_MAPBOX_API_KEY,
        geometries: 'geojson',
        overview: 'full',
        steps: false,
      },
    })
    .then((res) => res.data);
};

/**
 * Ruta y progreso del viaje seleccionado en el mapa en vivo.
 *
 * - Paradas: `recorridos` reales del viaje (`viajeApi.getById`, mismo
 *   endpoint que `DetalleViaje`/`EditarViaje` — `viajeApi.getRuta` ya no
 *   existe), ordenados por `orden`, con coords de `puntoEntrega`/`sucursalDestino`.
 * - Progreso: snapshot de `SHG-BE-015` (`useViajeProgreso`).
 * - Waypoints para Mapbox Directions = posición actual (la pasa el caller —
 *   típicamente la última ubicación SSE/`.../last` del viaje) + coords de
 *   las paradas, en orden. Si todavía no hay ninguna posición conocida, se
 *   usa la sucursal de origen del viaje como punto de partida.
 *
 * @param {number|string|null} viajeId
 * @param {[number, number]|null} [posicionActual] `[lng, lat]`
 */
export const useGetRoute = (viajeId, posicionActual) => {
  const viajeQuery = useQuery({
    queryKey: ['viaje', viajeId],
    queryFn: () => viajeApi.getById(viajeId),
    enabled: !!viajeId,
  });

  const { progreso, isFetching: isFetchingProgreso, isError: isErrorProgreso } =
    useViajeProgreso(viajeId);

  const paradas = useMemo(
    () => ordenarParadas(viajeQuery.data?.recorridos),
    [viajeQuery.data],
  );

  const waypoints = useMemo(() => {
    const paradasConCoords = paradas.map((parada) => parada.coords).filter(Boolean);
    const origen = viajeQuery.data?.sucursal?.puntoEntrega;
    const inicio =
      posicionActual ??
      (origen?.latitud != null && origen?.longitud != null
        ? [origen.longitud, origen.latitud]
        : null);

    if (!inicio || paradasConCoords.length === 0) return null;
    return [inicio, ...paradasConCoords];
  }, [paradas, posicionActual, viajeQuery.data]);

  const routeQuery = useQuery({
    queryKey: ['route', viajeId, waypoints],
    queryFn: () => fetchDirections(waypoints),
    enabled: !!waypoints,
    select: (data) => ({
      geometry: data.routes[0].geometry,
      totalDistance: data.routes[0].distance,
      legDistances: data.routes[0].legs.map((leg) => leg.distance),
      waypoints: data.waypoints.map((wp) => wp.location),
    }),
  });

  return {
    viaje: viajeQuery.data,
    paradas,
    progreso,
    route: routeQuery.data,
    isFetching: viajeQuery.isFetching || routeQuery.isFetching || isFetchingProgreso,
    isError: viajeQuery.isError || routeQuery.isError || isErrorProgreso,
  };
};
