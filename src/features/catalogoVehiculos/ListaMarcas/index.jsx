import { Card, Flex, Pagination, Text } from "@mantine/core";

import PageContainer from "@components/PageContainer";
import ScreenContainer from "@components/ScreenContainer";

import { useCsvExport } from "@hooks/useCsvExport";
import { listaEstados } from "@copy/common";

import CatalogoVehiculosHeader from "../components/CatalogoVehiculosHeader";
import ListaMarcasFiltros from "./components/ListaMarcasFiltros";
import ListaMarcasTabla from "./components/ListaMarcasTabla";

import { useGetMarcas } from "./hooks/useGetMarcas";
import { MARCAS_CSV_COLUMNS } from "./listaMarcas.csv";

const ESTADOS_LISTA = listaEstados({ singular: 'marca', plural: 'marcas', genero: 'f' });

const PAGE_LIMIT = 10;

const ListaMarcas = () => {
  const {
    data,
    isError,
    isLoading,
    refetchMarcas,
    fetchExportRows,
    setPage,
    setFilters,
    params: { filters, page },
  } = useGetMarcas(PAGE_LIMIT);

  const { exportar, isExporting } = useCsvExport({
    fetchRows: fetchExportRows,
    columns: MARCAS_CSV_COLUMNS,
    entidad: "marcas",
    entidadLabel: "marcas",
  });

  const showPagination = data.total > PAGE_LIMIT;

  return (
    <PageContainer>
      <CatalogoVehiculosHeader
        active="marcas"
        title="Marcas"
        subtitle="Administrá las marcas de vehículos"
        createLabel="Crear marca"
        createHref="/marcas/crear"
        onExportCsv={exportar}
        isExporting={isExporting}
        exportDisabled={isLoading || isError}
      />

      <ListaMarcasFiltros onFiltersChange={setFilters} />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: "Cargando marcas..." }}
          onError={{
            show: isError,
            onClick: refetchMarcas,
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
