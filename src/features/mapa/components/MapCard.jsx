import { Card, useMantineColorScheme } from '@mantine/core';

import 'mapbox-gl/dist/mapbox-gl.css';
import Map, { FullscreenControl, NavigationControl } from 'react-map-gl/mapbox';

const VITE_MAPBOX_API_KEY = import.meta.env.VITE_MAPBOX_API_KEY;

const DEFAULT_CENTER = { lat: -32.40949761013196, lng: -63.24437044777056 };

const MAP_STYLES = {
  dark: 'mapbox://styles/joado97/cmbelt6tx003y01qqgshb3a28',
  light: 'mapbox://styles/joado97/cmbhc0hiv001u01s9bay1fbap',
};

const MapCard = ({ children, initialCenter = DEFAULT_CENTER, initialZoom = 13, ...rest }) => {
  const { colorScheme } = useMantineColorScheme();

  return (
    <Card flex="1" p="0" {...rest}>
      <Map
        initialViewState={{
          longitude: initialCenter.lng,
          latitude: initialCenter.lat,
          zoom: initialZoom,
        }}
        mapboxAccessToken={VITE_MAPBOX_API_KEY}
        mapStyle={MAP_STYLES[colorScheme]}
        style={{ width: '100%', height: '100%' }}
      >
        {children}
        <FullscreenControl position="bottom-right" />
        <NavigationControl showCompass={false} position="bottom-right" />
      </Map>
    </Card>
  );
};

export default MapCard;
