import { Link } from 'wouter';
import { Flex, Button, Title, Text, Stack } from '@mantine/core';
import { IconMailPlus, IconShare, IconUpload } from '@tabler/icons-react';

const ListaEnviosHeader = () => (
  <Flex justify="space-between" gap="xs" align="flex-end">
    <Stack gap="0">
      <Title order={2}>Envíos</Title>
      <Text c="dimmed">Listado de envíos cargados en el sistema</Text>
    </Stack>

    <Button ml="auto" to="/crear" component={Link} leftSection={<IconMailPlus />}>
      Crear envío
    </Button>

    <Button variant="subtle" leftSection={<IconUpload />}>
      Importar
    </Button>

    <Button variant="subtle" leftSection={<IconShare />}>
      Exportar
    </Button>
  </Flex>
);

export default ListaEnviosHeader;
