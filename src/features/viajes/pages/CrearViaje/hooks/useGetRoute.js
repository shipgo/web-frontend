import axios from "axios";

const VITE_MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;

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

const useGetRoute = ({ paquetes, puntoSalida }) => {

  
};

export default useGetRoute;