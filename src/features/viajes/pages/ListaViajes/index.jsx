import { Card, Flex, Pagination, Stack, Text } from "@mantine/core";

import ScreenContainer from "@components/ScreenContainer";
import PageContainer from "@components/PageContainer";

import { useGetViajes } from "./hooks/useGetViajes";
import ListaViajesHeader from "./components/ListaViajesHeader";
import ListaViajesTabla from "./components/ListaViajesTabla";
import ListaViajesFiltros from "./components/ListaViajesFiltros";

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
    <PageContainer>
      <ListaViajesHeader />

      <ListaViajesFiltros />

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
          <ListaViajesTabla items={data.results} />
        </ScreenContainer>
      </Card>

      <Flex align="center" justify="space-between">
        <Pagination value={1} total={100} />
        <Text c="dimmed">Mostrando 1 - 10 de 100 resultados</Text>
      </Flex>
    </PageContainer>
  );
};

export default ListaViajes;
