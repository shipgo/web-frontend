import {
  ActionIcon,
  Group,
  Text,
  Tooltip,
  UnstyledButton,
  VisuallyHidden,
} from '@mantine/core';
import { IconCheck } from '@tabler/icons-react';

import { formatDesdeAhora, formatFechaHora } from '@domain/format';

import { notificacionHref } from '../constants';

/**
 * Fila de una notificación: punto rojo y negrita si no está leída, título,
 * cuerpo, fecha y acción "Marcar como leída". Compartida por el dropdown de la
 * campana y por el historial (SHG-FE-142).
 *
 * Con `portal` (CUSTOMER) la fecha exacta va visible (DD/MM/YYYY 24 h, sin hover
 * en el celular); en el panel va "hace X" con la fecha exacta en el tooltip.
 *
 * @param {Object} props
 * @param {Object} props.notificacion
 * @param {boolean} [props.portal]
 * @param {(notificacion: Object, href: string | null) => void} props.onNavigate
 * @param {(id: number) => void} props.onMarcarLeida
 * @param {number} [props.lineasCuerpo] líneas del cuerpo antes de truncar.
 */
const NotificacionFila = ({
  notificacion,
  portal = false,
  onNavigate,
  onMarcarLeida,
  lineasCuerpo = 2,
}) => {
  const href = notificacionHref(notificacion, { portal });
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
      {noLeida ? (
        <div
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'var(--mantine-color-red-6)',
            flexShrink: 0,
            marginTop: 6,
          }}
          aria-hidden="true"
        />
      ) : null}
      <UnstyledButton
        style={{ flex: 1, cursor: href ? 'pointer' : 'default' }}
        onClick={() => onNavigate(notificacion, href)}
      >
        <Text size="sm" fw={noLeida ? 700 : 500} lineClamp={1}>
          {notificacion?.title || 'Notificación'}
        </Text>
        {notificacion?.body ? (
          <Text size="xs" c="dimmed" lineClamp={lineasCuerpo}>
            {notificacion.body}
          </Text>
        ) : null}
        {portal ? (
          // Sin hover en el celular: la fecha exacta (DD/MM/YYYY 24 h) va visible.
          <Text size="xs" c="dimmed" mt={2}>
            {formatFechaHora(notificacion?.fecha)}
          </Text>
        ) : (
          <Tooltip label={formatFechaHora(notificacion?.fecha)} withArrow position="bottom">
            <Text size="10px" c="dimmed" mt={2} style={{ cursor: 'help' }}>
              {formatDesdeAhora(notificacion?.fecha)}
            </Text>
          </Tooltip>
        )}
        {noLeida ? <VisuallyHidden>Sin leer</VisuallyHidden> : null}
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

export default NotificacionFila;
