import { Card, Center, Flex, Pagination, Stack } from "@mantine/core";

import FiltersList from "@components/FiltersList";
import ResultsCounter from "@components/ResultsCounter";
import ScreenContainer from "@components/ScreenContainer";

import { useGetViajes } from "./hooks/useGetViajes";
import ListaViajesHeader from "./components/ListaViajesHeader";
import ListaViajesTabla from "./components/ListaViajesTabla";

const PAGE_LIMIT = 10;

const ListaViajes = () => {
  const {
    data,
    isError,
    isLoading,
    refetchViajes,
    setPage,
    clearFilters,
    removeFilter,
    params: { filters, page },
  } = useGetViajes(PAGE_LIMIT);

  const showPagination = data.total > PAGE_LIMIT;

  return (
    <Stack gap="s" m="auto" maw="1440" p="lg">
      <ListaViajesHeader />

      <Card component={Stack}>
        <ScreenContainer
          onLoading={{
            show: isLoading,
            description: "Cargando viajes...",
          }}
          // onError={{
          //   show: isError,
          //   onClick: refetchViajes,
          //   description: 'Ocurrió un error al cargar los viajes',
          // }}
          // onEmptyData={{
          //   show: data.total === 0 && Object.keys(filters).length === 0,
          //   title: 'Sin viajes que mostrar',
          //   description: 'Parece que no cargaste ningún viaje todavía',
          // }}
          // onEmptyFiltersData={{
          //   show: data.total === 0 && Object.keys(filters).length > 0,
          //   title: 'Sin viajes que mostrar',
          //   description: 'No se encontraron viajes con los filtros aplicados',
          // }}
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
              onRefresh={refetchViajes}
              amount={data.total}
            />
          </Flex>

          <ListaViajesTabla items={data.results} />
        </ScreenContainer>
      </Card>

      {showPagination && (
        <Center>
          <Pagination
            value={page}
            variant="dots"
            onChange={setPage}
            total={data?.totalPages}
          />
        </Center>
      )}
    </Stack>
  );
};

export default ListaViajes;
