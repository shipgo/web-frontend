import { Fragment, useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { Card, Divider, Group, Pagination, Stack, Text, Title } from '@mantine/core';
import { IconBellOff } from '@tabler/icons-react';

import PageContainer from '@components/PageContainer';
import ScreenContainer from '@components/ScreenContainer';
import { useIsMobile } from '@hooks/useIsMobile';
import { REINTENTAR_MAS_TARDE } from '@copy/common';

import NotificacionFila from '../../components/NotificacionFila';
import { useNotificacionesHistorial } from '../../hooks/useNotificacionesHistorial';

/**
 * Historial de notificaciones del usuario logueado (SHG-FE-142): todas, sin las
 * vaciadas, más recientes primero y paginadas (`GET /api/notificaciones/historial`,
 * `SHG-CONTRACT-023`). Se llega con "Ver todas" desde la campana.
 *
 * Una sola pantalla para los dos entornos: el panel (`/notificaciones`,
 * SUPERUSER / ADMIN) y el portal (`/portal/notificaciones`, CUSTOMER, con
 * `portal`: links por código de seguimiento y fecha exacta visible).
 *
 * Click en una notificación: la marca como leída al instante (optimista, también
 * en la campana) y navega a su recurso si tiene.
 *
 * @param {Object} props
 * @param {boolean} [props.portal]
 */
const NotificacionesHistorialPage = ({ portal = false }) => {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const [page, setPage] = useState(1);
  const {
    notificaciones,
    totalPages,
    totalElements,
    isLoading,
    isError,
    isFetching,
    refetch,
    marcarLeida,
  } = useNotificacionesHistorial(page);

  // Si la página en la que estaba ya no existe (p. ej. vació las notificaciones
  // desde la campana), vuelve a la última que tenga contenido.
  useEffect(() => {
    if (!isFetching && !isError && totalPages > 0 && page > totalPages) {
      setPage(totalPages);
    }
  }, [isFetching, isError, page, totalPages]);

  const handleNavigate = (notificacion, href) => {
    if (!notificacion?.visto) marcarLeida.mutate(notificacion.id);
    if (href) navigate(href);
  };

  const contenido = (
    <>
      <Stack gap={4}>
        <Title order={2}>Notificaciones</Title>
        <Text c="dimmed">Todas tus notificaciones, de la más reciente a la más antigua.</Text>
      </Stack>

      <Card withBorder padding={notificaciones.length > 0 ? 0 : 'lg'}>
        <ScreenContainer
          onLoading={{ show: isLoading, description: 'Cargando tus notificaciones...' }}
          onError={{
            show: isError && !isLoading,
            title: 'No pudimos cargar tus notificaciones',
            description: REINTENTAR_MAS_TARDE,
            onClick: () => refetch(),
          }}
          onEmptyData={{
            show: !isLoading && !isError && notificaciones.length === 0,
            title: 'No tenés notificaciones',
            description: 'Cuando haya novedades, las vas a ver acá.',
            icon: <IconBellOff size={50} />,
          }}
        >
          {notificaciones.length > 0 ? (
            <Stack gap={0} data-testid="notificaciones-historial-lista">
              {notificaciones.map((notificacion, index) => (
                <Fragment key={notificacion.id}>
                  {index > 0 ? <Divider /> : null}
                  <NotificacionFila
                    notificacion={notificacion}
                    portal={portal}
                    lineasCuerpo={3}
                    onNavigate={handleNavigate}
                    onMarcarLeida={(id) => marcarLeida.mutate(id)}
                  />
                </Fragment>
              ))}
            </Stack>
          ) : null}
        </ScreenContainer>
      </Card>

      {totalPages > 1 ? (
        <Group justify={isMobile ? "center" : "space-between"} align="center">
          <Text size="xs" c="dimmed">
            {totalElements} notificaciones
          </Text>
          <Pagination
            value={page}
            onChange={setPage}
            total={totalPages}
            disabled={isFetching}
            size={isMobile ? "md" : "sm"}
          />
        </Group>
      ) : null}
    </>
  );

  // El portal ya tiene su propio contenedor (`PortalLayout`); el panel usa el
  // `PageContainer` de las demás pantallas.
  return portal ? <Stack gap="lg">{contenido}</Stack> : <PageContainer>{contenido}</PageContainer>;
};

export default NotificacionesHistorialPage;
