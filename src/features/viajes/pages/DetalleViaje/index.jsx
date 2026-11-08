import { Card } from '@mantine/core';
import { useLocation, useParams } from 'wouter';

import PageContainer from '@components/PageContainer';
import StickyActionBar, { STICKY_ACTION_BAR_HEIGHT } from '@components/StickyActionBar';
import { useIsMobile } from '@hooks/useIsMobile';
import { useAuthStore } from '@stores/auth.store';
import PageBreadcrumbsHeader from '@components/PageBreadcrumbsHeader';
import ScreenContainer from '@components/ScreenContainer';
import { isNotFoundError } from '@utils/httpErrors';

import DetalleViajeHeader from './components/DetalleViajeHeader';
import { buildAccionesMobile } from './accionesMobile';
import HistorialTimeline from './components/HistorialTimeline';
import RecorridosList from './components/RecorridosList';
import ViajeMapa from './components/ViajeMapa';
import { useViajeAcciones } from './hooks/useViajeAcciones';
import { useViajeDetalle } from './hooks/useViajeDetalle';

const DetalleViaje = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { viajeQuery, ubicacionQuery, historialQuery } = useViajeDetalle(id);
  const { data: viaje, isLoading, isError, error, refetch } = viajeQuery;
  const notFound = isError && isNotFoundError(error);
  const { confirmFinalizar, confirmReanudar, confirmCancelar } = useViajeAcciones(id, {
    onSuccess: refetch,
  });

  const isMobile = useIsMobile();
  const user = useAuthStore((state) => state.user);
  const accionesMobile =
    isMobile && viaje
      ? buildAccionesMobile(user, viaje, {
          onEditar: () => navigate(`~/viajes/${id}/editar`),
          onFinalizar: confirmFinalizar,
          onReanudar: confirmReanudar,
          onCancelar: confirmCancelar,
        })
      : null;

  return (
    <PageContainer pb={accionesMobile ? STICKY_ACTION_BAR_HEIGHT + 16 : undefined}>
      <PageBreadcrumbsHeader entidad="Viajes" accion="Detalle de viaje" />

      <Card>
        <ScreenContainer
          onLoading={{ show: isLoading, description: 'Cargando viaje...' }}
          onNotFound={{
            show: notFound,
            recurso: 'Viaje',
            listaHref: '~/viajes',
            listaLabel: 'Volver a viajes',
          }}
          onError={{
            show: isError && !notFound,
            title: 'No se pudo cargar el viaje',
            description: 'No pudimos cargar el viaje. Probá de nuevo en unos minutos.',
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
              onFinalizar={confirmFinalizar}
              onReanudar={confirmReanudar}
              onCancelar={confirmCancelar}
            />
          )}
        </ScreenContainer>
      </Card>

      {viaje && (
        <>
          <RecorridosList recorridos={viaje.recorridos} />
          <HistorialTimeline historial={viaje.historialEstado} />
          <ViajeMapa
            recorridos={viaje.recorridos}
            estado={viaje.estado}
            ubicacion={ubicacionQuery.data}
            historial={historialQuery.data}
          />
        </>
      )}

      {accionesMobile && (
        <StickyActionBar
          fixed
          label={accionesMobile.primary.label}
          icon={accionesMobile.primary.icon}
          color={accionesMobile.primary.color}
          onClick={accionesMobile.primary.onClick}
          actions={accionesMobile.actions}
        />
      )}
    </PageContainer>
  );
};

export default DetalleViaje;
