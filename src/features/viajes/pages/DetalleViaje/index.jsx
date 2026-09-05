import { Card } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useLocation, useParams } from 'wouter';

import PageContainer from '@components/PageContainer';
import ScreenContainer from '@components/ScreenContainer';

import DetalleViajeHeader from './components/DetalleViajeHeader';
import HistorialTimeline from './components/HistorialTimeline';
import RecorridosList from './components/RecorridosList';
import ViajeMapa from './components/ViajeMapa';
import { useViajeDetalle } from './hooks/useViajeDetalle';

const showAccionPendiente = () =>
  notifications.show({
    title: 'Próximamente',
    message: 'Esta acción se habilita en una futura actualización (SHG-FE-012).',
    color: 'blue',
  });

const DetalleViaje = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { viajeQuery, ubicacionQuery } = useViajeDetalle(id);
  const { data: viaje, isLoading, isError, refetch } = viajeQuery;

  return (
    <PageContainer>
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
              onVolver={() => navigate('~/viajes')}
              onEditar={() => navigate(`~/viajes/${id}/editar`)}
              onAccionPendiente={showAccionPendiente}
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
