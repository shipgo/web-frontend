import { Box, Group, Paper, Text } from '@mantine/core';

import { useTracking } from '../contexts/tracking';

const STATUS_META = {
  open: { label: 'En vivo', color: 'green' },
  connecting: { label: 'Reconectando…', color: 'yellow' },
  error: { label: 'Sin señal', color: 'red' },
};

/**
 * Estado de la conexión SSE (`/api/tracking/stream`), siempre visible sobre
 * el mapa — independiente de si hay un viaje seleccionado (`SHG-FE-014`).
 * `useTrackingStream` es dueño de la reconexión (con backoff); acá sólo se
 * refleja el `status: 'connecting' | 'open' | 'error'` que expone.
 */
const MapTrackingStatus = () => {
  const { status } = useTracking();
  const meta = STATUS_META[status] ?? STATUS_META.error;

  return (
    <Paper
      shadow="sm"
      radius="xl"
      withBorder
      pos="absolute"
      top={12}
      left={12}
      px="sm"
      py={6}
      style={{ zIndex: 1 }}
    >
      <Group gap={6} wrap="nowrap">
        <Box
          w={8}
          h={8}
          style={{
            borderRadius: '50%',
            flexShrink: 0,
            backgroundColor: `var(--mantine-color-${meta.color}-6)`,
          }}
        />
        <Text size="xs" fw={600}>
          {meta.label}
        </Text>
      </Group>
    </Paper>
  );
};

export default MapTrackingStatus;
