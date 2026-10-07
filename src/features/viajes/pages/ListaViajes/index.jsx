import { useEffect, useState } from 'react';
import { Card, Flex, Pagination, Text } from '@mantine/core';
import { useSet } from '@mantine/hooks';

import PageContainer from '@components/PageContainer';
import ScreenContainer from '@components/ScreenContainer';
import SelectionBanner from '@components/SelectionBanner';

import { normalizarEstado } from '@domain/estados';
import { viajeApi } from '@api';
import { useBulkDelete } from '@hooks/useBulkDelete';
import { useCsvExport } from '@hooks/useCsvExport';
import { useExportSelectedCsv } from '@hooks/useExportSelectedCsv';

import { ESTADOS_CANCELABLES } from '../DetalleViaje/acciones';

import ListaViajesHeader from './components/ListaViajesHeader';
import ListaViajesTabla from './components/ListaViajesTabla';
import ListaViajesFiltros from './components/ListaViajesFiltros';

import { useGetViajes } from './hooks/useGetViajes';
import { VIAJES_CSV_COLUMNS } from './listaViajes.csv';

const ListaViajes = () => {
  const { params, setPage, setFilters, clearFilters, refetch, viajesQuery, fetchExportRows, PAGE_LIMIT } =
    useGetViajes();
  const { data = {}, isFetching: isLoading, isError } = viajesQuery;

  // Idem `ListaEnvios`: remontar `ListaViajesFiltros` al limpiar filtros para
  // que el form interno (sin API de reset propia) vuelva a `DEFAULT_VALUES`.
  const [filtrosKey, setFiltrosKey] = useState(0);
  const handleClearFilters = () => {
    clearFilters();
    setFiltrosKey((k) => k + 1);
  };

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

  const { exportarSeleccionados } = useExportSelectedCsv({
    columns: VIAJES_CSV_COLUMNS,
    entidad: 'viajes-seleccionados',
    entidadLabel: 'viajes',
  });

  const { confirmBulkDelete } = useBulkDelete({
    deleteFn: (id) => viajeApi.delete(id),
    singular: 'viaje',
    plural: 'viajes',
    getLabel: (item) => `viaje #${item.id}`,
    onSettled: () => {
      refetch();
      selectedIds.clear();
    },
  });

  // `DELETE /api/viaje/{id}` sólo admite creado / planificado /
  // en_proceso_de_carga (409 fuera de eso, SHG-BE-075). Igual se separan acá,
  // ANTES de confirmar (SHG-FE-106), para que el diálogo diga qué no se va a
  // eliminar en vez de prometer N y fallar después: se filtra por `ESTADOS_CANCELABLES` (misma matriz que `puedeCancelar`
  // en `DetalleViaje/acciones.js`) ANTES de llamar a `deleteFn`, así el bulk
  // delete nunca le pega al backend con un viaje no cancelable. El export sí
  // puede incluir cualquier estado (no se toca `exportarSeleccionados`).
  const onBulkDeleteViajes = () => {
    const seleccionados = (data.results ?? []).filter((item) => selectedIds.has(item.id));
    const cancelables = [];
    const excluidos = [];

    seleccionados.forEach((item) => {
      if (ESTADOS_CANCELABLES.includes(normalizarEstado(item.estado))) {
        cancelables.push(item);
      } else {
        excluidos.push({ item, reason: 'no se puede eliminar en su estado actual' });
      }
    });

    confirmBulkDelete(cancelables, excluidos);
  };

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

      <ListaViajesFiltros key={filtrosKey} onFiltersChange={setFilters} disabled={isLoading} />

      <SelectionBanner
        count={selectedIds.size}
        singular="viaje seleccionado"
        plural="viajes seleccionados"
        onClear={() => selectedIds.clear()}
        onExport={() => exportarSeleccionados(data.results, selectedIds)}
        onDelete={onBulkDeleteViajes}
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
            onClick: handleClearFilters,
          }}
        >
          <ListaViajesTabla
            items={data.results}
            selectedIds={selectedIds}
            onToggle={onToggle}
            onToggleAll={onToggleAll}
            onCancelSuccess={refetch}
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
