import { AppShellFooter, Badge, Button, Flex, Text } from "@mantine/core";

import { useFormContext } from "./contexts/EnviosFormContext";
import useEnviosStats from "./hooks/useEnviosStats";

const Footer = () => {
  const {
    values: { vehiculo },
  } = useFormContext();

  const { totalPackages, totalStops } = useEnviosStats();

  return (
    <AppShellFooter component={Flex} justify="center">
      <Flex
        flex={1}
        maw={1440}
        px="xl"
        py="xs"
        justify="flex-end"
        align="center"
        gap="xs"
      >
        {totalPackages > 0 && (
          <Badge variant="dot" color="blue">
            {totalPackages} Envíos
          </Badge>
        )}
        {vehiculo && (
          <Badge variant="dot" color="green">
            {vehiculo.modelo} ({vehiculo.patente})
          </Badge>
        )}
        <Text size="sm" c="dimmed" fw={500} mr="auto">
          {totalStops > 0 && `${totalStops} Paradas en total`}
        </Text>
        <Button color="red" variant="light">
          Cancelar
        </Button>
        <Button>Crear viaje</Button>
      </Flex>
    </AppShellFooter>
  );
};

export default Footer;
