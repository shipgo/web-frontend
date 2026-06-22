import { Flex, Button, Title, Text, Stack } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';

const ListaSucursalesHeader = () => (
  <Flex justify="space-between" gap="xs" align="flex-end">
    <Stack gap="0">
      <Title order={2}>Sucursales</Title>
      <Text c="dimmed">Listado de sucursales registradas en el sistema</Text>
    </Stack>

    <Button ml="auto" leftSection={<IconPlus />}>
      Crear sucursal
    </Button>
  </Flex>
);

export default ListaSucursalesHeader;
