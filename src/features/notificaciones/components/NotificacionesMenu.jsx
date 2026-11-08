import { useState } from 'react';
import { useLocation } from 'wouter';
import {
  ActionIcon,
  Group,
  Indicator,
  Loader,
  Menu,
  ScrollArea,
  Stack,
  Text,
  Tooltip,
} from '@mantine/core';
import { modals } from '@mantine/modals';
import { IconBell, IconTrash } from '@tabler/icons-react';

import { useIsMobile } from '@hooks/useIsMobile';
import { notificacionesHistorialHref } from '../constants';
import { useNotificaciones } from '../hooks/useNotificaciones';
import NotificacionFila from './NotificacionFila';

const MAX_BADGE = 9;

/**
 * Campana de notificaciones del `Header`: contador de no leídas, dropdown con las
 * últimas notificaciones del usuario, acción "marcar leída" y navegación al
 * recurso asociado (viaje / envío / usuario según `data.resource_type`).
 *
 * Se asume ya gateada por rol (`NotificacionesBell`). Con `portal` (CUSTOMER) los
 * avisos van a `/portal/envios/:codigo` y la fecha se muestra completa.
 *
 * @param {Object} props
 * @param {boolean} [props.portal]
 */
const NotificacionesMenu = ({ portal = false }) => {
  const isMobile = useIsMobile();
  const [, navigate] = useLocation();
  const [opened, setOpened] = useState(false);
  const { notificaciones, unreadCount, isLoading, isError, marcarLeida, vaciarTodas } =
    useNotificaciones();

  const badge =
    unreadCount > MAX_BADGE ? `${MAX_BADGE}+` : String(unreadCount || '');

  const handleNavigate = (notificacion, href) => {
    if (!notificacion?.visto) marcarLeida.mutate(notificacion.id);
    if (href) {
      setOpened(false);
      navigate(href);
    }
  };

  // "Ver todas": historial paginado (SHG-FE-142). `Menu.Item` cierra el
  // dropdown al hacer click, igual que al navegar a una notificación.
  const handleVerTodas = () => navigate(notificacionesHistorialHref({ portal }));

  const handleVaciarTodas = () => {
    modals.openConfirmModal({
      title: 'Vaciar notificaciones',
      centered: true,
      children: (
        <Text size="sm">
          ¿Confirmás que querés vaciar todas tus notificaciones? Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Vaciar todas', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      onConfirm: () => vaciarTodas.mutate(),
    });
  };

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      width="min(360px, calc(100vw - 16px))"
      shadow="md"
      withArrow
    >
      {/* `Menu.Target` clona su hijo DIRECTO para inyectarle `aria-haspopup`/
          `aria-expanded` — por eso el target tiene que ser el `ActionIcon`
          (un <button> real) y no el `Indicator` (un <div> decorativo). Con el
          `Indicator` como hijo directo, esos atributos ARIA caían en el div
          y axe-core los marcaba inválidos ahí (`aria-allowed-attr`, crítico
          en las 9 rutas auditadas — SHG-FE-041). El `Indicator` se queda
          envolviendo exactamente lo mismo que antes (el botón entero, no sólo
          el ícono) para no cambiar el layout — sólo se invirtió cuál de los
          dos queda "afuera". */}
      <Indicator inline disabled={unreadCount === 0} label={badge} size={16} offset={5} color="red">
        <Menu.Target>
          <ActionIcon
            size={isMobile ? 44 : "input-sm"}
            variant="subtle"
            aria-label={
              unreadCount > 0
                ? `Notificaciones, ${unreadCount} sin leer`
                : 'Notificaciones'
            }
          >
            <IconBell size={24} />
          </ActionIcon>
        </Menu.Target>
      </Indicator>

      <Menu.Dropdown>
        <Group justify="space-between" wrap="nowrap" pr="xs">
          <Menu.Label>Notificaciones</Menu.Label>
          {notificaciones.length > 0 ? (
            <Tooltip label="Vaciar todas" withArrow>
              <ActionIcon
                size={isMobile ? 44 : 'sm'}
                variant="subtle"
                color="gray"
                aria-label="Vaciar todas las notificaciones"
                loading={vaciarTodas.isPending}
                onClick={handleVaciarTodas}
              >
                <IconTrash size={16} />
              </ActionIcon>
            </Tooltip>
          ) : null}
        </Group>

        {isLoading ? (
          <Group justify="center" py="md">
            <Loader size="sm" />
          </Group>
        ) : isError ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No se pudieron cargar las notificaciones.
          </Text>
        ) : notificaciones.length === 0 ? (
          <Text size="sm" c="dimmed" ta="center" py="md">
            No tenés notificaciones.
          </Text>
        ) : (
          <ScrollArea.Autosize mah={400} type="scroll">
            <Stack gap={0}>
              {notificaciones.map((notificacion) => (
                <NotificacionFila
                  key={notificacion.id}
                  notificacion={notificacion}
                  portal={portal}
                  onNavigate={handleNavigate}
                  onMarcarLeida={(id) => marcarLeida.mutate(id)}
                />
              ))}
            </Stack>
          </ScrollArea.Autosize>
        )}

        {!isLoading && !isError && notificaciones.length > 0 ? (
          <>
            <Menu.Divider />
            <Menu.Item ta="center" fw={500} mih={isMobile ? 44 : undefined} onClick={handleVerTodas}>
              Ver todas
            </Menu.Item>
          </>
        ) : null}
      </Menu.Dropdown>
    </Menu>
  );
};

export default NotificacionesMenu;
