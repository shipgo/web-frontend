import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "wouter";

import PageHeader from "@components/PageHeader";

const ListaMantenimientosHeader = () => (
  <PageHeader
    title="Mantenimientos"
    subtitle="Listado de mantenimientos registrados en el sistema"
  >
    <Button to="/crear" component={Link} leftSection={<IconPlus />}>
      Registrar mantenimiento
    </Button>
  </PageHeader>
);

export default ListaMantenimientosHeader;
