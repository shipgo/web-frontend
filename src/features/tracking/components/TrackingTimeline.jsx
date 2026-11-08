import { Box, Group, Text } from '@mantine/core';

import { estadoLabel, normalizarEstado } from '@domain/estados';
import { formatFechaHora } from '@domain/format';

import { historialDescendente } from '../utils';

const BULLET = 14;
const HALO = '0 0 0 5px color-mix(in srgb, var(--mantine-primary-color-filled) 25%, transparent)';
const HALO_ROJO = '0 0 0 5px color-mix(in srgb, var(--mantine-color-red-filled) 25%, transparent)';

/**
 * Historial de estados de un envío a partir del `historial` del
 * `PublicTrackingDTO` (`[{ estado, fecha }]`). Se muestra en orden descendente
 * (lo más reciente arriba) con un solo color: primario para lo ocurrido, con
 * halo y negrita en el último, y rojo SOLO para `rechazado`.
 *
 * @param {Object} props
 * @param {Array<{ estado: string, fecha: string }>} [props.historial=[]]
 */
const TrackingTimeline = ({ historial = [] }) => {
  if (historial.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        Todavía no hay movimientos registrados para este envío.
      </Text>
    );
  }

  const items = historialDescendente(historial);

  return (
    <Box component="ol" m={0} p={0} style={{ listStyle: 'none' }}>
      {items.map((item, index) => {
        const esUltimo = index === 0;
        const esFin = index === items.length - 1;
        const rechazado = normalizarEstado(item.estado) === 'rechazado';
        const colorBullet = rechazado
          ? 'var(--mantine-color-red-filled)'
          : 'var(--mantine-primary-color-filled)';
        return (
          <Box
            component="li"
            key={`${item.estado}-${item.fecha ?? index}`}
            aria-current={esUltimo ? 'step' : undefined}
            pos="relative"
            pl={32}
            pb={esFin ? 0 : 'md'}
          >
            {!esFin ? (
              <Box
                aria-hidden
                pos="absolute"
                style={{
                  left: BULLET / 2 - 1,
                  top: BULLET + 4,
                  bottom: -2,
                  width: 2,
                  background: 'var(--mantine-color-default-border)',
                }}
              />
            ) : null}
            <Box
              aria-hidden
              pos="absolute"
              style={{
                left: 0,
                top: 3,
                width: BULLET,
                height: BULLET,
                borderRadius: '50%',
                background: colorBullet,
                boxShadow: esUltimo ? (rechazado ? HALO_ROJO : HALO) : 'none',
              }}
            />
            <Group gap="xs" wrap="wrap">
              <Text
                size="sm"
                fw={esUltimo ? 700 : 500}
                c={rechazado ? 'red' : undefined}
              >
                {estadoLabel('envio', item.estado)}
              </Text>
            </Group>
            <Text size="xs" c="dimmed">
              {formatFechaHora(item.fecha)}
            </Text>
          </Box>
        );
      })}
    </Box>
  );
};

export default TrackingTimeline;
