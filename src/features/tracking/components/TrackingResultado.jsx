import {
  ActionIcon,
  Alert,
  Badge,
  Card,
  CopyButton,
  Divider,
  Group,
  Stack,
  Text,
  Title,
  Tooltip,
} from '@mantine/core';
import {
  IconCalendarClock,
  IconCheck,
  IconCopy,
  IconKey,
  IconMapPin,
} from '@tabler/icons-react';

import { estadoBadge, estadoLabel } from '@domain/estados';
import { formatFecha, formatFechaHora, EMPTY } from '@domain/format';

import TrackingTimeline from './TrackingTimeline';
import TrackingUbicacionMapa from './TrackingUbicacionMapa';

const InfoRow = ({ icon, label, children }) => (
  <Group gap="sm" wrap="nowrap" align="flex-start">
    {icon}
    <div>
      <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
        {label}
      </Text>
      <Text size="sm" fw={500}>
        {children}
      </Text>
    </div>
  </Group>
);

/**
 * Panel de resultado del tracking público a partir de un `PublicTrackingDTO`.
 *
 * Muestra SÓLO lo que trae el DTO (que el backend ya filtró sin PII):
 * `codigoSeguimiento`, `estado` + label canónico, `historial`, `destino`
 * (localidad + provincia), `fechaEstimada` y `ultimaUbicacionAprox`.
 * No expone nombre / email / teléfono ni la dirección exacta del remitente.
 *
 * Reutilizable por el portal CUSTOMER (`SHG-FE-026`).
 *
 * `palabraEntrega` (`SHG-BE-042`) se muestra sólo si el DTO la trae (ausente si
 * el envío no tiene una generada) — es secreto remitente↔destinatario↔chofer,
 * nunca se le pide de vuelta al backend después de creado el envío, y NUNCA se
 * muestra en las vistas de operador (`ListaEnvios`/`DetalleEnvio`).
 *
 * @param {Object} props
 * @param {import('../api/tracking.api').PublicTrackingDTO} props.data
 */
const TrackingResultado = ({ data }) => {
  if (!data) return null;

  const { color } = estadoBadge('envio', data.estado);
  const destino = data.destino
    ? [data.destino.localidad, data.destino.provincia].filter(Boolean).join(', ')
    : null;

  return (
    <Stack gap="lg">
      <Card withBorder padding="lg">
        <Stack gap="md">
          <Group justify="space-between" align="flex-start" wrap="wrap">
            <div>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
                Código de seguimiento
              </Text>
              <Group gap={6} align="center">
                <Title order={3} style={{ letterSpacing: '0.05em' }}>
                  {data.codigoSeguimiento}
                </Title>
                <CopyButton value={data.codigoSeguimiento} timeout={1500}>
                  {({ copied, copy }) => (
                    <Tooltip label={copied ? 'Copiado' : 'Copiar'} withArrow>
                      <ActionIcon
                        variant="subtle"
                        color={copied ? 'teal' : 'gray'}
                        onClick={copy}
                        aria-label="Copiar código"
                      >
                        {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                      </ActionIcon>
                    </Tooltip>
                  )}
                </CopyButton>
              </Group>
            </div>
            <Badge color={color} size="lg" variant="light">
              {estadoLabel('envio', data.estado)}
            </Badge>
          </Group>

          <Divider />

          <Group gap="xl" wrap="wrap">
            <InfoRow
              icon={<IconMapPin size={18} color="var(--mantine-color-dimmed)" />}
              label="Destino"
            >
              {destino || EMPTY}
            </InfoRow>
            <InfoRow
              icon={
                <IconCalendarClock size={18} color="var(--mantine-color-dimmed)" />
              }
              label="Entrega estimada"
            >
              {data.fechaEstimada ? formatFecha(data.fechaEstimada) : 'A definir'}
            </InfoRow>
          </Group>
        </Stack>
      </Card>

      {data.palabraEntrega ? (
        <Alert color="yellow" variant="light" icon={<IconKey size={18} />} title="Tu palabra de entrega">
          <Stack gap={2}>
            <Title order={3} style={{ letterSpacing: '0.05em' }}>
              {data.palabraEntrega}
            </Title>
            <Text size="sm">
              Decísela al chofer cuando te entregue el envío — es la forma de confirmar que sos vos
              quien lo recibe.
            </Text>
          </Stack>
        </Alert>
      ) : null}

      {data.ultimaUbicacionAprox ? (
        <Card withBorder padding="lg">
          <Stack gap="sm">
            <Group justify="space-between" wrap="wrap">
              <Title order={5}>Ubicación aproximada</Title>
              <Text size="xs" c="dimmed">
                Actualizada {formatFechaHora(data.ultimaUbicacionAprox.fecha)}
              </Text>
            </Group>
            <TrackingUbicacionMapa ubicacion={data.ultimaUbicacionAprox} />
            <Text size="xs" c="dimmed">
              La ubicación es aproximada (~1 km) y sólo se muestra mientras el
              envío está en camino.
            </Text>
          </Stack>
        </Card>
      ) : null}

      <Card withBorder padding="lg">
        <Stack gap="md">
          <Title order={5}>Historial</Title>
          <TrackingTimeline historial={data.historial} />
        </Stack>
      </Card>
    </Stack>
  );
};

export default TrackingResultado;
