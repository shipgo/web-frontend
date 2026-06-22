import { Flex, Title, Text, Stack } from '@mantine/core';

import ListaUsuariosCrearUser from './ListaUsuariosCrearUser';

const ListaUsuariosHeader = () => (
  <Flex justify="space-between" gap="xs" align="flex-end">
    <Stack gap="0">
      <Title order={2}>Usuarios</Title>
      <Text c="dimmed">Listado de usuarios del sistema</Text>
    </Stack>

    <ListaUsuariosCrearUser />
  </Flex>
);

export default ListaUsuariosHeader;
