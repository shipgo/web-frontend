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

import ListaSucursalesTabla from "./components/ListaSucursalesTabla";

import { useGetSucursales } from "./hooks/useGetSucursales";

const PAGE_LIMIT = 10;

const ListaSucursales = () => {
  const [showFilters, { toggle }] = useDisclosure(false);

  const {
    data,
    isError,
    isLoading,
    refetchSucursales,
    setPage,
    clearFilters,
    removeFilter,
    params: { filters, page },
  } = useGetSucursales(PAGE_LIMIT);

  const showPagination = data.totalPages > 1 && !isLoading;

  return (
    <Stack m="auto" maw="1440" gap="lg" p="lg">
      <Card>
        <Flex justify="space-between" gap="xs" align="flex-end">
          <Title order={2}>Sucursales</Title>

          <Button
            ml="auto"
            to="/sucursales/crear"
            component={Link}
            leftSection={<IconPlus />}
          >
            Agregar sucursal
          </Button>

          <Button leftSection={<IconFilter />} variant="light" onClick={toggle}>
            Filtros
          </Button>
        </Flex>

        <Collapse in={showFilters}>
          <Divider my="md" />
          {/* Aquí irían los filtros específicos de sucursales */}
        </Collapse>
      </Card>

      <Card component={Stack}>
        <ScreenContainer
          onLoading={{
            show: isLoading,
            description: "Cargando sucursales...",
          }}
          onError={{
            show: isError,
            onClick: refetchSucursales,
            description: "Ocurrió un error al cargar las sucursales",
          }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(filters).length === 0,
            title: "Sin sucursales que mostrar",
            description: "Parece que no hay sucursales registradas todavía",
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && !isEmpty(filters),
            title: "Sin sucursales que mostrar",
            description: "No se encontraron sucursales con los filtros aplicados",
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
              onRefresh={refetchSucursales}
              amount={data.total}
            />
          </Flex>

          <ListaSucursalesTabla items={data.results} />
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

export default ListaSucursales;

