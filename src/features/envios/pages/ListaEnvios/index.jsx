import { useEffect, useState } from 'react';
import { Card, Flex, Pagination, Text } from '@mantine/core';
import { useSet } from '@mantine/hooks';

import PageContainer from '@components/PageContainer';
import ScreenContainer from '@components/ScreenContainer';
import SelectionBanner from '@components/SelectionBanner';

import { useCsvExport } from '@hooks/useCsvExport';

import ListaEnviosHeader from './components/ListaEnviosHeader';
import ListaEnviosFiltros from './components/ListaEnviosFiltros';
import ListaEnviosTabla from './components/ListaEnviosTabla';

import { useGetEnvios } from './hooks/useGetEnvios';
import { ENVIOS_CSV_COLUMNS } from './listaEnvios.csv';

const ListaEnvios = () => {
  const { params, setPage, setFilters, clearFilters, refetch, enviosQuery, fetchExportRows, PAGE_LIMIT } =
    useGetEnvios();
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

      <ListaEnviosFiltros key={filtrosKey} onFiltersChange={setFilters} disabled={isLoading} />

      <SelectionBanner
        count={selectedIds.size}
        singular="envío seleccionado"
        plural="envíos seleccionados"
        onClear={() => selectedIds.clear()}
      />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: 'Cargando envíos...' }}
          onError={{ show: isError, onClick: refetch, description: 'Ocurrió un error al cargar los envíos' }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(params.filters).length === 0,
            title: 'Sin envíos que mostrar',
            description: 'Parece que no cargaste ningún envío todavía',
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(params.filters).length > 0,
            title: 'Sin resultados',
            description: 'No se encontraron envíos con los filtros aplicados',
            onClick: handleClearFilters,
          }}
        >
          <ListaEnviosTabla
            items={data.results}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
            onRefresh={refetch}
          />
        </ScreenContainer>
      </Card>

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
    </PageContainer>
  );
};

export default ListaEnvios;
