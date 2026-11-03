import { Card, Flex, Pagination, Text } from "@mantine/core";

import PageContainer from "@components/PageContainer";
import ScreenContainer from "@components/ScreenContainer";

import { useCsvExport } from "@hooks/useCsvExport";
import { listaEstados } from "@copy/common";

import CatalogoVehiculosHeader from "../components/CatalogoVehiculosHeader";
import ListaModelosFiltros from "./components/ListaModelosFiltros";
import ListaModelosTabla from "./components/ListaModelosTabla";

import { useGetModelos } from "./hooks/useGetModelos";
import { MODELOS_CSV_COLUMNS } from "./listaModelos.csv";

const ESTADOS_LISTA = listaEstados({ singular: 'modelo', plural: 'modelos', genero: 'm' });

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
        subtitle="Administrá los modelos de vehículos"
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
            title: ESTADOS_LISTA.error,
          }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(filters).length === 0,
            title: ESTADOS_LISTA.vacioTitulo,
            description: ESTADOS_LISTA.vacioDescripcion,
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(filters).length > 0,
            title: ESTADOS_LISTA.sinResultadosTitulo,
            description: ESTADOS_LISTA.sinResultadosDescripcion,
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
