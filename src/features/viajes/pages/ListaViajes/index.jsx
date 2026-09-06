import { useEffect } from 'react';
import { Card, Flex, Pagination, Text } from '@mantine/core';
import { useSet } from '@mantine/hooks';

import PageContainer from '@components/PageContainer';
import ScreenContainer from '@components/ScreenContainer';
import SelectionBanner from '@components/SelectionBanner';

import { useCsvExport } from '@hooks/useCsvExport';

import ListaViajesHeader from './components/ListaViajesHeader';
import ListaViajesTabla from './components/ListaViajesTabla';
import ListaViajesFiltros from './components/ListaViajesFiltros';

import { useGetViajes } from './hooks/useGetViajes';
import { VIAJES_CSV_COLUMNS } from './listaViajes.csv';

const ListaViajes = () => {
  const { params, setPage, setFilters, refetch, viajesQuery, fetchExportRows, PAGE_LIMIT } =
    useGetViajes();
  const { data = {}, isFetching: isLoading, isError } = viajesQuery;

  const { exportar, isExporting } = useCsvExport({
    fetchRows: fetchExportRows,
    columns: VIAJES_CSV_COLUMNS,
    entidad: 'viajes',
    entidadLabel: 'viajes',
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
      <ListaViajesHeader
        onExportCsv={exportar}
        isExporting={isExporting}
        exportDisabled={isLoading || isError}
      />

      <ListaViajesFiltros onFiltersChange={setFilters} disabled={isLoading} />

      <SelectionBanner
        count={selectedIds.size}
        singular="viaje seleccionado"
        plural="viajes seleccionados"
        onClear={() => selectedIds.clear()}
      />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: 'Cargando viajes...' }}
          onError={{ show: isError, onClick: refetch, description: 'Ocurrió un error al cargar los viajes' }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(params.filters).length === 0,
            title: 'Sin viajes que mostrar',
            description: 'Parece que no cargaste ningún viaje todavía',
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(params.filters).length > 0,
            title: 'Sin viajes que mostrar',
            description: 'No se encontraron viajes con los filtros aplicados',
          }}
        >
          <ListaViajesTabla
            items={data.results}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
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

export default ListaViajes;
