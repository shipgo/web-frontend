import { Box, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCheck, IconMapPin, IconX } from '@tabler/icons-react';

import {
  ESTADO_ENVIO_PASOS,
  estadoLabel,
  normalizarEstado,
} from '@domain/estados';
import { formatFecha, formatFechaHora } from '@domain/format';

import { fechaEntrega, historialDescendente } from '../utils';

const FRASES = {
  creado: 'Registramos tu envío',
  en_sucursal: 'Tu envío está en la sucursal',
  asignado_a_viaje: 'Tu envío ya tiene un viaje asignado',
  en_vehiculo: 'Tu envío está cargado y por salir',
  en_camino: 'Tu envío va en camino',
  entregado: 'Tu envío fue entregado',
  rechazado: 'No pudimos entregarlo',
};

const TOTAL = ESTADO_ENVIO_PASOS.length;

/**
 * Posición (0-based) del paso actual en `ESTADO_ENVIO_PASOS`. Para
 * `rechazado` (salida alternativa) se toma el último estado "feliz" del
 * historial, o el primero si no hay. -1 si el estado es desconocido.
 */
const indicePaso = (estado, historial) => {
  const directo = ESTADO_ENVIO_PASOS.indexOf(estado);
  if (directo >= 0) return directo;
  if (estado !== 'rechazado') return -1;
  const previo = historialDescendente(historial).find(
    (h) => ESTADO_ENVIO_PASOS.indexOf(normalizarEstado(h?.estado)) >= 0,
  );
  return previo ? ESTADO_ENVIO_PASOS.indexOf(normalizarEstado(previo.estado)) : 0;
};

/**
 * Tarjeta de estado actual del tracking: etiqueta, frase, destino y
 * segmentos de avance. Degrada sin romper si el estado no es conocido.
 *
 * @param {Object} props
 * @param {import('../api/tracking.api').PublicTrackingDTO} props.data
 */
const TrackingEstadoHero = ({ data }) => {
  const estado = normalizarEstado(data.estado);
  const rechazado = estado === 'rechazado';
  const entregado = estado === 'entregado';
  const paso = indicePaso(estado, data.historial);
  const frase = FRASES[estado] ?? estadoLabel('envio', data.estado);
  const destino = data.destino
    ? [data.destino.localidad, data.destino.provincia].filter(Boolean).join(', ')
    : null;
  const ultimo = historialDescendente(data.historial)[0];
  const entregadoEl = entregado ? fechaEntrega(data.historial) : null;
  const acento = rechazado
    ? 'var(--mantine-color-red-filled)'
    : 'var(--mantine-primary-color-filled)';

  return (
    <Card
      withBorder
      padding="lg"
      data-testid="tracking-estado-hero"
      bg={rechazado ? 'var(--mantine-color-red-light)' : undefined}
    >
      <Stack gap="md">
        <Group gap="sm" wrap="nowrap" align="flex-start">
          {entregado || rechazado ? (
            <ThemeIcon
              color={rechazado ? 'red' : undefined}
              variant="light"
              size={40}
              radius="xl"
              aria-hidden
            >
              {rechazado ? <IconX size={22} /> : <IconCheck size={22} />}
            </ThemeIcon>
          ) : null}
          <Stack gap={2}>
            <Text size="xs" fw={700} tt="uppercase" lts={0.8} c="dimmed">
              {estadoLabel('envio', data.estado)}
            </Text>
            <Text fw={700} fz={{ base: 20, sm: 24 }} lh={1.25}>
              {frase}
            </Text>
            {entregado && entregadoEl ? (
              <Text size="sm" fw={500}>
                Entregado el {formatFecha(entregadoEl)}
              </Text>
            ) : null}
          </Stack>
        </Group>

        {destino ? (
          <Group gap={6} wrap="nowrap" align="flex-start">
            <IconMapPin size={16} color="var(--mantine-color-dimmed)" style={{ marginTop: 2, flexShrink: 0 }} />
            <Text size="sm">{destino}</Text>
          </Group>
        ) : null}

        {paso >= 0 ? (
          <Stack gap={6}>
            <Group gap={4} wrap="nowrap" role="img" aria-label={`Paso ${paso + 1} de ${TOTAL}`}>
              {ESTADO_ENVIO_PASOS.map((p, i) => {
                const color =
                  rechazado && i === paso
                    ? 'var(--mantine-color-red-filled)'
                    : i <= paso
                      ? acento
                      : 'var(--mantine-color-default-border)';
                return (
                  <Box
                    key={p}
                    data-testid="hero-segmento"
                    data-activo={i <= paso ? 'true' : 'false'}
                    style={{ flex: 1, height: 6, borderRadius: 3, background: color }}
                  />
                );
              })}
            </Group>
            <Group justify="space-between" gap="xs">
              <Text size="xs" c="dimmed">
                Paso {paso + 1} de {TOTAL}
              </Text>
              {ultimo?.fecha ? (
                <Text size="xs" c="dimmed">
                  {formatFechaHora(ultimo.fecha)}
                </Text>
              ) : null}
            </Group>
          </Stack>
        ) : ultimo?.fecha ? (
          <Text size="xs" c="dimmed">
            {formatFechaHora(ultimo.fecha)}
          </Text>
        ) : null}
      </Stack>
    </Card>
  );
};

export default TrackingEstadoHero;
