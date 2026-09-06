import { Button } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";
import { Link } from "wouter";

import PageHeader from "@components/PageHeader";
import ExportCsvButton from "@components/ExportCsvButton";

const ListaVehiculosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader
    title="Vehículos"
    subtitle="Listado de vehículos registrados en el sistema"
  >
    <Button to="/crear" component={Link} leftSection={<IconPlus />}>
      Registrar vehículo
    </Button>
    <ExportCsvButton
      onExport={onExportCsv}
      loading={isExporting}
      disabled={exportDisabled}
    />
  </PageHeader>
);

export default ListaVehiculosHeader;
