import { Group, Stack } from "@mantine/core";

import { IconTruckDelivery } from "@tabler/icons-react";

import { useIsMobile } from "@hooks/useIsMobile";

import SeccionPlegable from "../SeccionPlegable";
import ListadoChoferes from "./ListadoChoferes";
import ListadoVehiculos from "./ListadoVehiculos";

const SeccionRecursos = () => {
  const isMobile = useIsMobile();
  const Contenedor = isMobile ? Stack : Group;

  return (
    <SeccionPlegable
      value="recursos"
      icon={<IconTruckDelivery />}
      title="Vehículo y choferes"
      description="Asigná el vehículo y los choferes del viaje."
      cardProps={{ padding: "lg" }}
    >
      <Contenedor justify={isMobile ? undefined : "space-between"}>
        <ListadoVehiculos />
        <ListadoChoferes />
      </Contenedor>
    </SeccionPlegable>
  );
};

export default SeccionRecursos;
