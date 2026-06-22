import { Card, Stack, Group } from "@mantine/core";

import { Map as MapComponent } from "@components";
import ScreenContainer from "@components/ScreenContainer";
import useRouteCalculation from "../hooks/useRouteCalculation";

import SeccionHeader from "./SeccionHeader";
import PaquetesTimeline from "./PaquetesTimeline";

const SeccionResumen = () => {
  const {
    data,
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
        onEmptyData={{
          show: data === undefined,
          title: "No hay ruta calculada",
          description:
            "Seleccioná al menos un envío y clickeá en el botón para generar el trayecto sugerido",
        }}
      >
        <Group pos="relative">
          <Card withBorder shadow="0" p="0" h={400} flex={1}>
            <MapComponent />
          </Card>

          <PaquetesTimeline route={data} />
        </Group>
      </ScreenContainer>
    </Card>
  );
};

export default SeccionResumen;
