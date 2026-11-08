import { useEffect, useState } from 'react';
import { Box, Card, Flex, Pagination, Text } from '@mantine/core';
import { useSet } from '@mantine/hooks';

import PageContainer from '@components/PageContainer';
import ResultsCounter from '@components/ResultsCounter';
import SelectionBanner from '@components/SelectionBanner';

import { envioApi } from '@api';
import { useBulkDelete } from '@hooks/useBulkDelete';
import { useIsMobile } from '@hooks/useIsMobile';
import { useCsvExport } from '@hooks/useCsvExport';
import { useExportSelectedCsv } from '@hooks/useExportSelectedCsv';
import { listaEstados } from '@copy/common';

import ListaEnviosHeader from './components/ListaEnviosHeader';
import ListaEnviosFiltros from './components/ListaEnviosFiltros';
import ListaEnviosLista from './components/ListaEnviosLista';

import { useGetEnvios } from './hooks/useGetEnvios';
import { ENVIOS_CSV_COLUMNS } from './listaEnvios.csv';

const ESTADOS_LISTA = listaEstados({ singular: 'envío', plural: 'envíos', genero: 'm' });

// En mobile las tarjetas van sueltas (sin Card contenedora) para aprovechar el ancho.
const ListaWrapper = ({ isMobile, children }) => (isMobile ? <Box>{children}</Box> : <Card>{children}</Card>);

const ListaEnvios = () => {
  const { params, setPage, setFilters, clearFilters, refetch, enviosQuery, fetchExportRows, PAGE_LIMIT } =
    useGetEnvios();
  const isMobile = useIsMobile();
  const { data = {}, isFetching: isLoading, isError } = enviosQuery;

  // Al limpiar filtros desde el estado "vacío con filtros" hace falta también
  // remontar `ListaEnviosFiltros` (form interno propio, sin API de reset
  // expuesta) para que los inputs visibles (search/destino/fecha/estado)
  // vuelvan a `DEFAULT_VALUES` — si no, el próximo debounce del form
  // reaplicaría los valores viejos y pisaría el `clearFilters` de los params.
  const [filtrosKey, setFiltrosKey] = useState(0);
  const handleClearFilters = () => {
    clearFilters();
    setFiltrosKey((k) => k + 1);
  };

  const { exportar, isExporting } = useCsvExport({
    fetchRows: fetchExportRows,
    columns: ENVIOS_CSV_COLUMNS,
    entidad: 'envios',
    entidadLabel: 'envíos',
  });

  const selectedIds = useSet();

  useEffect(() => {
    selectedIds.clear();
  }, [data.results]);

  const { exportarSeleccionados } = useExportSelectedCsv({
    columns: ENVIOS_CSV_COLUMNS,
    entidad: 'envios-seleccionados',
    entidadLabel: 'envíos',
  });

  const { confirmBulkDelete } = useBulkDelete({
    deleteFn: (id) => envioApi.delete(id),
    singular: 'envío',
    plural: 'envíos',
    getLabel: (item) => item.codigoSeguimiento || `envío #${item.id}`,
    onSettled: () => {
      refetch();
      selectedIds.clear();
    },
  });

  const onToggle = (id) => selectedIds.has(id) ? selectedIds.delete(id) : selectedIds.add(id);
  const onToggleAll = () => {
    if (data.results?.every((i) => selectedIds.has(i.id))) {
      data.results.forEach((i) => selectedIds.delete(i.id));
    } else {
      data.results?.forEach((i) => selectedIds.add(i.id));
    }
  };

  const showPagination = data.total > PAGE_LIMIT;

  return (
    <PageContainer>
      <ListaEnviosHeader
        onExportCsv={exportar}
        isExporting={isExporting}
        exportDisabled={isLoading || isError}
      />

      <ListaEnviosFiltros
        key={filtrosKey}
        onFiltersChange={setFilters}
        disabled={isLoading}
        activeCount={Object.keys(params.filters).length}
        resultsCount={data.total}
        onClear={handleClearFilters}
      />

      <SelectionBanner
        count={selectedIds.size}
        singular="envío seleccionado"
        plural="envíos seleccionados"
        onClear={() => selectedIds.clear()}
        onExport={() => exportarSeleccionados(data.results, selectedIds)}
        onDelete={() => confirmBulkDelete((data.results ?? []).filter((item) => selectedIds.has(item.id)))}
      />

      <ListaWrapper isMobile={isMobile}>
        <ListaEnviosLista
          items={data.results}
          selectedIds={selectedIds}
          onToggle={onToggle}
          onToggleAll={onToggleAll}
          onRefresh={refetch}
          onLoading={{ show: isLoading, description: 'Cargando envíos...' }}
          onError={{ show: isError, onClick: refetch, title: ESTADOS_LISTA.error }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(params.filters).length === 0,
            title: ESTADOS_LISTA.vacioTitulo,
            description: ESTADOS_LISTA.vacioDescripcion,
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(params.filters).length > 0,
            title: ESTADOS_LISTA.sinResultadosTitulo,
            description: ESTADOS_LISTA.sinResultadosDescripcion,
            onClick: handleClearFilters,
          }}
        />
      </ListaWrapper>

      {isMobile ? (
        <ResultsCounter
          amount={data.total}
          limit={PAGE_LIMIT}
          currentPage={params.page}
          isLoading={isLoading}
          onPageChange={setPage}
          totalPages={Math.ceil(data.total / PAGE_LIMIT) || 1}
        />
      ) : (
        <Flex align="center">
          <Pagination
            value={params.page}
            onChange={setPage}
            total={Math.ceil(data.total / PAGE_LIMIT) || 1}
            disabled={!showPagination}
          />
          <Text c="dimmed" ml="auto">
            {data.total > 0
              ? `Mostrando ${(params.page - 1) * PAGE_LIMIT + 1} - ${Math.min(params.page * PAGE_LIMIT, data.total)} de ${data.total} resultados`
              : '0 resultados'}
          </Text>
        </Flex>
      )}
    </PageContainer>
  );
};

export default ListaEnvios;
