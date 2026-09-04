import { useEffect } from 'react';
import { Card, Flex, Pagination, Text } from '@mantine/core';
import { useSet } from '@mantine/hooks';

import PageContainer from '@components/PageContainer';
import ScreenContainer from '@components/ScreenContainer';
import SelectionBanner from '@components/SelectionBanner';

import ListaEnviosHeader from './components/ListaEnviosHeader';
import ListaEnviosFiltros from './components/ListaEnviosFiltros';
import ListaEnviosTabla from './components/ListaEnviosTabla';

import { useGetEnvios } from './hooks/useGetEnvios';

const ListaEnvios = () => {
  const { params, setPage, setFilters, refetch, enviosQuery, PAGE_LIMIT } = useGetEnvios();
  const { data = {}, isFetching: isLoading, isError } = enviosQuery;

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
      <ListaEnviosHeader />

      <ListaEnviosFiltros onFiltersChange={setFilters} disabled={isLoading} />

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
