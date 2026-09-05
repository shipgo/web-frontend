import { Badge, Card, Group, Progress, Stack, Text } from '@mantine/core';
import { IconPackage } from '@tabler/icons-react';

import { useSelectedViaje } from '../contexts/selectedViaje';
import { useViajeProgreso } from '../hooks/useViajeProgreso';

/**
 * Progreso de entregas del viaje seleccionado (paradas entregadas/totales,
 * envíos pendientes — `SHG-BE-015`). Overlay mínimo sobre el mapa; el panel
 * de detalle completo (chofer, incidentes, estado de conexión SSE) es
 * `SHG-FE-014`.
 */
const MapDetalles = () => {
  const { selectedViajeId } = useSelectedViaje();
  const { progreso } = useViajeProgreso(selectedViajeId);

  if (!selectedViajeId || !progreso) return null;

  const { paradasEntregadas = 0, paradasTotales = 0, enviosPendientes = 0 } = progreso;
  const porcentaje = paradasTotales > 0 ? (paradasEntregadas / paradasTotales) * 100 : 0;

  return (
    <Card
      shadow="sm"
      p="sm"
      radius="md"
      withBorder
      pos="absolute"
      top={12}
      left={12}
      style={{ zIndex: 1, width: 240 }}
    >
      <Stack gap={6}>
        <Group justify="space-between">
          <Text size="sm" fw={600}>
            Progreso del viaje
          </Text>
          <Badge variant="light" size="sm">
            {paradasEntregadas}/{paradasTotales} paradas
          </Badge>
        </Group>
        <Progress value={porcentaje} size="sm" />
        <Group gap={6}>
          <IconPackage size={14} />
          <Text size="xs" c="dimmed">
            {enviosPendientes} envío(s) pendiente(s)
          </Text>
        </Group>
      </Stack>
    </Card>
  );
};

export default MapDetalles;
