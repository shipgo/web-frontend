import { Link } from 'wouter';
import { Button } from '@mantine/core';
import { IconMailPlus } from '@tabler/icons-react';

import PageHeader from '@components/PageHeader';
import ExportCsvButton from '@components/ExportCsvButton';

// SHG-FE-097: se quitó el botón "Importar" — no tenía `onClick` (botón
// muerto, relevamiento UI 2026-09-25). La importación de envíos por CSV
// queda fuera de alcance (issue #203).
const ListaEnviosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader title="Envíos" subtitle="Listado de envíos cargados en el sistema">
    <Button to="/crear" component={Link} leftSection={<IconMailPlus />}>
      Crear envío
    </Button>
    <ExportCsvButton
      onExport={onExportCsv}
      loading={isExporting}
      disabled={exportDisabled}
    />
  </PageHeader>
);

export default ListaEnviosHeader;
