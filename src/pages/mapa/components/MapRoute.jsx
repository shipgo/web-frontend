import { LoadingOverlay } from "@mantine/core";
import { Layer, Marker, Source } from "react-map-gl/mapbox";

import { useGetRoute } from "../hooks/useGetRoute";
import { useSelectedViaje } from "../contexts/selectedViaje";

const MapRoute = () => {
  const { selectedViajeId } = useSelectedViaje();
  const { route, isFetching } = useGetRoute(selectedViajeId);

  return (
    <>
      <LoadingOverlay visible={isFetching} overlayProps={{ blur: 2 }} />

      {route?.coordinates?.map((marker) => (
        <Marker
          color="red"
          key={marker.join(";")}
          longitude={marker[0]}
          latitude={marker[1]}
        />
      ))}

      {route && (
        <Source type="geojson" data={route.geometry}>
          <Layer
            id="route"
            type="line"
            paint={{
              "line-color": "#3b82f6",
              "line-width": 2,
              "line-offset": -3,
            }}
          />
        </Source>
      )}
    </>
  );
};

export default MapRoute;
