import { Card, Flex, Pagination, Text } from "@mantine/core";

import PageContainer from "@components/PageContainer";
import ScreenContainer from "@components/ScreenContainer";

import CatalogoVehiculosHeader from "../components/CatalogoVehiculosHeader";
import ListaMarcasFiltros from "./components/ListaMarcasFiltros";
import ListaMarcasTabla from "./components/ListaMarcasTabla";

import { useGetMarcas } from "./hooks/useGetMarcas";

const PAGE_LIMIT = 10;

const ListaMarcas = () => {
  const {
    data,
    isError,
    isLoading,
    refetchMarcas,
    setPage,
    setFilters,
    params: { filters, page },
  } = useGetMarcas(PAGE_LIMIT);

  const showPagination = data.total > PAGE_LIMIT;

  return (
    <PageContainer>
      <CatalogoVehiculosHeader
        active="marcas"
        title="Marcas"
        subtitle="Listado de marcas de vehículo registradas"
        createLabel="Crear marca"
        createHref="/marcas/crear"
      />

      <ListaMarcasFiltros onFiltersChange={setFilters} disabled={isLoading} />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: "Cargando marcas..." }}
          onError={{
            show: isError,
            onClick: refetchMarcas,
            description: "Ocurrió un error al cargar las marcas",
          }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(filters).length === 0,
            title: "Sin marcas que mostrar",
            description: "Parece que no hay marcas registradas todavía",
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(filters).length > 0,
            title: "Sin resultados",
            description: "No se encontraron marcas con los filtros aplicados",
          }}
        >
          <ListaMarcasTabla items={data.results} onRefresh={refetchMarcas} />
        </ScreenContainer>
      </Card>

      <Flex align="center">
        <Pagination
          value={page}
          onChange={setPage}
          total={Math.ceil(data.total / PAGE_LIMIT) || 1}
          disabled={!showPagination}
        />
        <Text c="dimmed" ml="auto">
          {data.total > 0
            ? `Mostrando ${(page - 1) * PAGE_LIMIT + 1} - ${Math.min(page * PAGE_LIMIT, data.total)} de ${data.total} resultados`
            : "0 resultados"}
        </Text>
      </Flex>
    </PageContainer>
  );
};

export default ListaMarcas;
