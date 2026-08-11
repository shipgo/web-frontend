import { IconPackage } from "@tabler/icons-react";
import { Card, Group, Text, Title, Box, Stack, ThemeIcon } from "@mantine/core";

import EnviosPendientes from "./EnviosPendientes";
import EnviosEnViaje from "./EnviosEnViaje";

const SeccionEnvios = () => {
  return (
    <Card component={Stack} h="700">
      <Group gap="0.75rem">
        <ThemeIcon size="xl" variant="light">
          <IconPackage />
        </ThemeIcon>

        <Box>
          <Title order={4}>Selección de envíos</Title>
          <Text c="dimmed" size="sm">
            Seleccioná los envíos que se incluirán en el viaje
          </Text>
        </Box>
      </Group>

      <Group justify="space-between" flex={1}>
        <EnviosPendientes />
        <EnviosEnViaje />
      </Group>
    </Card>
  );
};

export default SeccionEnvios;
