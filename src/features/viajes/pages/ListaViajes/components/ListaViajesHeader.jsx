import { Link } from 'wouter';
import { Button } from '@mantine/core';
import { IconMailPlus } from '@tabler/icons-react';

import PageHeader from '@components/PageHeader';
import ExportCsvButton from '@components/ExportCsvButton';

const ListaViajesHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader title="Viajes" subtitle="Listado de viajes cargados en el sistema">
    <Button to="/crear" component={Link} leftSection={<IconMailPlus />}>
      Crear viaje
    </Button>
    <ExportCsvButton
      onExport={onExportCsv}
      loading={isExporting}
      disabled={exportDisabled}
    />
  </PageHeader>
);

export default ListaViajesHeader;
