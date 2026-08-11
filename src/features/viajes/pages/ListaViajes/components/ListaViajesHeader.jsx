import { Link } from 'wouter';
import { Button } from '@mantine/core';
import { IconMailPlus, IconShare } from '@tabler/icons-react';

import PageHeader from '@components/PageHeader';

const ListaViajesHeader = () => (
  <PageHeader title="Viajes" subtitle="Listado de viajes cargados en el sistema">
    <Button to="/crear" component={Link} leftSection={<IconMailPlus />}>
      Crear viaje
    </Button>
    <Button variant="subtle" leftSection={<IconShare />}>
      Exportar
    </Button>
  </PageHeader>
);

export default ListaViajesHeader;
