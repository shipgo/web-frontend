import { useEffect, useMemo, useState } from 'react';
import { ActionIcon, Group, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { IconBuilding, IconCheck, IconPhone, IconTruck, IconX } from '@tabler/icons-react';
import { Layer, Marker, Popup, Source, useMap } from 'react-map-gl/mapbox';
import { LngLatBounds } from 'mapbox-gl';

import { useGetRoute } from '../hooks/useGetRoute';
import { useSelectedViaje } from '../contexts/selectedViaje';
import { ESTADO_CONFIG, VIAJES_MOCK } from '../mocks';

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

const StopMarker = ({ stop, index, isDelivered, onClick }) => (
  <Marker
    longitude={stop.coords[0]}
    latitude={stop.coords[1]}
    anchor="center"
    onClick={(e) => { e.originalEvent.stopPropagation(); onClick(stop); }}
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
  const { route, isFetching } = useGetRoute(selectedViajeId);
  const { current: map } = useMap();
  const [selectedStop, setSelectedStop] = useState(null);

  const selectedViaje = VIAJES_MOCK.find((v) => v.id === selectedViajeId);

  const deliveredProgress = useMemo(() => {
    if (!route?.legDistances || !selectedViaje || selectedViaje.deliveredStops === 0) return 0;
    const completed = route.legDistances
      .slice(0, selectedViaje.deliveredStops)
      .reduce((sum, d) => sum + d, 0);
    return route.totalDistance > 0 ? completed / route.totalDistance : 0;
  }, [route, selectedViaje]);

  useEffect(() => {
    setSelectedStop(null);
    if (!map || !selectedViaje) return;
    map.flyTo({ center: selectedViaje.currentLocation, zoom: 14, duration: 1200 });
  }, [selectedViajeId]);

  useEffect(() => {
    if (!map || !route || !selectedViaje) return;
    const truckWaypoint = route.waypoints[selectedViaje.deliveredStops];
    const bounds = new LngLatBounds();
    bounds.extend(truckWaypoint);
    route.waypoints.forEach((wp) => bounds.extend(wp));
    map.fitBounds(bounds, { padding: 200, duration: 2000 });
  }, [route, map, selectedViajeId]);

  if (!selectedViaje) return null;

  const estado = ESTADO_CONFIG[selectedViaje.estado];
  const truckPos = route
    ? route.waypoints[selectedViaje.deliveredStops]
    : selectedViaje.currentLocation;

  return (
    <>
      <Marker longitude={truckPos[0]} latitude={truckPos[1]} anchor="bottom" style={{ cursor: 'default' }}>
        <Tooltip label={`${selectedViaje.patente} · ${selectedViaje.chofer} · ETA ${selectedViaje.eta}`} withArrow>
          <ThemeIcon color={estado.color} size="lg" radius="xl">
            <IconTruck size={18} />
          </ThemeIcon>
        </Tooltip>
      </Marker>

      {selectedViaje.deliveredStops > 0 && (
        <Marker
          longitude={selectedViaje.originLocation[0]}
          latitude={selectedViaje.originLocation[1]}
          anchor="center"
        >
          <Tooltip label="Origen del viaje" withArrow>
            <ThemeIcon color="dark" size="md" radius="xl" variant="filled">
              <IconBuilding size={14} />
            </ThemeIcon>
          </Tooltip>
        </Marker>
      )}

      {selectedViaje.stops.map((stop, i) => (
        <StopMarker
          key={`stop-${i}`}
          stop={stop}
          index={i}
          isDelivered={i < selectedViaje.deliveredStops}
          onClick={setSelectedStop}
        />
      ))}

      {selectedStop && (
        <Popup
          longitude={selectedStop.coords[0]}
          latitude={selectedStop.coords[1]}
          anchor="top"
          closeButton={false}
          onClose={() => setSelectedStop(null)}
          maxWidth="240px"
          style={{ padding: 0 }}
        >
          <Stack gap={6} p="sm" style={{ minWidth: 200 }}>
            <Group justify="space-between" align="flex-start" wrap="nowrap" gap="xs">
              <Stack gap={2}>
                <Text size="sm" fw={700} style={{ lineHeight: 1.2 }}>{selectedStop.clientName}</Text>
                <Text size="xs" c="dimmed">{selectedStop.address}</Text>
              </Stack>
              <Group gap={4} style={{ flexShrink: 0 }}>
                <ActionIcon
                  variant="subtle"
                  color="green"
                  size="sm"
                  component="a"
                  href={`tel:${selectedStop.phone}`}
                >
                  <IconPhone size={14} />
                </ActionIcon>
                <ActionIcon variant="subtle" color="gray" size="sm" onClick={() => setSelectedStop(null)}>
                  <IconX size={14} />
                </ActionIcon>
              </Group>
            </Group>
            <Text size="xs" c="dimmed">Horario pactado: {selectedStop.timeSlot}</Text>
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
