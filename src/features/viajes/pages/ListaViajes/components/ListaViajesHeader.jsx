import { Link } from "wouter";
import {
  Flex,
  Button,
  Breadcrumbs,
  Anchor,
  Title,
  Text,
  Stack,
} from "@mantine/core";
import { IconMailPlus, IconShare } from "@tabler/icons-react";

const ListaViajesHeader = () => {
  return (
    <Flex justify="space-between" gap="0.5rem" align="flex-end">
      <Stack gap="0">
        <Breadcrumbs>
          <Title order={2}>Viajes</Title>
        </Breadcrumbs>
        <Text c="gray.6">Listado de viajes cargados en el sistema</Text>
      </Stack>

      <Button
        ml="auto"
        to="/crear"
        component={Link}
        leftSection={<IconMailPlus />}
      >
        Crear viaje
      </Button>

      <Button variant="subtle" leftSection={<IconShare />}>
        Exportar
      </Button>
    </Flex>
  );
};

export default ListaViajesHeader;
