import axios from "axios";

const VITE_MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;

/**
 * Ruta real entre 2+ puntos vía Mapbox Directions API (perfil `driving`, sin
 * tráfico — a diferencia de `features/mapa/hooks/useGetRoute.js`, que usa
 * `driving-traffic` porque sigue un viaje EN CURSO; acá es sólo un trayecto
 * sugerido para un viaje que todavía no arrancó).
 *
 * Se extrae a un util compartido (`SHG-FE-048`, `CrearViaje`) en vez de
 * duplicar la llamada que ya hace `useGetRoute` para el mapa en vivo — mismo
 * servicio, mismo token (`VITE_MAPBOX_API_KEY`) que ya usa toda la app vía
 * `@components/Map`.
 *
 * @param {Array<[number, number]>} waypoints Coordenadas `[lng, lat]`, en el
 *   orden en que se van a recorrer (mínimo 2 — Mapbox devuelve 422 con menos).
 * @returns {Promise<{
 *   geometry: Object,
 *   totalDistance: number,
 *   totalDuration: number,
 *   legDistances: number[],
 *   legDurations: number[],
 * }>}
 */
export const fetchMapboxDirections = async (waypoints) => {
  const coords = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(";");

  const { data } = await axios.get(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}`,
    {
      params: {
        access_token: VITE_MAPBOX_API_KEY,
        geometries: "geojson",
        overview: "full",
        steps: false,
      },
    },
  );

  const [route] = data.routes ?? [];
  if (!route) {
    throw new Error("Mapbox no encontró una ruta para esas paradas.");
  }

  return {
    geometry: route.geometry,
    totalDistance: route.distance,
    totalDuration: route.duration,
    legDistances: route.legs.map((leg) => leg.distance),
    legDurations: route.legs.map((leg) => leg.duration),
  };
};
