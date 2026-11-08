import { Link } from 'wouter';
import { IconFileTypeCsv, IconMailPlus } from '@tabler/icons-react';

import PageHeader from '@components/PageHeader';

const ListaViajesHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader
    title="Viajes"
    subtitle="Planificá y seguí tus viajes"
    primaryAction={{
      label: 'Crear viaje',
      icon: <IconMailPlus />,
      component: Link,
      to: '/crear',
    }}
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

export default ListaViajesHeader;
