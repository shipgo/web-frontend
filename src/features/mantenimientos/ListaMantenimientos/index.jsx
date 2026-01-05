import {
  Button,
  Card,
  Center,
  Collapse,
  Divider,
  Flex,
  Pagination,
  Stack,
  Title,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { IconFilter, IconPlus } from "@tabler/icons-react";
import { isEmpty } from "es-toolkit/compat";
import { Link } from "wouter";

import FiltersList from "@components/FiltersList";
import ResultsCounter from "@components/ResultsCounter";
import ScreenContainer from "@components/ScreenContainer";

import ListaMantenimientosTabla from "./components/ListaMantenimientosTabla";

import { useGetMantenimientos } from "./hooks/useGetMantenimientos";

const PAGE_LIMIT = 10;

const ListaMantenimientos = () => {
  const [showFilters, { toggle }] = useDisclosure(false);

  const {
    data,
    isError,
    isLoading,
    refetchMantenimientos,
    setPage,
    clearFilters,
    removeFilter,
    params: { filters, page },
  } = useGetMantenimientos(PAGE_LIMIT);

  const showPagination = data.totalPages > 1 && !isLoading;

  return (
    <Stack m="auto" maw="1440" gap="lg" p="lg">
      <Card>
        <Flex justify="space-between" gap="xs" align="flex-end">
          <Title order={2}>Mantenimientos</Title>

          <Button
            ml="auto"
            to="/crear"
            component={Link}
            leftSection={<IconPlus />}
          >
            Programar mantenimiento
          </Button>

          <Button leftSection={<IconFilter />} variant="light" onClick={toggle}>
            Filtros
          </Button>
        </Flex>

        <Collapse in={showFilters}>
          <Divider my="md" />
          {/* Aquí irían los filtros específicos de mantenimientos */}
        </Collapse>
      </Card>

      <Card component={Stack}>
        <ScreenContainer
          onLoading={{
            show: isLoading,
            description: "Cargando mantenimientos...",
          }}
          onError={{
            show: isError,
            onClick: refetchMantenimientos,
            description: "Ocurrió un error al cargar los mantenimientos",
          }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(filters).length === 0,
            title: "Sin mantenimientos que mostrar",
            description: "Parece que no hay mantenimientos programados todavía",
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && !isEmpty(filters),
            title: "Sin mantenimientos que mostrar",
            description: "No se encontraron mantenimientos con los filtros aplicados",
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
              onRefresh={refetchMantenimientos}
              amount={data.total}
            />
          </Flex>

          <ListaMantenimientosTabla
            items={data.results}
            onRefresh={refetchMantenimientos}
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

export default ListaMantenimientos;

