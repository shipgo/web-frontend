import { Link } from 'wouter';
import { Button } from '@mantine/core';
import { IconMailPlus, IconShare, IconUpload } from '@tabler/icons-react';

import PageHeader from '@components/PageHeader';

const ListaEnviosHeader = () => (
  <PageHeader title="Envíos" subtitle="Listado de envíos cargados en el sistema">
    <Button to="/crear" component={Link} leftSection={<IconMailPlus />}>
      Crear envío
    </Button>
    <Button variant="subtle" leftSection={<IconUpload />}>
      Importar
    </Button>
    <Button variant="subtle" leftSection={<IconShare />}>
      Exportar
    </Button>
  </PageHeader>
);

export default ListaEnviosHeader;
