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

import ListaVehiculosTabla from "./components/ListaVehiculosTabla";

import { useGetVehiculos } from "./hooks/useGetVehiculos";

const PAGE_LIMIT = 10;

const ListaVehiculos = () => {
  const [showFilters, { toggle }] = useDisclosure(false);

  const {
    data,
    isError,
    isLoading,
    refetchVehiculos,
    setPage,
    clearFilters,
    removeFilter,
    params: { filters, page },
  } = useGetVehiculos(PAGE_LIMIT);

  const showPagination = data.totalPages > 1 && !isLoading;

  return (
    <Stack m="auto" maw="1440" gap="lg" p="lg">
      <Card>
        <Flex justify="space-between" gap="xs" align="flex-end">
          <Title order={2}>Vehículos</Title>

          <Button
            ml="auto"
            to="/crear"
            component={Link}
            leftSection={<IconPlus />}
          >
            Agregar vehículo
          </Button>

          <Button leftSection={<IconFilter />} variant="light" onClick={toggle}>
            Filtros
          </Button>
        </Flex>

        <Collapse in={showFilters}>
          <Divider my="md" />
          {/* Aquí irían los filtros específicos de vehículos */}
        </Collapse>
      </Card>

      <Card component={Stack}>
        <ScreenContainer
          onLoading={{
            show: isLoading,
            description: "Cargando vehículos...",
          }}
          onError={{
            show: isError,
            onClick: refetchVehiculos,
            description: "Ocurrió un error al cargar los vehículos",
          }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(filters).length === 0,
            title: "Sin vehículos que mostrar",
            description: "Parece que no hay vehículos registrados todavía",
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && !isEmpty(filters),
            title: "Sin vehículos que mostrar",
            description:
              "No se encontraron vehículos con los filtros aplicados",
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
              onRefresh={refetchVehiculos}
              amount={data.total}
            />
          </Flex>

          <ListaVehiculosTabla
            items={data.results}
            onRefresh={refetchVehiculos}
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

export default ListaVehiculos;
