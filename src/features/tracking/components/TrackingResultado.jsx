import { ActionIcon, Card, CopyButton, Group, Stack, Text, Title, Tooltip } from '@mantine/core';
import { IconCheck, IconCopy } from '@tabler/icons-react';

import TrackingEstadoHero from './TrackingEstadoHero';
import TrackingTimeline from './TrackingTimeline';

/**
 * Panel de resultado del tracking público a partir de un `PublicTrackingDTO`.
 *
 * Orden: hero de estado, tarjeta con el código de seguimiento e historial.
 * Muestra SÓLO lo que trae el DTO (que el backend ya filtró sin PII). No muestra
 * `fechaEstimada` (SHG-FE-143): la fecha de entrega sale del evento `entregado`
 * del historial y solo aparece cuando el envío ya fue entregado. Ignora
 * cualquier ubicación del transportista o palabra de entrega que el backend
 * mande (la palabra viaja sólo por email).
 *
 * Reutilizable por el portal CUSTOMER (`SHG-FE-026`).
 *
 * @param {Object} props
 * @param {import('../api/tracking.api').PublicTrackingDTO} props.data
 */
const TrackingResultado = ({ data }) => {
  if (!data) return null;

  return (
    <Stack gap="lg">
      <TrackingEstadoHero data={data} />

      <Card withBorder padding="lg">
        <Group justify="space-between" align="center" wrap="nowrap" gap="sm">
          <div style={{ minWidth: 0 }}>
            <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
              Código de seguimiento
            </Text>
            <Title
              order={3}
              ff="monospace"
              style={{ overflowWrap: 'anywhere', letterSpacing: 1 }}
            >
              {data.codigoSeguimiento}
            </Title>
          </div>
          <CopyButton value={data.codigoSeguimiento} timeout={1500}>
            {({ copied, copy }) => (
              <Tooltip label={copied ? 'Copiado' : 'Copiar'} withArrow>
                <ActionIcon
                  variant="subtle"
                  color={copied ? 'teal' : 'gray'}
                  size={44}
                  onClick={copy}
                  aria-label="Copiar código"
                >
                  {copied ? <IconCheck size={18} /> : <IconCopy size={18} />}
                </ActionIcon>
              </Tooltip>
            )}
          </CopyButton>
        </Group>
      </Card>

      <Card withBorder padding="lg">
        <Stack gap="md">
          <Title order={5}>Historial</Title>
          <TrackingTimeline
            historial={data.historial}
            estado={data.estado}
            tipoEntrega={data.tipoEntrega}
          />
        </Stack>
      </Card>
    </Stack>
  );
};

export default TrackingResultado;
