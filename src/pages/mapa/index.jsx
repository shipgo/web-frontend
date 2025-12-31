import { Flex } from "@mantine/core";

import MapCard from "./components/MapCard";
import MapListadoViajes from "./components/MapListadoViajes";

import SelectedViajeProvider from "./providers/selectedViaje";

const Mapa = ({ selectedTrip }) => {
  return (
    <SelectedViajeProvider>
      <Flex m="auto" maw="1440" mah="730px" h="100vh" gap="lg" p="lg">
        <MapListadoViajes />
        <MapCard />
      </Flex>
    </SelectedViajeProvider>
  );
};

export default Mapa;
