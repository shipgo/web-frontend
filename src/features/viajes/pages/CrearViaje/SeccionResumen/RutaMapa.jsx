import { useMemo } from "react";
import { ThemeIcon, Tooltip } from "@mantine/core";
import { IconBuilding } from "@tabler/icons-react";
import { Layer, Marker, Source } from "react-map-gl/mapbox";

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
 * Mini-mapa de `SeccionResumen` (`SHG-FE-048`): un marcador numerado por cada
 * parada, EN EL ORDEN elegido (`SeccionEnvios/utils.moverParada`) + la
 * sucursal de origen (si se conoce) + la polilínea de la ruta sugerida una
 * vez calculada (`hooks/useRouteCalculation`, Mapbox Directions).
 *
 * A diferencia de `mapa/components/MapRoute.jsx` (mapa en vivo, con tracking)
 * no usa `useMap()`/`fitBounds`: acá no hay nada moviéndose que justifique
 * reencuadrar en cada render, así que alcanza con centrar una vez al
 * promediar los puntos conocidos — mismo criterio que
 * `DetalleViaje/components/ViajeMapa.jsx`.
 */
const RutaMapa = ({ origenCoords, paradas = [], routeGeometry }) => {
  const initialViewState = useMemo(() => {
    const puntos = [
      ...(origenCoords ? [origenCoords] : []),
      ...paradas.map((parada) => parada.coords).filter(Boolean),
    ];
    if (puntos.length === 0) return undefined;

    return {
      longitude: puntos.reduce((sum, [lng]) => sum + lng, 0) / puntos.length,
      latitude: puntos.reduce((sum, [, lat]) => sum + lat, 0) / puntos.length,
      zoom: 11,
    };
    // Sólo se recalcula si cambia la CANTIDAD de puntos conocidos: no hace
    // falta re-centrar la cámara en cada reordenamiento de paradas ya
    // visibles, sólo cuando aparece/desaparece alguna.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [origenCoords, paradas.length]);

  return (
    <Map initialViewState={initialViewState}>
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
