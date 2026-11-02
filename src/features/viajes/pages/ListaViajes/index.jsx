import { useEffect, useState } from 'react';
import { Card, Flex, Pagination, Text } from '@mantine/core';
import { useSet } from '@mantine/hooks';

import PageContainer from '@components/PageContainer';
import ScreenContainer from '@components/ScreenContainer';
import SelectionBanner from '@components/SelectionBanner';

import { estadoLabel, normalizarEstado } from '@domain/estados';
import { viajeApi } from '@api';
import { useBulkDelete } from '@hooks/useBulkDelete';
import { useCsvExport } from '@hooks/useCsvExport';
import { useExportSelectedCsv } from '@hooks/useExportSelectedCsv';
import { listaEstados } from '@copy/common';

import { ESTADOS_ELIMINABLES } from '../DetalleViaje/acciones';

import ListaViajesHeader from './components/ListaViajesHeader';
import ListaViajesTabla from './components/ListaViajesTabla';
import ListaViajesFiltros from './components/ListaViajesFiltros';

import { useGetViajes } from './hooks/useGetViajes';
import { VIAJES_CSV_COLUMNS } from './listaViajes.csv';

const ESTADOS_LISTA = listaEstados({ singular: 'viaje', plural: 'viajes', genero: 'm' });

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

  // `DELETE /api/viaje/{id}` sólo admite `ESTADOS_ELIMINABLES` (409 fuera de eso,
  // SHG-BE-113: `con_problemas` se cancela pero no se elimina). Se separan acá, antes
  // de confirmar (SHG-FE-106), para que el diálogo diga qué no se va a eliminar.
  // El export sí puede incluir cualquier estado.
  const onBulkDeleteViajes = () => {
    const seleccionados = (data.results ?? []).filter((item) => selectedIds.has(item.id));
    const eliminables = [];
    const excluidos = [];

    seleccionados.forEach((item) => {
      if (ESTADOS_ELIMINABLES.includes(normalizarEstado(item.estado))) {
        eliminables.push(item);
      } else {
        excluidos.push({ item, reason: `no se puede eliminar porque está ${estadoLabel('viaje', item.estado)}` });
      }
    });

    confirmBulkDelete(eliminables, excluidos);
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
