import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "wouter";

import PageHeader from "@components/PageHeader";
import ExportCsvButton from "@components/ExportCsvButton";

const ListaMantenimientosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader
    title="Mantenimientos"
    subtitle="Seguí los mantenimientos de la flota"
  >
    <Button to="/crear" component={Link} leftSection={<IconPlus />}>
      Crear mantenimiento
    </Button>
    <ExportCsvButton
      onExport={onExportCsv}
      loading={isExporting}
      disabled={exportDisabled}
    />
  </PageHeader>
);

export default ListaMantenimientosHeader;
