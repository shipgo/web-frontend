import { IconFileTypeCsv, IconPlus } from "@tabler/icons-react";
import { Link } from "wouter";

import PageHeader from "@components/PageHeader";

const ListaVehiculosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader
    title="Vehículos"
    subtitle="Administrá la flota"
    primaryAction={{
      label: "Crear vehículo",
      icon: <IconPlus />,
      component: Link,
      to: "/crear",
    }}
    secondaryActions={[
      {
        label: "Exportar CSV",
        icon: <IconFileTypeCsv size={18} />,
        onClick: onExportCsv,
        loading: isExporting,
        disabled: exportDisabled,
      },
    ]}
  />
);

export default ListaVehiculosHeader;
