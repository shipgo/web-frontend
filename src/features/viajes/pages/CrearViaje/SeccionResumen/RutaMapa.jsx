import { useEffect, useMemo } from "react";
import { ThemeIcon, Tooltip } from "@mantine/core";
import { IconBuilding } from "@tabler/icons-react";
import { Layer, Marker, Source, useMap } from "react-map-gl/mapbox";
import { LngLatBounds } from "mapbox-gl";

import { Map } from "@components";

// Mapbox GL exige un color real (hex/rgb) en `paint`, no una variable CSS —
// mismo hallazgo que documenta `DetalleViaje/components/ViajeMapa.jsx`.
const ROUTE_LAYER = {
  id: "ruta-sugerida",
  type: "line",
  layout: { "line-cap": "round", "line-join": "round" },
  paint: { "line-width": 4, "line-color": "#1c7ed6", "line-opacity": 0.85 },
};

const StopMarker = ({ orden, coords }) => (
  <Marker longitude={coords[0]} latitude={coords[1]} anchor="center">
    <Tooltip label={`Parada ${orden}`} withArrow>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: "50%",
          background: "var(--mantine-color-blue-6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "white",
          fontSize: 11,
          fontWeight: 700,
          border: "2px solid white",
          boxShadow: "0 2px 6px rgba(0,0,0,0.4)",
        }}
      >
        {orden}
      </div>
    </Tooltip>
  </Marker>
);

/**
 * `initialViewState` de react-map-gl sólo se aplica al montar el `<Map>`:
 * `origenCoords` puede llegar antes, pero la ruta calculada (`routeGeometry`,
 * `hooks/useRouteCalculation`) siempre llega DESPUÉS, tras el click en
 * "Calcular trayecto sugerido" — sin este efecto la cámara nunca se mueve
 * para mostrarla. Mismo patrón que `mapa/components/MapRoute.jsx`.
 */
const MapAutoFit = ({ puntos }) => {
  const { current: map } = useMap();

  useEffect(() => {
    if (!map || puntos.length === 0) return;
    if (puntos.length === 1) {
      map.flyTo({ center: puntos[0], zoom: 13, duration: 1000 });
      return;
    }
    const bounds = new LngLatBounds();
    puntos.forEach((p) => bounds.extend(p));
    map.fitBounds(bounds, { padding: 60, duration: 1000 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, puntos.length]);

  return null;
};

/**
 * Mini-mapa de `SeccionResumen` (`SHG-FE-048`): un marcador numerado por cada
 * parada, EN EL ORDEN elegido (`SeccionEnvios/utils.moverParada`) + la
 * sucursal de origen (si se conoce) + la polilínea de la ruta sugerida una
 * vez calculada (`hooks/useRouteCalculation`, Mapbox Directions).
 */
const RutaMapa = ({ origenCoords, paradas = [], routeGeometry }) => {
  const puntos = useMemo(() => {
    const paradasCoords = paradas.map((parada) => parada.coords).filter(Boolean);
    const rutaCoords = routeGeometry?.coordinates ?? [];
    return [
      ...(origenCoords ? [origenCoords] : []),
      ...paradasCoords,
      ...rutaCoords,
    ];
  }, [origenCoords, paradas, routeGeometry]);

  const initialViewState = useMemo(() => {
    if (puntos.length === 0) return undefined;

    return {
      longitude: puntos.reduce((sum, [lng]) => sum + lng, 0) / puntos.length,
      latitude: puntos.reduce((sum, [, lat]) => sum + lat, 0) / puntos.length,
      zoom: 11,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Map initialViewState={initialViewState}>
      <MapAutoFit puntos={puntos} />
      {origenCoords && (
        <Marker
          longitude={origenCoords[0]}
          latitude={origenCoords[1]}
          anchor="center"
        >
          <Tooltip label="Sucursal de origen" withArrow>
            <ThemeIcon color="dark" size="md" radius="xl" variant="filled">
              <IconBuilding size={14} />
            </ThemeIcon>
          </Tooltip>
        </Marker>
      )}

      {paradas.map((parada, index) =>
        parada.coords ? (
          <StopMarker
            key={`${parada.label}-${index}`}
            orden={index + 1}
            coords={parada.coords}
          />
        ) : null,
      )}

      {routeGeometry && (
        <Source type="geojson" data={routeGeometry}>
          <Layer {...ROUTE_LAYER} />
        </Source>
      )}
    </Map>
  );
};

export default RutaMapa;
