import {
  Button,
  Card,
  Collapse,
  Divider,
  Flex,
  Group,
  Pagination,
  Stack,
  Title,
} from "@mantine/core";
import { IconFilter } from "@tabler/icons-react";

import FiltersList from "@components/FiltersList";
import ResultsCounter from "@components/ResultsCounter";

import ListaUsuariosCrearUser from "./components/ListaUsuariosCrearUser";
import ListaUsuariosFiltros from "./components/ListaUsuariosFiltros";

const ListaUsuarios = () => {
  return (
    <Stack m="auto" maw="1440" mah="730px" h="100vh" gap="lg" p="lg">
      <Card>
        <Group align="flex-end" gap="xs">
          <Title order={2} mr="auto">
            Usuarios
          </Title>
          <ListaUsuariosCrearUser />
          <Button leftSection={<IconFilter />} variant="light">
            Filtros
          </Button>
        </Group>

        <Collapse in mt="sm">
          <Divider mb="sm" />
          <ListaUsuariosFiltros />
        </Collapse>
      </Card>

      <Card>
        <Flex justify="space-between">
          <FiltersList />
          <ResultsCounter />
        </Flex>
      </Card>

      <Pagination mx="auto" />
    </Stack>
  );
};

export default ListaUsuarios;
