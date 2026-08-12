import { useEffect, useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { ThemeIcon, Tooltip } from '@mantine/core';
import { IconTruck } from '@tabler/icons-react';
import { Marker, useMap } from 'react-map-gl/mapbox';
import { LngLatBounds } from 'mapbox-gl';

import { trackingApi } from '@api/tracking.api';
import { useSelectedViaje } from '../contexts/selectedViaje';
import { useTracking } from '../contexts/tracking';

const SIN_SENAL_THRESHOLD_MS = 5 * 60 * 1000;

const getEstadoConfig = (timestamp) => {
  if (!timestamp || Date.now() - new Date(timestamp).getTime() > SIN_SENAL_THRESHOLD_MS) {
    return { label: 'Sin Señal', color: 'gray', zIndex: 30 };
  }
  return { label: 'A tiempo', color: 'green', zIndex: 10 };
};

const getChoferNombre = (chofer) =>
  chofer ? `${chofer.nombre ?? ''} ${chofer.apellido ?? ''}`.trim() : 'Sin chofer asignado';

const MapTruckMarkers = () => {
  const { selectedViajeId, setSelectedViajeId, selectedSucursal } = useSelectedViaje();
  const { viajesActivos, locationsByViajeId } = useTracking();
  const { current: map } = useMap();

  // Para viajes sin ubicación en vivo todavía, se busca la última conocida.
  const viajesSinUbicacionLive = viajesActivos.filter((viaje) => !locationsByViajeId[viaje.id]);
  const ubicacionesIniciales = useQueries({
    queries: viajesSinUbicacionLive.map((viaje) => ({
      queryKey: ['ultima-ubicacion', viaje.id],
      queryFn: () => trackingApi.getUltimaUbicacion(viaje.id),
      retry: false,
      staleTime: 30_000,
    })),
  });
  const ubicacionInicialPorViajeId = useMemo(
    () =>
      Object.fromEntries(
        viajesSinUbicacionLive.map((viaje, index) => [viaje.id, ubicacionesIniciales[index]?.data]),
      ),
    [viajesSinUbicacionLive, ubicacionesIniciales],
  );

  const viajesConUbicacion = useMemo(() => {
    return viajesActivos
      .map((viaje) => {
        const ubicacion = locationsByViajeId[viaje.id] ?? ubicacionInicialPorViajeId[viaje.id];
        if (!ubicacion) return null;
        return {
          ...viaje,
          patente: viaje.vehiculo?.patente ?? 'Sin patente',
          choferNombre: getChoferNombre(viaje.chofer),
          sucursalNombre: viaje.sucursal?.nombre,
          currentLocation: [ubicacion.longitud, ubicacion.latitud],
          ultimaActualizacion: ubicacion.timestamp,
        };
      })
      .filter(Boolean);
  }, [viajesActivos, locationsByViajeId, ubicacionInicialPorViajeId]);

  const viajesFiltrados = viajesConUbicacion.filter(
    (v) => selectedSucursal === 'todas' || v.sucursalNombre === selectedSucursal,
  );

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
  }, [map, selectedSucursal, selectedViajeId, viajesConUbicacion.length]);

  if (selectedViajeId) return null;

  return viajesFiltrados.map((viaje) => {
    const estado = getEstadoConfig(viaje.ultimaActualizacion);
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
