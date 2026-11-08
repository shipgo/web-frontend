import { IconFileTypeCsv, IconPlus } from '@tabler/icons-react';
import { Link } from 'wouter';

import PageHeader from '@components/PageHeader';

const ListaUsuariosHeader = ({ onExportCsv, isExporting, exportDisabled }) => (
  <PageHeader
    title="Usuarios"
    subtitle="Administrá los usuarios de la plataforma"
    primaryAction={{
      label: 'Crear usuario',
      icon: <IconPlus />,
      component: Link,
      to: '~/usuarios/crear',
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

export default ListaUsuariosHeader;
