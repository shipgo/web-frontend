import { Stack, Card, Group, Text, Title, Box, ThemeIcon } from "@mantine/core";

import { IconTruckDelivery } from "@tabler/icons-react";

import ListadoVehiculos from "./components/ListadoVehiculos";
import ListadoChoferes from "./components/ListadoChoferes";

const SeccionRecursos = () => {
  return (
    <Card padding="lg" component={Stack}>
      <Group gap="0.75rem">
        <ThemeIcon size="xl" variant="light">
          <IconTruckDelivery />
        </ThemeIcon>

        <Box>
          <Title order={4}>Asignación de recursos</Title>
          <Text c="gray.6" size="sm">
            Asigná el vehículo y el chofer al viaje
          </Text>
        </Box>
      </Group>

      <Group justify="space-between">
        <ListadoVehiculos />
        <ListadoChoferes />
      </Group>
    </Card>
  );
};

export default SeccionRecursos;
