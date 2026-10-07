import { Card, Flex, Pagination, Text } from "@mantine/core";

import PageContainer from "@components/PageContainer";
import ScreenContainer from "@components/ScreenContainer";

import { useCsvExport } from "@hooks/useCsvExport";

import CatalogoVehiculosHeader from "../components/CatalogoVehiculosHeader";
import ListaModelosFiltros from "./components/ListaModelosFiltros";
import ListaModelosTabla from "./components/ListaModelosTabla";

import { useGetModelos } from "./hooks/useGetModelos";
import { MODELOS_CSV_COLUMNS } from "./listaModelos.csv";

const PAGE_LIMIT = 10;

const ListaModelos = () => {
  const {
    data,
    isError,
    isLoading,
    refetchModelos,
    fetchExportRows,
    setPage,
    setFilters,
    params: { filters, page },
  } = useGetModelos(PAGE_LIMIT);

  const { exportar, isExporting } = useCsvExport({
    fetchRows: fetchExportRows,
    columns: MODELOS_CSV_COLUMNS,
    entidad: "modelos",
    entidadLabel: "modelos",
  });

  const showPagination = data.total > PAGE_LIMIT;

  return (
    <PageContainer>
      <CatalogoVehiculosHeader
        active="modelos"
        title="Modelos"
        subtitle="Listado de modelos de vehículo registrados"
        createLabel="Crear modelo"
        createHref="/modelos/crear"
        onExportCsv={exportar}
        isExporting={isExporting}
        exportDisabled={isLoading || isError}
      />

      <ListaModelosFiltros onFiltersChange={setFilters} />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: "Cargando modelos..." }}
          onError={{
            show: isError,
            onClick: refetchModelos,
            description: "Ocurrió un error al cargar los modelos",
          }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(filters).length === 0,
            title: "Sin modelos que mostrar",
            description: "Parece que no hay modelos registrados todavía",
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(filters).length > 0,
            title: "Sin resultados",
            description: "No se encontraron modelos con los filtros aplicados",
          }}
        >
          <ListaModelosTabla items={data.results} onRefresh={refetchModelos} />
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

export default ListaModelos;
