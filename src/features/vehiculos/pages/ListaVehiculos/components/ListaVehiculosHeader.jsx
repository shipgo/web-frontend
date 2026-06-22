import { Flex, Button, Title, Text, Stack } from "@mantine/core";
import { IconPlus } from "@tabler/icons-react";

const ListaVehiculosHeader = () => (
  <Flex justify="space-between" gap="xs" align="flex-end">
    <Stack gap="0">
      <Title order={2}>Vehículos</Title>
      <Text c="dimmed">Listado de vehículos registrados en el sistema</Text>
    </Stack>

    <Button ml="auto" leftSection={<IconPlus />}>
      Registrar vehículo
    </Button>
  </Flex>
);

export default ListaVehiculosHeader;
