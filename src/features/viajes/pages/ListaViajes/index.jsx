import { useEffect } from 'react';
import { Card } from '@mantine/core';
import { useSet } from '@mantine/hooks';
import { useQuery } from '@tanstack/react-query';

import { useParams } from '@hooks/useParams';
import ScreenContainer from '@components/ScreenContainer';
import PageContainer from '@components/PageContainer';
import SelectionBanner from '@components/SelectionBanner';
import ListPagination from '@components/ListPagination';

import ListaViajesHeader from './components/ListaViajesHeader';
import ListaViajesTabla from './components/ListaViajesTabla';
import ListaViajesFiltros from './components/ListaViajesFiltros';

const PAGE_LIMIT = 10;
const VIAJES = [
  {
    id: '1SDG56FHY4D',
    fecha: '2026-03-15T10:00:00Z',
    estado: 'Planificado',
    chofer: { nombre: 'Juan Perez' },
    vehiculo: { patente: 'ABC123', capacidad: 3000 },
    carga: { envios: 15, bultos: 30, peso: 4500 },
    paquetes_entregados: 0,
  },
  {
    id: '2ASD89GHJ12',
    fecha: '2026-03-12T03:00:00Z',
    estado: 'ASIGNADO',
    chofer: { nombre: 'Daniel Gomez' },
    vehiculo: { patente: 'DEF456', capacidad: 2000 },
    carga: { envios: 10, bultos: 20, peso: 3000 },
    paquetes_entregados: 0,
  },
  {
    id: '3GHJ12KLM34',
    fecha: new Date(),
    estado: 'EN CURSO',
    chofer: { nombre: 'Martin Garcia' },
    vehiculo: { patente: 'GHI789', capacidad: 2500 },
    carga: { envios: 5, bultos: 10, peso: 2500 },
    paquetes_entregados: 4,
  },
  {
    id: '4JKL34MNO56',
    fecha: '2026-03-10T08:00:00Z',
    estado: 'FINALIZADO',
    chofer: { nombre: 'Lucas Garcia' },
    vehiculo: { patente: 'JKL012', capacidad: 4000 },
    carga: { envios: 20, bultos: 40, peso: 4000 },
    paquetes_entregados: 20,
  },
  {
    id: '5MNO56PQR78',
    fecha: '2026-03-11T12:00:00Z',
    estado: 'INTERRUMPIDO',
    chofer: { nombre: 'Andres Martinez' },
    vehiculo: { patente: 'MNO345', capacidad: 3500 },
    carga: { envios: 5, bultos: 16, peso: 2800 },
    paquetes_entregados: 1,
  },
];

const getViajes = (params, pageLimit) =>
  new Promise((resolve) => {
    const offset = (params.page - 1) * pageLimit;
    setTimeout(() => {
      resolve({
        total: VIAJES.length,
        results: VIAJES.slice(offset, offset + pageLimit),
        totalPages: Math.ceil(VIAJES.length / pageLimit),
      });
    }, 1000);
  });

const ListaViajes = () => {
  const { params, setFilters, setPage } = useParams();

  const { isError, data = {}, isFetching: isLoading, refetch: refetchViajes } = useQuery({
    queryFn: () => getViajes(params, PAGE_LIMIT),
    queryKey: ['viajes', JSON.stringify(params)],
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

  return (
    <PageContainer>
      <ListaViajesHeader />

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
          onError={{ show: isError, onClick: refetchViajes, description: 'Ocurrió un error al cargar los viajes' }}
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

export default ListaViajes;
