import axios from "axios";
import { useEffect } from "react";

import { LngLatBounds } from "mapbox-gl";
import { useMap } from "react-map-gl/mapbox";
import { useQuery } from "@tanstack/react-query";

const VITE_MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;

const WAYPOINTS = [
  {
    street: "Progreso",
    address_number: "1034",
    place: "Villa María",
    region: "Córdoba",
    postcode: "5900",
  },
  {
    street: "Boulevard Argentino",
    address_number: "1647",
    place: "Villa María",
    region: "Córdoba",
    postcode: "5900",
  },
  {
    street: "Ramiro Suarez",
    address_number: "1374",
    place: "Villa María",
    region: "Córdoba",
    postcode: "5900",
  },
  {
    street: "Buenos Aires",
    address_number: "1329",
    place: "Villa María",
    region: "Córdoba",
    postcode: "5900",
  },
  {
    street: "9 de Julio",
    address_number: "674",
    place: "Villa María",
    region: "Córdoba",
    postcode: "5900",
  },
];

const getCoordinates = (waypoint) =>
  axios
    .get("https://api.mapbox.com/search/geocode/v6/forward", {
      params: {
        ...waypoint,
        limit: 1,
        countries: "AR",
        worldview: "ar",
        types: "address",
        autocomplete: false,
        access_token: VITE_MAPBOX_API_KEY,
      },
    })
    .then((response) =>
      response?.data?.features?.[0]?.geometry?.coordinates.join(",")
    );

const getRoute = async () => {
  const formattedCoordinates = await Promise.all(
    WAYPOINTS.map(getCoordinates)
  ).then((coordinates) => coordinates.join(";"));

  return axios
    .get(
      `https://api.mapbox.com/optimized-trips/v1/mapbox/driving-traffic/${formattedCoordinates}`,
      {
        params: {
          geometries: "geojson",
          access_token: VITE_MAPBOX_API_KEY,
          overview: "full",
          steps: true,
          approaches: WAYPOINTS.map(() => "curb").join(";"),
        },
      }
    )
    .then((response) => response?.data);
};

export const useGetRoute = (selectedViajeId) => {
  const {
    isError,
    isFetching,
    data: route,
  } = useQuery({
    queryFn: getRoute,
    staleTime: Infinity,
    enabled: selectedViajeId !== null,
    queryKey: ["route", selectedViajeId],
    select: (data) => ({
      geometry: data.trips[0].geometry,
      coordinates: data.waypoints.map((waypoint) => waypoint.location),
    }),
  });

  const { current: map } = useMap();

  useEffect(() => {
    const showRoute = () => {
      if (!map || !route) return;

      const bounds = new LngLatBounds();

      route.coordinates.forEach(([lng, lat]) => {
        bounds.extend([lng, lat]);
      });

      map.fitBounds(bounds, {
        padding: 200,
        duration: 2000,
      });
    };

    showRoute();
  }, [route, map, selectedViajeId]);

  return {
    route,
    isError,
    isFetching,
  };
};
