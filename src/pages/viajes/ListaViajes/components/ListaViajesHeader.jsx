import { Link } from "wouter";
import { useDisclosure } from "@mantine/hooks";
import {
  Card,
  Stack,
  Flex,
  Title,
  Button,
  Divider,
  Collapse,
} from "@mantine/core";
import {
  IconMailPlus,
  IconFilter,
  IconUpload,
  IconShare,
} from "@tabler/icons-react";

import ListaViajesFiltros from "./ListaViajesFiltros";

const ListaViajesHeader = () => {
  const [showFilters, { toggle }] = useDisclosure(true);

  return (
    <Card component={Stack}>
      <Flex justify="space-between" gap="0.5rem" align="flex-end">
        <Title order={2}>Viajes</Title>
        <Button
          ml="auto"
          to="/crear"
          component={Link}
          leftSection={<IconMailPlus />}
        >
          Crear viaje
        </Button>

        <Button variant="light" onClick={toggle} leftSection={<IconFilter />}>
          Filtros
        </Button>

        <Button variant="subtle" leftSection={<IconUpload />}>
          Importar
        </Button>

        <Button variant="subtle" leftSection={<IconShare />}>
          Exportar
        </Button>
      </Flex>

      <Collapse in={showFilters}>
        <Divider mb="lg" />
        <ListaViajesFiltros />
      </Collapse>
    </Card>
  );
};

export default ListaViajesHeader;
