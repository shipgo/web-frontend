import { ThemeIcon } from '@mantine/core';
import { IconTruck } from '@tabler/icons-react';
import { Marker } from 'react-map-gl/mapbox';

import Map from '@components/Map';

/**
 * Mini-mapa con la última ubicación APROXIMADA del envío.
 *
 * Sólo se monta cuando el `PublicTrackingDTO` trae `ultimaUbicacionAprox`
 * (coords redondeadas a ~1 km, y sólo mientras el envío está `en_camino`).
 * El componente no decide nada de privacidad: si no hay coords, no se renderiza.
 *
 * @param {Object} props
 * @param {{ lat: number, lng: number, fecha?: string }} props.ubicacion
 * @param {number|string} [props.height=260]
 */
const TrackingUbicacionMapa = ({ ubicacion, height = 260 }) => {
  if (
    !ubicacion ||
    typeof ubicacion.lat !== 'number' ||
    typeof ubicacion.lng !== 'number'
  ) {
    return null;
  }

  return (
    <div style={{ height, width: '100%', borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }}>
      <Map
        initialViewState={{
          latitude: ubicacion.lat,
          longitude: ubicacion.lng,
          zoom: 11,
        }}
      >
        <Marker latitude={ubicacion.lat} longitude={ubicacion.lng} anchor="bottom">
          <ThemeIcon color="orange" size="lg" radius="xl">
            <IconTruck size={18} />
          </ThemeIcon>
        </Marker>
      </Map>
    </div>
  );
};

export default TrackingUbicacionMapa;
