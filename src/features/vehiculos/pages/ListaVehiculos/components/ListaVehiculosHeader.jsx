import { Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

import PageHeader from '@components/PageHeader';

const ListaVehiculosHeader = () => (
  <PageHeader title="Vehículos" subtitle="Listado de vehículos registrados en el sistema">
    <Button leftSection={<IconPlus />}>Registrar vehículo</Button>
  </PageHeader>
);

export default ListaVehiculosHeader;
