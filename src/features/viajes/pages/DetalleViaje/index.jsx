import { Card } from '@mantine/core';
import { useLocation, useParams } from 'wouter';

import PageContainer from '@components/PageContainer';
import PageBreadcrumbsHeader from '@components/PageBreadcrumbsHeader';
import ScreenContainer from '@components/ScreenContainer';

import DetalleViajeHeader from './components/DetalleViajeHeader';
import HistorialTimeline from './components/HistorialTimeline';
import RecorridosList from './components/RecorridosList';
import ViajeMapa from './components/ViajeMapa';
import { useViajeAcciones } from './hooks/useViajeAcciones';
import { useViajeDetalle } from './hooks/useViajeDetalle';

const DetalleViaje = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { viajeQuery, ubicacionQuery } = useViajeDetalle(id);
  const { data: viaje, isLoading, isError, refetch } = viajeQuery;
  const { confirmIniciar, confirmFinalizar, confirmCancelar } = useViajeAcciones(id, { onSuccess: refetch });

  return (
    <PageContainer>
      <PageBreadcrumbsHeader entidad="Viajes" accion="Detalle de viaje" />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: 'Cargando viaje...' }}
          onError={{
            show: isError,
            title: 'No se pudo cargar el viaje',
            description: 'Ocurrió un error al obtener la información del viaje.',
            onClick: refetch,
          }}
          onEmptyData={{
            show: !isLoading && !isError && !viaje,
            title: 'Viaje no encontrado',
            description: 'No encontramos información para este viaje.',
          }}
        >
          {viaje && (
            <DetalleViajeHeader
              viaje={viaje}
              id={id}
              onEditar={() => navigate(`~/viajes/${id}/editar`)}
              onIniciar={confirmIniciar}
              onFinalizar={confirmFinalizar}
              onCancelar={confirmCancelar}
            />
          )}
        </ScreenContainer>
      </Card>

      {viaje && (
        <>
          <RecorridosList recorridos={viaje.recorridos} />
          <HistorialTimeline historial={viaje.historialEstado} />
          <ViajeMapa recorridos={viaje.recorridos} estado={viaje.estado} ubicacion={ubicacionQuery.data} />
        </>
      )}
    </PageContainer>
  );
};

export default DetalleViaje;
