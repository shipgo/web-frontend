import { useEffect } from 'react';
import { Card } from '@mantine/core';
import { useSet } from '@mantine/hooks';

import PageContainer from '@components/PageContainer';
import ScreenContainer from '@components/ScreenContainer';
import SelectionBanner from '@components/SelectionBanner';
import ListPagination from '@components/ListPagination';

import ListaSucursalesHeader from './components/ListaSucursalesHeader';
import ListaSucursalesFiltros from './components/ListaSucursalesFiltros';
import ListaSucursalesTabla from './components/ListaSucursalesTabla';

import { useGetSucursales } from './hooks/useGetSucursales';

const ListaSucursales = () => {
  const { params, setPage, setFilters, refetch, sucursalesQuery, PAGE_LIMIT } = useGetSucursales();
  const { data = {}, isFetching: isLoading, isError } = sucursalesQuery;

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

  return (
    <PageContainer>
      <ListaSucursalesHeader />

      <ListaSucursalesFiltros onFiltersChange={setFilters} disabled={isLoading} />

      <SelectionBanner
        count={selectedIds.size}
        singular="sucursal seleccionada"
        plural="sucursales seleccionadas"
        onClear={() => selectedIds.clear()}
      />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: 'Cargando sucursales...' }}
          onError={{ show: isError, onClick: refetch, description: 'Ocurrió un error al cargar las sucursales' }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(params.filters).length === 0,
            title: 'Sin sucursales que mostrar',
            description: 'Parece que no hay sucursales cargadas todavía',
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(params.filters).length > 0,
            title: 'Sin resultados',
            description: 'No se encontraron sucursales con los filtros aplicados',
          }}
        >
          <ListaSucursalesTabla
            items={data.results}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
          />
        </ScreenContainer>
      </Card>

      <ListPagination
        page={params.page}
        onChange={setPage}
        total={data.total}
        pageLimit={PAGE_LIMIT}
        isLoading={isLoading}
      />
    </PageContainer>
  );
};

export default ListaSucursales;
