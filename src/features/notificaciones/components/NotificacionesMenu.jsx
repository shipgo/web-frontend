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
  UnstyledButton,
} from '@mantine/core';
import { IconBell, IconCheck } from '@tabler/icons-react';

import { formatDesdeAhora } from '@domain/format';

import { notificacionHref } from '../constants';
import { useNotificaciones } from '../hooks/useNotificaciones';

const MAX_BADGE = 9;

const NotificacionFila = ({ notificacion, onNavigate, onMarcarLeida }) => {
  const href = notificacionHref(notificacion);
  const noLeida = !notificacion?.visto;

  return (
    <Group
      gap="xs"
      wrap="nowrap"
      align="flex-start"
      px="sm"
      py="xs"
      bg={noLeida ? 'var(--mantine-color-default-hover)' : undefined}
    >
      <UnstyledButton
        style={{ flex: 1, cursor: href ? 'pointer' : 'default' }}
        onClick={() => onNavigate(notificacion, href)}
      >
        <Text size="sm" fw={noLeida ? 700 : 500} lineClamp={1}>
          {notificacion?.title || 'Notificación'}
        </Text>
        {notificacion?.body ? (
          <Text size="xs" c="dimmed" lineClamp={2}>
            {notificacion.body}
          </Text>
        ) : null}
        <Text size="10px" c="dimmed" mt={2}>
          {formatDesdeAhora(notificacion?.fecha)}
        </Text>
      </UnstyledButton>

      {noLeida ? (
        <Tooltip label="Marcar como leída" withArrow>
          <ActionIcon
            size="sm"
            variant="subtle"
            color="gray"
            aria-label="Marcar como leída"
            onClick={(event) => {
              event.stopPropagation();
              onMarcarLeida(notificacion.id);
            }}
          >
            <IconCheck size={16} />
          </ActionIcon>
        </Tooltip>
      ) : null}
    </Group>
  );
};

/**
 * Campana de notificaciones del `Header`: contador de no leídas, dropdown con las
 * últimas notificaciones del usuario, acción "marcar leída" y navegación al
 * recurso asociado (viaje / envío / usuario según `data.resource_type`).
 *
 * Se asume ya gateada por rol (`NotificacionesBell`).
 */
const NotificacionesMenu = () => {
  const [, navigate] = useLocation();
  const [opened, setOpened] = useState(false);
  const { notificaciones, unreadCount, isLoading, isError, marcarLeida } =
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

  return (
    <Menu
      opened={opened}
      onChange={setOpened}
      position="bottom-end"
      width={360}
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
            size="input-sm"
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
        <Menu.Label>Notificaciones</Menu.Label>

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
                  onNavigate={handleNavigate}
                  onMarcarLeida={(id) => marcarLeida.mutate(id)}
                />
              ))}
            </Stack>
          </ScrollArea.Autosize>
        )}
      </Menu.Dropdown>
    </Menu>
  );
};

export default NotificacionesMenu;
