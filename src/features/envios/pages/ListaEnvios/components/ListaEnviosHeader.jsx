import { Link } from 'wouter';
import { IconFileTypeCsv, IconMailPlus } from '@tabler/icons-react';

import PageHeader from '@components/PageHeader';

// SHG-FE-097: se quitó el botón "Importar" — no tenía `onClick` (botón
// muerto, relevamiento UI 2026-09-25). La importación de envíos por CSV
// queda fuera de alcance (issue #203).
// Web mobile: "Crear envío" pasa a ser el ícono principal y "Exportar CSV" va
// al menú de tres puntos (PageHeader resuelve la variante según el ancho).
const ListaEnviosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader
    title="Envíos"
    subtitle="Seguí y administrá tus envíos"
    primaryAction={{ label: 'Crear envío', icon: <IconMailPlus />, component: Link, to: '/crear' }}
    secondaryActions={[
      {
        label: 'Exportar CSV',
        icon: <IconFileTypeCsv size={18} />,
        onClick: onExportCsv,
        loading: isExporting,
        disabled: exportDisabled,
      },
    ]}
  />
);

export default ListaEnviosHeader;
