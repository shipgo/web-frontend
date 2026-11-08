import { Box, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconCheck, IconMapPin, IconX } from '@tabler/icons-react';

import { estadoLabel, normalizarEstado } from '@domain/estados';
import { formatFecha, formatFechaHora } from '@domain/format';

import { progresoEnvio } from '../fases';
import { fechaEntrega, historialDescendente } from '../utils';

const FRASES = {
  creado: 'Registramos tu envío',
  en_sucursal: 'Tu envío está en la sucursal',
  asignado_a_viaje: 'Estamos preparando tu envío',
  en_vehiculo: 'Tu envío está cargado y por salir',
  en_camino: 'Tu envío va en camino',
  entregado: 'Tu envío fue entregado',
  rechazado: 'No pudimos entregarlo',
};

/**
 * Frase del hero. `en_sucursal` y `entregado` cambian según el progreso: al
 * principio es "en nuestra sucursal", tras un viaje es "listo para retirar" (retiro)
 * o "estamos preparando tu envío" (domicilio); un retiro entregado es "retirado".
 */
const fraseDe = (estado, progreso) => {
  if (estado === 'en_sucursal') {
    if (progreso.tipo === 'listo') return 'Tu envío está listo para retirar';
    return progreso.actual === 1 ? 'Estamos preparando tu envío' : 'Tu envío está en nuestra sucursal';
  }
  if (estado === 'entregado' && progreso.retiro) return 'Tu envío fue retirado';
  return FRASES[estado] ?? estadoLabel('envio', estado);
};

/**
 * Tarjeta de estado actual del tracking: etiqueta, frase, destino y
 * segmentos de avance por fases (ver `../fases`: 4 fases que entiende quien
 * espera el envío, en lugar de los estados internos). Degrada sin romper si el
 * estado no es conocido.
 *
 * @param {Object} props
 * @param {import('../api/tracking.api').PublicTrackingDTO} props.data
 */
const TrackingEstadoHero = ({ data }) => {
  const estado = normalizarEstado(data.estado);
  const rechazado = estado === 'rechazado';
  const entregado = estado === 'entregado';
  const progreso = progresoEnvio({
    estado,
    historial: data.historial,
    tipoEntrega: data.tipoEntrega,
  });
  const paso = progreso.actual;
  const frase = fraseDe(estado, progreso);
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
              {progreso.etiqueta}
            </Text>
            <Text fw={700} fz={{ base: 20, sm: 24 }} lh={1.25}>
              {frase}
            </Text>
            {entregado && entregadoEl ? (
              <Text size="sm" fw={500}>
                {progreso.retiro ? 'Retirado' : 'Entregado'} el {formatFecha(entregadoEl)}
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
            <Group gap={4} wrap="nowrap" role="img" aria-label={`Paso ${paso + 1} de ${progreso.fases.length}`}>
              {progreso.fases.map((fase, i) => {
                const color =
                  rechazado && i === paso
                    ? 'var(--mantine-color-red-filled)'
                    : i <= paso
                      ? acento
                      : 'var(--mantine-color-default-border)';
                return (
                  <Box
                    key={fase.id}
                    data-testid="hero-segmento"
                    data-activo={i <= paso ? 'true' : 'false'}
                    style={{ flex: 1, height: 6, borderRadius: 3, background: color }}
                  />
                );
              })}
            </Group>
            <Group justify="space-between" gap="xs">
              <Text size="xs" c="dimmed">
                Paso {paso + 1} de {progreso.fases.length}
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
