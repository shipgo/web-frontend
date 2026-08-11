import { useEffect } from 'react';
import { Card } from '@mantine/core';
import { useSet } from '@mantine/hooks';

import PageContainer from '@components/PageContainer';
import ScreenContainer from '@components/ScreenContainer';
import SelectionBanner from '@components/SelectionBanner';
import ListPagination from '@components/ListPagination';

import ListaVehiculosHeader from './components/ListaVehiculosHeader';
import ListaVehiculosFiltros from './components/ListaVehiculosFiltros';
import ListaVehiculosTabla from './components/ListaVehiculosTabla';

import { useGetVehiculos } from './hooks/useGetVehiculos';

const ListaVehiculos = () => {
  const { params, setPage, setFilters, refetch, vehiculosQuery, PAGE_LIMIT } = useGetVehiculos();
  const { data = {}, isFetching: isLoading, isError } = vehiculosQuery;

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
      <ListaVehiculosHeader />

      <ListaVehiculosFiltros onFiltersChange={setFilters} disabled={isLoading} />

      <SelectionBanner
        count={selectedIds.size}
        singular="vehículo seleccionado"
        plural="vehículos seleccionados"
        onClear={() => selectedIds.clear()}
      />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: 'Cargando vehículos...' }}
          onError={{ show: isError, onClick: refetch, description: 'Ocurrió un error al cargar los vehículos' }}
          onEmptyData={{
            show: data.total === 0 && Object.keys(params.filters).length === 0,
            title: 'Sin vehículos que mostrar',
            description: 'Parece que no hay vehículos registrados todavía',
          }}
          onEmptyFiltersData={{
            show: data.total === 0 && Object.keys(params.filters).length > 0,
            title: 'Sin resultados',
            description: 'No se encontraron vehículos con los filtros aplicados',
          }}
        >
          <ListaVehiculosTabla
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

export default ListaVehiculos;
