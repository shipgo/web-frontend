import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "wouter";

import PageHeader from "@components/PageHeader";

const ListaVehiculosHeader = () => (
  <PageHeader
    title="Vehículos"
    subtitle="Listado de vehículos registrados en el sistema"
  >
    <Button to="/crear" component={Link} leftSection={<IconPlus />}>
      Registrar vehículo
    </Button>
  </PageHeader>
);

export default ListaVehiculosHeader;
