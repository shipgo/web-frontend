import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Group, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { IconBuilding, IconCheck, IconPhone, IconTruck, IconX } from '@tabler/icons-react';
import { Layer, Marker, Popup, Source, useMap } from 'react-map-gl/mapbox';
import { LngLatBounds } from 'mapbox-gl';

import { estadoBadge, esEstadoTerminal } from '@domain/estados';
import { formatTelefono } from '@domain/format';
import { useGetRoute } from '../hooks/useGetRoute';
import { useSelectedViaje } from '../contexts/selectedViaje';
import { useViajesConUbicacion } from '../hooks/useViajesConUbicacion';
import { getEstadoVisualViaje } from '../utils/estadoVisual';
import { direccionDeRecorrido } from '../utils/recorridos';

const getRouteGradient = (progress) => {
  if (progress <= 0) {
    return ['interpolate', ['linear'], ['line-progress'], 0, '#3b82f6', 1, '#3b82f6'];
  }
  if (progress >= 1) {
    return ['interpolate', ['linear'], ['line-progress'], 0, '#868e96', 1, '#868e96'];
  }
  return [
    'interpolate', ['linear'], ['line-progress'],
    0, '#868e96',
    Math.max(progress - 0.005, 0), '#868e96',
    Math.min(progress + 0.005, 1), '#3b82f6',
    1, '#3b82f6',
  ];
};

const StopMarker = ({ parada, index, isDelivered, onClick }) => (
  <Marker
    longitude={parada.coords[0]}
    latitude={parada.coords[1]}
    anchor="center"
    onClick={(e) => { e.originalEvent.stopPropagation(); onClick(parada); }}
  >
    <div
      style={{
        width: 24,
        height: 24,
        borderRadius: '50%',
        background: isDelivered ? '#868e96' : 'var(--mantine-color-blue-6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        border: '2px solid white',
        boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        flexShrink: 0,
      }}
    >
      {isDelivered
        ? <IconCheck size={12} color="white" strokeWidth={3} />
        : <span style={{ color: 'white', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>{index + 1}</span>
      }
    </div>
  </Marker>
);

const MapRoute = () => {
  const { selectedViajeId } = useSelectedViaje();
  const { viajes } = useViajesConUbicacion();
  const selectedViaje = viajes.find((v) => v.id === selectedViajeId);

  const { viaje, paradas, progreso, route } = useGetRoute(
    selectedViajeId,
    selectedViaje?.currentLocation,
  );
  const { current: map } = useMap();
  const [selectedParada, setSelectedParada] = useState(null);

  const paradasConCoords = useMemo(() => paradas.filter((p) => p.coords), [paradas]);
  const paradasEntregadas = progreso?.paradasEntregadas ?? 0;

  const deliveredProgress = useMemo(() => {
    if (!route?.legDistances || paradasEntregadas === 0) return 0;
    const completed = route.legDistances
      .slice(0, paradasEntregadas)
      .reduce((sum, d) => sum + d, 0);
    return route.totalDistance > 0 ? completed / route.totalDistance : 0;
  }, [route, paradasEntregadas]);

  useEffect(() => {
    setSelectedParada(null);
    if (!map || !selectedViaje?.currentLocation) return;
    map.flyTo({ center: selectedViaje.currentLocation, zoom: 14, duration: 1200 });
    // Sólo al cambiar de viaje seleccionado: no volver a centrar la cámara
    // en cada ping de ubicación del mismo viaje (eso lo maneja el usuario).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedViajeId]);

  useEffect(() => {
    if (!map || !route || !selectedViaje) return;
    const truckWaypoint = route.waypoints[paradasEntregadas] ?? route.waypoints[0];
    const bounds = new LngLatBounds();
    bounds.extend(truckWaypoint);
    route.waypoints.forEach((wp) => bounds.extend(wp));
    map.fitBounds(bounds, { padding: 200, duration: 2000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, map, selectedViajeId]);

  if (!selectedViaje) return null;

  const estadoVisual = getEstadoVisualViaje(selectedViaje, selectedViaje.ultimaActualizacion);
  const truckPos = route ? route.waypoints[paradasEntregadas] : selectedViaje.currentLocation;
  const origenSucursal = viaje?.sucursal?.puntoEntrega;

  if (!truckPos) return null;

  return (
    <>
      <Marker longitude={truckPos[0]} latitude={truckPos[1]} anchor="bottom" style={{ cursor: 'default' }}>
        <Tooltip label={`${selectedViaje.patente} · ${selectedViaje.choferNombre} · ${estadoVisual.label}`} withArrow>
          <ThemeIcon color={estadoVisual.color} size="lg" radius="xl">
            <IconTruck size={18} />
          </ThemeIcon>
        </Tooltip>
      </Marker>

      {origenSucursal && paradasEntregadas > 0 && (
        <Marker
          longitude={origenSucursal.longitud}
          latitude={origenSucursal.latitud}
          anchor="center"
        >
          <Tooltip label={`Origen: ${viaje.sucursal.nombre}`} withArrow>
            <ThemeIcon color="dark" size="md" radius="xl" variant="filled">
              <IconBuilding size={14} />
            </ThemeIcon>
          </Tooltip>
        </Marker>
      )}

      {paradasConCoords.map((parada, i) => (
        <StopMarker
          key={parada.id ?? `stop-${i}`}
          parada={parada}
          index={i}
          isDelivered={esEstadoTerminal('recorrido', parada.estado)}
          onClick={setSelectedParada}
        />
      ))}

      {selectedParada && (
        <Popup
          longitude={selectedParada.coords[0]}
          latitude={selectedParada.coords[1]}
          anchor="top"
          closeButton={false}
          onClose={() => setSelectedParada(null)}
          maxWidth="260px"
          style={{ padding: 0 }}
        >
          <Stack gap={6} p="sm" style={{ minWidth: 220 }}>
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
              <Stack gap={2}>
                <Text size="sm" fw={700} style={{ lineHeight: 1.2 }}>
                  {direccionDeRecorrido(selectedParada)}
                </Text>
                <Text size="xs" c="dimmed">
                  {estadoBadge('recorrido', selectedParada.estado).label}
                </Text>
              </Stack>
              <ActionIcon
                variant="subtle"
                color="gray"
                size="sm"
                onClick={() => setSelectedParada(null)}
                aria-label="Cerrar detalle de parada"
              >
                <IconX size={14} />
              </ActionIcon>
            </Group>

            {(selectedParada.detalleRecorridos ?? []).map((detalle) => {
              const envio = detalle.envio;
              if (!envio) return null;
              const nombre = [envio.nombre, envio.apellido].filter(Boolean).join(' ')
                || `Envío ${envio.codigoSeguimiento ?? envio.id}`;

              return (
                <Group key={detalle.id} justify="space-between" wrap="nowrap" gap="xs">
                  <Text size="xs">{nombre}</Text>
                  {envio.telefono && (
                    <ActionIcon
                      variant="subtle"
                      color="green"
                      size="sm"
                      component="a"
                      href={`tel:${formatTelefono(envio)}`}
                      aria-label={`Llamar a ${nombre}`}
                    >
                      <IconPhone size={14} />
                    </ActionIcon>
                  )}
                </Group>
              );
            })}
          </Stack>
        </Popup>
      )}

      {route && (
        <Source type="geojson" data={route.geometry} lineMetrics={true}>
          <Layer
            id="route"
            type="line"
            layout={{ 'line-cap': 'round', 'line-join': 'round' }}
            paint={{
              'line-width': 4,
              'line-gradient': getRouteGradient(deliveredProgress),
            }}
          />
          <Layer
            id="route-arrows"
            type="symbol"
            layout={{
              'symbol-placement': 'line',
              'text-field': '▶',
              'text-size': 30,
              'symbol-spacing': 60,
              'text-rotation-alignment': 'map',
              'text-keep-upright': false,
              'text-allow-overlap': true,
              'text-offset': [0, 0.05],
            }}
            paint={{
              'text-color': '#ef4444',
            }}
          />
        </Source>
      )}
    </>
  );
};

export default MapRoute;
