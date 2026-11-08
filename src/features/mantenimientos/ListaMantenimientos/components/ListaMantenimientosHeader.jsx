import { IconFileTypeCsv, IconPlus } from "@tabler/icons-react";
import { Link } from "wouter";

import PageHeader from "@components/PageHeader";

const ListaMantenimientosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader
    title="Mantenimientos"
    subtitle="Seguí los mantenimientos de la flota"
    primaryAction={{
      label: "Crear mantenimiento",
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

export default ListaMantenimientosHeader;
