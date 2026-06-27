import { Button } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

import PageHeader from '@components/PageHeader';

const ListaSucursalesHeader = () => (
  <PageHeader title="Sucursales" subtitle="Listado de sucursales registradas en el sistema">
    <Button leftSection={<IconPlus />}>Crear sucursal</Button>
  </PageHeader>
);

export default ListaSucursalesHeader;
