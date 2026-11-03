import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "wouter";

import PageHeader from "@components/PageHeader";

const ListaSucursalesHeader = () => (
  <PageHeader
    title="Sucursales"
    subtitle="Administrá tus sucursales"
  >
    <Button to="/crear" component={Link} leftSection={<IconPlus />}>
      Crear sucursal
    </Button>
  </PageHeader>
);

export default ListaSucursalesHeader;
