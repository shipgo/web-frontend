import { Box, Group, Text } from '@mantine/core';

import { formatFechaHora } from '@domain/format';

import { historialPublico } from '../fases';

const BULLET = 14;
const HALO = '0 0 0 5px color-mix(in srgb, var(--mantine-primary-color-filled) 25%, transparent)';
const HALO_ROJO = '0 0 0 5px color-mix(in srgb, var(--mantine-color-red-filled) 25%, transparent)';

/**
 * Historial de un envío a partir del `PublicTrackingDTO`, mostrado por fases
 * (`../fases`: "Envío registrado", "En preparación", "En camino", "Entregado" o
 * "Listo para retirar"). No se muestran los estados internos (en sucursal, asignado
 * a viaje, en vehículo) ni los repetidos. Orden descendente (lo más reciente
 * arriba) con un solo color: primario para lo ocurrido, con halo y negrita en el
 * último, y rojo SOLO para el rechazo.
 *
 * @param {Object} props
 * @param {Array<{ estado: string, fecha: string }>} [props.historial=[]]
 * @param {string} [props.estado] Estado actual del envío.
 * @param {string} [props.tipoEntrega] `domicilio` | `sucursal`.
 */
const TrackingTimeline = ({ historial = [], estado, tipoEntrega }) => {
  const items = historialPublico({ estado, historial, tipoEntrega });

  if (items.length === 0) {
    return (
      <Text c="dimmed" size="sm">
        Todavía no hay movimientos registrados para este envío.
      </Text>
    );
  }

  return (
    <Box component="ol" m={0} p={0} style={{ listStyle: 'none' }}>
      {items.map((item, index) => {
        const esUltimo = index === 0;
        const esFin = index === items.length - 1;
        const rechazado = item.rechazado;
        const colorBullet = rechazado
          ? 'var(--mantine-color-red-filled)'
          : 'var(--mantine-primary-color-filled)';
        return (
          <Box
            component="li"
            key={item.clave}
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
                {item.etiqueta}
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
