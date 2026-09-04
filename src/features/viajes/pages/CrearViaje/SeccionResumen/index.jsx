import { Card, Stack, Group } from "@mantine/core";

import { Map as MapComponent } from "@components";
import ScreenContainer from "@components/ScreenContainer";
import { useAuth } from "@contexts/auth";

import useRouteCalculation from "../hooks/useRouteCalculation";
import { getGroupProperties } from "../SeccionEnvios/utils";
import { useFormContext } from "../contexts/EnviosFormContext";

import SeccionHeader from "./SeccionHeader";
import PaquetesTimeline from "./PaquetesTimeline";

const SeccionResumen = () => {
  const { user } = useAuth();
  const {
    values: { enviosIncluidos, fechaHoraInicioPlanificada },
  } = useFormContext();

  const { groupLabels, groupCounts } = getGroupProperties(enviosIncluidos);

  const {
    isPending,
    returnOrigin,
    setReturnOrigin,
    canCalculateNewRoute,
    showAlert,
    isError,
    handleRouteCalculation,
  } = useRouteCalculation();

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
            <MapComponent />
          </Card>

          <PaquetesTimeline
            groupLabels={groupLabels}
            groupCounts={groupCounts}
            fechaSalida={fechaHoraInicioPlanificada}
            sucursalOrigen={user?.sucursal?.nombre}
          />
        </Group>
      </ScreenContainer>
    </Card>
  );
};

export default SeccionResumen;
