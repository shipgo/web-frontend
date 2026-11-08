import { IconPlus } from "@tabler/icons-react";
import { Link } from "wouter";

import PageHeader from "@components/PageHeader";

const ListaSucursalesHeader = () => (
  <PageHeader
    title="Sucursales"
    subtitle="Administrá tus sucursales"
    primaryAction={{
      label: "Crear sucursal",
      icon: <IconPlus />,
      component: Link,
      to: "/crear",
    }}
  />
);

export default ListaSucursalesHeader;
