import { useComputedColorScheme } from "@mantine/core";

import Mapbox, {
  FullscreenControl,
  NavigationControl,
} from "react-map-gl/mapbox";
import "mapbox-gl/dist/mapbox-gl.css";

const VITE_MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;
const CENTER = { lat: -32.40949761013196, lng: -63.24437044777056 };
const MAP_STYLES = {
  dark: "mapbox://styles/joado97/cmbelt6tx003y01qqgshb3a28",
  light: "mapbox://styles/joado97/cmbhc0hiv001u01s9bay1fbap",
};

const Map = ({ children, initialViewState }) => {
  const colorScheme = useComputedColorScheme("light");

  return (
    <Mapbox
      initialViewState={initialViewState ?? {
        zoom: 13,
        latitude: CENTER.lat,
        longitude: CENTER.lng,
      }}
      mapStyle={MAP_STYLES[colorScheme]}
      accessToken={VITE_MAPBOX_API_KEY}
      mapboxAccessToken={VITE_MAPBOX_API_KEY}
    >
      {children}
      <FullscreenControl position="bottom-right" />
      <NavigationControl showCompass={false} position="bottom-right" />
    </Mapbox>
  );
};

export default Map;
