import { Card, useMantineColorScheme } from "@mantine/core";

import "mapbox-gl/dist/mapbox-gl.css";
import Map, { FullscreenControl, NavigationControl } from "react-map-gl/mapbox";

import MapRoute from "./MapRoute";

const VITE_MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;
const CENTER = { lat: -32.40949761013196, lng: -63.24437044777056 };
const MAP_STYLES = {
  dark: "mapbox://styles/joado97/cmbelt6tx003y01qqgshb3a28",
  light: "mapbox://styles/joado97/cmbhc0hiv001u01s9bay1fbap",
};

const MapCard = () => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <Card flex="1" p="0">
      <Map
        initialViewState={{
          longitude: CENTER.lng,
          latitude: CENTER.lat,
          zoom: 13,
        }}
        accessToken={VITE_MAPBOX_API_KEY}
        mapboxAccessToken={VITE_MAPBOX_API_KEY}
        mapStyle={MAP_STYLES[colorScheme]}
      >
        <MapRoute />
        <FullscreenControl position="bottom-right" />
        <NavigationControl showCompass={false} position="bottom-right" />
      </Map>
    </Card>
  );
};

export default MapCard;
