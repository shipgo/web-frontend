import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "wouter";

import PageHeader from "@components/PageHeader";
import ExportCsvButton from "@components/ExportCsvButton";

const ListaMantenimientosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader
    title="Mantenimientos"
    subtitle="Listado de mantenimientos registrados en el sistema"
  >
    <Button to="/crear" component={Link} leftSection={<IconPlus />}>
      Registrar mantenimiento
    </Button>
    <ExportCsvButton
      onExport={onExportCsv}
      loading={isExporting}
      disabled={exportDisabled}
    />
  </PageHeader>
);

export default ListaMantenimientosHeader;
