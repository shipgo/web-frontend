import {
  Button,
  Card,
  Center,
  Collapse,
  Divider,
  Group,
  Flex,
  Pagination,
  Stack,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFilter } from "@tabler/icons-react";
import { isEmpty } from "es-toolkit/compat";

import FiltersList from "@components/FiltersList";
import ResultsCounter from "@components/ResultsCounter";
import ScreenContainer from "@components/ScreenContainer";

import ListaUsuariosCrearUser from "./components/ListaUsuariosCrearUser";
import ListaUsuariosFiltros from "./components/ListaUsuariosFiltros";
import ListaUsuariosTabla from "./components/ListaUsuariosTabla";

import { useGetUsuarios } from "./hooks/useGetUsuarios";

const PAGE_LIMIT = 5;

const ListaUsuarios = () => {
  const [showFilters, { toggle }] = useDisclosure(false);

  const {
    data,
    isError,
    isLoading,
    refetchUsuarios,
    setPage,
    setFilters,
    clearFilters,
    removeFilter,
    params: { filters, page },
  } = useGetUsuarios(PAGE_LIMIT);

  const showPagination = data.totalPages > 1 && !isLoading;

  return (
    <Stack m="auto" maw="1440" gap="lg" p="lg">
      <Card>
        <Flex justify="space-between" gap="xs" align="flex-end">
          <Title order={2}>Usuarios</Title>

          <Group gap="xs">
            <ListaUsuariosCrearUser />

            <Button
              leftSection={<IconFilter />}
              variant="light"
              onClick={toggle}
            >
              Filtros
            </Button>
          </Group>
        </Flex>

        <Collapse in={showFilters}>
          <Divider my="md" />
          <ListaUsuariosFiltros onFiltersChange={setFilters} />
        </Collapse>
      </Card>

      <Card component={Stack}>
        <ScreenContainer
          onLoading={{
            show: isLoading,
            description: "Cargando usuarios...",
          }}
          onError={{
            show: isError,
            onClick: refetchUsuarios,
            description: "Ocurrió un error al cargar los usuarios",
          }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(filters).length === 0,
            title: "Sin usuarios que mostrar",
            description: "Parece que no hay usuarios registrados todavía",
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && !isEmpty(filters),
            title: "Sin usuarios que mostrar",
            description: "No se encontraron usuarios con los filtros aplicados",
          }}
        >
          <Flex align="center" justify="space-between">
            <FiltersList
              filters={filters}
              onClearFilters={clearFilters}
              onFilterRemove={removeFilter}
            />

            <ResultsCounter
              limit={PAGE_LIMIT}
              currentPage={page}
              onRefresh={refetchUsuarios}
              amount={data.total}
            />
          </Flex>

          <ListaUsuariosTabla
            items={data.results}
            onRefresh={refetchUsuarios}
          />
        </ScreenContainer>
      </Card>

      {showPagination && (
        <Center>
          <Pagination
            value={page}
            variant="dots"
            onChange={setPage}
            total={data.totalPages}
          />
        </Center>
      )}
    </Stack>
  );
};

export default ListaUsuarios;
