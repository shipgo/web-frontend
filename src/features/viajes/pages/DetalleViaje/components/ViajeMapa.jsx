import { useMemo } from 'react';
import { Card, Stack, Text, ThemeIcon, Title, Tooltip } from '@mantine/core';
import { IconMapPinOff, IconTruck } from '@tabler/icons-react';
import { Marker } from 'react-map-gl/mapbox';

import Map from '@components/Map';

/** Coordenadas de la parada de un recorrido (`puntoEntrega` o `sucursalDestino`, XOR). */
const coordsDeRecorrido = (recorrido) => {
  const punto = recorrido.puntoEntrega ?? recorrido.sucursalDestino?.puntoEntrega;
  if (!punto || punto.latitud == null || punto.longitud == null) return null;
  return { lat: punto.latitud, lng: punto.longitud };
};

const StopMarker = ({ orden, coords }) => (
  <Marker longitude={coords.lng} latitude={coords.lat} anchor="center">
    <Tooltip label={`Parada #${orden ?? ''}`} withArrow>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          background: 'var(--mantine-color-blue-6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: 11,
          fontWeight: 700,
          border: '2px solid white',
          boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
        }}
      >
        {orden ?? '•'}
      </div>
    </Tooltip>
  </Marker>
);

/**
 * Mini-mapa del viaje: paradas de los recorridos + (si `estado === 'en_camino'`
 * y hay dato) la última ubicación conocida vía tracking. Si no hay GPS o el
 * viaje no está en camino, se muestra igual con sólo las paradas.
 */
const ViajeMapa = ({ recorridos = [], estado, ubicacion }) => {
  const paradas = useMemo(
    () =>
      [...recorridos]
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map((recorrido) => ({ orden: recorrido.orden, coords: coordsDeRecorrido(recorrido) }))
        .filter((p) => p.coords),
    [recorridos],
  );

  const truckCoords =
    estado === 'en_camino' && ubicacion?.latitud != null && ubicacion?.longitud != null
      ? { lat: ubicacion.latitud, lng: ubicacion.longitud }
      : null;

  const puntos = [...paradas.map((p) => p.coords), ...(truckCoords ? [truckCoords] : [])];
  const initialViewState = puntos.length
    ? {
        latitude: puntos.reduce((sum, p) => sum + p.lat, 0) / puntos.length,
        longitude: puntos.reduce((sum, p) => sum + p.lng, 0) / puntos.length,
        zoom: 11,
      }
    : undefined;

  return (
    <Card p={0} style={{ overflow: 'hidden' }}>
      <Stack gap={0}>
        <Title order={4} p="md" pb="xs">
          Mapa del viaje
        </Title>
        <div style={{ height: 350 }}>
          <Map initialViewState={initialViewState}>
            {paradas.map((parada, index) => (
              <StopMarker key={index} orden={parada.orden} coords={parada.coords} />
            ))}
            {truckCoords && (
              <Marker longitude={truckCoords.lng} latitude={truckCoords.lat} anchor="bottom">
                <Tooltip label="Última ubicación conocida" withArrow>
                  <ThemeIcon color="orange" size="lg" radius="xl">
                    <IconTruck size={18} />
                  </ThemeIcon>
                </Tooltip>
              </Marker>
            )}
          </Map>
        </div>
        {estado === 'en_camino' && !truckCoords && (
          <Text size="xs" c="dimmed" p="sm">
            <IconMapPinOff size={12} style={{ verticalAlign: 'middle' }} /> Sin ubicación GPS disponible por el
            momento.
          </Text>
        )}
      </Stack>
    </Card>
  );
};

export default ViajeMapa;
