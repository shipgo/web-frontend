import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "wouter";

import PageHeader from "@components/PageHeader";
import ExportCsvButton from "@components/ExportCsvButton";

const ListaVehiculosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader
    title="Vehículos"
    subtitle="Administrá la flota"
  >
    <Button to="/crear" component={Link} leftSection={<IconPlus />}>
      Crear vehículo
    </Button>
    <ExportCsvButton
      onExport={onExportCsv}
      loading={isExporting}
      disabled={exportDisabled}
    />
  </PageHeader>
);

export default ListaVehiculosHeader;
