import { Link } from 'wouter';
import { Button } from '@mantine/core';
import { IconMailPlus, IconUpload } from '@tabler/icons-react';

import PageHeader from '@components/PageHeader';
import ExportCsvButton from '@components/ExportCsvButton';

const ListaEnviosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader title="Envíos" subtitle="Listado de envíos cargados en el sistema">
    <Button to="/crear" component={Link} leftSection={<IconMailPlus />}>
      Crear envío
    </Button>
    <Button variant="subtle" leftSection={<IconUpload />}>
      Importar
    </Button>
    <ExportCsvButton
      onExport={onExportCsv}
      loading={isExporting}
      disabled={exportDisabled}
    />
  </PageHeader>
);

export default ListaEnviosHeader;
