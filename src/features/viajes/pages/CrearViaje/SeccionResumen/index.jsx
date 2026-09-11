import { Card, Stack, Group } from "@mantine/core";

import ScreenContainer from "@components/ScreenContainer";
import { useAuth } from "@contexts/auth";

import useRouteCalculation from "../hooks/useRouteCalculation";
import { coordsDePunto, getGroupProperties, moverParada } from "../SeccionEnvios/utils";
import { useFormContext } from "../contexts/EnviosFormContext";

import SeccionHeader from "./SeccionHeader";
import PaquetesTimeline from "./PaquetesTimeline";
import RutaMapa from "./RutaMapa";

const SeccionResumen = () => {
  const { user } = useAuth();
  const {
    values: { enviosIncluidos, fechaHoraInicioPlanificada },
    setFieldValue,
  } = useFormContext();

  const { groupLabels, groupCounts, groupCoords } =
    getGroupProperties(enviosIncluidos);

  // `POST /api/viaje` siempre resuelve el origen del viaje server-side desde
  // la sucursal del usuario logueado (ver `SeccionDetalles.jsx`) — el mapa y
  // el cálculo de ruta usan la misma fuente, nunca la sucursal "operativa"
  // del selector de SUPERUSER (`SHG-FE-052`).
  const origenCoords = coordsDePunto(user?.sucursal?.puntoEntrega);

  const {
    data,
    isPending,
    returnOrigin,
    setReturnOrigin,
    canCalculateNewRoute,
    showAlert,
    isError,
    handleRouteCalculation,
  } = useRouteCalculation(origenCoords, groupCoords);

  const handleMoveParada = (fromIndex, toIndex) =>
    setFieldValue(
      "enviosIncluidos",
      moverParada(enviosIncluidos, fromIndex, toIndex),
    );

  return (
    <Card padding="lg" component={Stack}>
      <SeccionHeader
        returnOrigin={returnOrigin}
        onReturnOriginChange={setReturnOrigin}
        canCalculateNewRoute={canCalculateNewRoute}
        showAlert={showAlert}
        isPending={isPending}
        onRouteCalculation={handleRouteCalculation}
      />

      <ScreenContainer
        styleProps={{ h: "400" }}
        onLoading={{
          show: isPending,
          title: "Calculando ruta sugerida...",
          description:
            "Esto puede tardar unos segundos. Por favor, no cierres ni recargues la página.",
        }}
        onError={{
          show: isError,
          title: "Error al calcular la ruta",
          description:
            "Ocurrió un error al calcular el trayecto. Intentá nuevamente.",
          onClick: handleRouteCalculation,
        }}
      >
        <Group pos="relative">
          <Card withBorder shadow="0" p="0" h={400} flex={1}>
            <RutaMapa
              origenCoords={origenCoords}
              paradas={groupLabels.map((label, index) => ({
                label,
                coords: groupCoords[index],
              }))}
              routeGeometry={data?.geometry}
            />
          </Card>

          <PaquetesTimeline
            groupLabels={groupLabels}
            groupCounts={groupCounts}
            fechaSalida={fechaHoraInicioPlanificada}
            sucursalOrigen={user?.sucursal?.nombre}
            onMoveParada={handleMoveParada}
          />
        </Group>
      </ScreenContainer>
    </Card>
  );
};

export default SeccionResumen;
