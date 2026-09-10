import { useMemo } from 'react';
import { Card, Stack, Text, ThemeIcon, Title, Tooltip } from '@mantine/core';
import { IconMapPinOff, IconTruck } from '@tabler/icons-react';
import { Layer, Marker, Source } from 'react-map-gl/mapbox';

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

// Mapbox GL exige un color real en `paint` (hex/rgb/expresión) — a diferencia
// del resto del árbol de React, NO acepta variables CSS (`var(--...)`) acá:
// pasarle una rompe `addLayer` con un `console.error` en cada render
// ("color expected, ... found") sin tirar la app abajo, pero deja el mapa sin
// la línea trazada (descubierto corriendo el harness E2E de SHG-QA-010).
// Mismo naranja que usa `@mantine/core` para `orange.6` en el tema por
// defecto (`MapRoute.jsx` hace lo mismo con hex fijos para sus capas).
const TRACK_LINE_LAYER = {
  id: 'viaje-track',
  type: 'line',
  layout: { 'line-cap': 'round', 'line-join': 'round' },
  paint: { 'line-width': 3, 'line-color': '#f76707', 'line-opacity': 0.85 },
};

/** Ordena el historial de tracking (`UbicacionViajeDTO[]`) por `orden` y descarta
 * puntos sin coordenadas válidas. */
const puntosDeHistorial = (historial = []) =>
  [...historial]
    .filter((p) => p?.latitud != null && p?.longitud != null)
    .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
    .map((p) => ({ lat: p.latitud, lng: p.longitud, orden: p.orden }));

/**
 * Mini-mapa del viaje: paradas de los recorridos + (si `estado === 'en_camino'`)
 * el recorrido GPS trazado hasta ahora (`historial`, `SHG-QA-010`) y la última
 * ubicación conocida vía tracking. Si no hay GPS o el viaje no está en camino,
 * se muestra igual con sólo las paradas.
 */
const ViajeMapa = ({ recorridos = [], estado, ubicacion, historial = [] }) => {
  const paradas = useMemo(
    () =>
      [...recorridos]
        .sort((a, b) => (a.orden ?? 0) - (b.orden ?? 0))
        .map((recorrido) => ({ orden: recorrido.orden, coords: coordsDeRecorrido(recorrido) }))
        .filter((p) => p.coords),
    [recorridos],
  );

  const trackPuntos = useMemo(() => puntosDeHistorial(historial), [historial]);

  const trackGeoJson = useMemo(() => {
    if (trackPuntos.length < 2) return null;
    return {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: trackPuntos.map((p) => [p.lng, p.lat]) },
    };
  }, [trackPuntos]);

  const truckCoords =
    estado === 'en_camino' && ubicacion?.latitud != null && ubicacion?.longitud != null
      ? { lat: ubicacion.latitud, lng: ubicacion.longitud }
      : null;

  // Sin `estado === 'en_camino'` como condición: un viaje `planificado` (o
  // cualquier otro estado sin tracking todavía) también debe mostrar el
  // aviso en vez de un mapa mudo con sólo las paradas (SHG-QA-010, caso 4).
  const sinUbicaciones = !truckCoords && trackPuntos.length === 0;

  const puntos = [...paradas.map((p) => p.coords), ...trackPuntos, ...(truckCoords ? [truckCoords] : [])];
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
        <div style={{ height: 350 }} data-testid="viaje-mapa-track" data-track-puntos={trackPuntos.length}>
          <Map initialViewState={initialViewState}>
            {trackGeoJson && (
              <Source type="geojson" data={trackGeoJson}>
                <Layer {...TRACK_LINE_LAYER} />
              </Source>
            )}
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
        {sinUbicaciones && (
          <Text size="xs" c="dimmed" p="sm">
            <IconMapPinOff size={12} style={{ verticalAlign: 'middle' }} /> Sin ubicaciones GPS disponibles por
            el momento.
          </Text>
        )}
      </Stack>
    </Card>
  );
};

export default ViajeMapa;
