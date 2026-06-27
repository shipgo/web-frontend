import { useEffect } from 'react';
import { ThemeIcon, Tooltip } from '@mantine/core';
import { IconTruck } from '@tabler/icons-react';
import { Marker, useMap } from 'react-map-gl/mapbox';
import { LngLatBounds } from 'mapbox-gl';

import { useSelectedViaje } from '../contexts/selectedViaje';
import { ESTADO_CONFIG, VIAJES_MOCK } from '../mocks';

const MapTruckMarkers = () => {
  const { selectedViajeId, setSelectedViajeId, selectedSucursal } = useSelectedViaje();
  const { current: map } = useMap();

  useEffect(() => {
    if (!map || selectedViajeId) return;
    const filtered = VIAJES_MOCK.filter(
      (v) => selectedSucursal === 'todas' || v.sucursal === selectedSucursal,
    );
    if (filtered.length === 0) return;
    if (filtered.length === 1) {
      map.flyTo({ center: filtered[0].currentLocation, zoom: 13, duration: 1200 });
      return;
    }
    const bounds = new LngLatBounds();
    filtered.forEach((v) => bounds.extend(v.currentLocation));
    map.fitBounds(bounds, { padding: 80, duration: 1200 });
  }, [map, selectedSucursal, selectedViajeId]);

  if (selectedViajeId) return null;

  return VIAJES_MOCK.filter(
    (v) => selectedSucursal === 'todas' || v.sucursal === selectedSucursal,
  ).map((viaje) => {
    const estado = ESTADO_CONFIG[viaje.estado];
    return (
      <Marker
        key={viaje.id}
        longitude={viaje.currentLocation[0]}
        latitude={viaje.currentLocation[1]}
        anchor="bottom"
        style={{ cursor: 'pointer', zIndex: estado.zIndex }}
        onClick={() => setSelectedViajeId(viaje.id)}
      >
        <Tooltip label={`${viaje.patente} · ${viaje.chofer} · ETA ${viaje.eta}`} withArrow>
          <ThemeIcon color={estado.color} size="lg" radius="xl">
            <IconTruck size={18} />
          </ThemeIcon>
        </Tooltip>
      </Marker>
    );
  });
};

export default MapTruckMarkers;
