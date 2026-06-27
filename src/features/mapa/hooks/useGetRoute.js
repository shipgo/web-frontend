import axios from "axios";
import { useQuery } from "@tanstack/react-query";

import { VIAJES_MOCK } from "../mocks";

const VITE_MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;

const getRoute = (viaje) => {
  const startPoint = viaje.deliveredStops === 0 ? viaje.currentLocation : viaje.originLocation;
  const waypoints = [startPoint, ...viaje.stops.map((s) => s.coords)];
  const coords = waypoints.map(([lng, lat]) => `${lng},${lat}`).join(";");

  return axios
    .get(
      `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/${coords}`,
      {
        params: {
          access_token: VITE_MAPBOX_API_KEY,
          geometries: "geojson",
          overview: "full",
          steps: false,
        },
      },
    )
    .then((res) => res.data);
};

export const useGetRoute = (selectedViajeId) => {
  const viaje = VIAJES_MOCK.find((v) => v.id === selectedViajeId);

  const {
    data: route,
    isError,
    isFetching,
  } = useQuery({
    queryFn: () => getRoute(viaje),
    enabled: !!viaje,
    queryKey: ["route", selectedViajeId],
    select: (data) => ({
      geometry: data.routes[0].geometry,
      totalDistance: data.routes[0].distance,
      legDistances: data.routes[0].legs.map((leg) => leg.distance),
      waypoints: data.waypoints.map((wp) => wp.location),
    }),
  });

  return { route, isError, isFetching };
};
