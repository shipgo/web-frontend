import { useEffect } from 'react';
import { ThemeIcon, Tooltip } from '@mantine/core';
import { IconTruck } from '@tabler/icons-react';
import { Marker, useMap } from 'react-map-gl/mapbox';
import { LngLatBounds } from 'mapbox-gl';

import { useSelectedViaje } from '../contexts/selectedViaje';
import { useViajesConUbicacion } from '../hooks/useViajesConUbicacion';
import { getEstadoVisualViaje } from '../utils/estadoVisual';

const MapTruckMarkers = () => {
  const { selectedViajeId, setSelectedViajeId, selectedSucursal } = useSelectedViaje();
  const { viajes } = useViajesConUbicacion();
  const { current: map } = useMap();

  const viajesFiltrados = viajes
    .filter((viaje) => viaje.currentLocation)
    .filter((viaje) => selectedSucursal === 'todas' || viaje.sucursalNombre === selectedSucursal);

  useEffect(() => {
    if (!map || selectedViajeId) return;
    if (viajesFiltrados.length === 0) return;
    if (viajesFiltrados.length === 1) {
      map.flyTo({ center: viajesFiltrados[0].currentLocation, zoom: 13, duration: 1200 });
      return;
    }
    const bounds = new LngLatBounds();
    viajesFiltrados.forEach((v) => bounds.extend(v.currentLocation));
    map.fitBounds(bounds, { padding: 80, duration: 1200 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, selectedSucursal, selectedViajeId, viajesFiltrados.length]);

  if (selectedViajeId) return null;

  return viajesFiltrados.map((viaje) => {
    const estado = getEstadoVisualViaje(viaje, viaje.ultimaActualizacion);
    return (
      <Marker
        key={viaje.id}
        longitude={viaje.currentLocation[0]}
        latitude={viaje.currentLocation[1]}
        anchor="bottom"
        style={{ cursor: 'pointer', zIndex: estado.zIndex }}
        onClick={() => setSelectedViajeId(viaje.id)}
      >
        <Tooltip label={`${viaje.patente} · ${viaje.choferNombre} · ${estado.label}`} withArrow>
          <ThemeIcon color={estado.color} size="lg" radius="xl">
            <IconTruck size={18} />
          </ThemeIcon>
        </Tooltip>
      </Marker>
    );
  });
};

export default MapTruckMarkers;
