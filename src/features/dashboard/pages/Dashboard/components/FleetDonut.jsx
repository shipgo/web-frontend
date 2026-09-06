import { DonutChart } from '@mantine/charts';
import { Group, Stack, Text } from '@mantine/core';
import { IconTruck } from '@tabler/icons-react';

import ChartCard from './ChartCard';
import { getFlotaTotal, isDonutVacio, mapFlotaDonut } from '../dashboard.mappers';

/**
 * Estado actual de la flota — `resumen.flota.porEstado` (`SHG-BE-003`).
 * Es una foto del estado *actual* de los vehículos del alcance (no se filtra por
 * período), de ahí el subtítulo fijo.
 */
const FleetDonut = ({ resumen, isLoading, isError, onRetry }) => {
  const data = mapFlotaDonut(resumen);
  const total = getFlotaTotal(resumen);

  return (
    <ChartCard
      title="Estado de la flota"
      tooltip="Distribución de los vehículos del alcance por estado, al día de hoy."
      icon={<IconTruck />}
      color="blue"
      subtitle="Estado actual"
      isLoading={isLoading}
      isError={isError}
      isEmpty={isDonutVacio(data)}
      onRetry={onRetry}
    >
      <Stack gap="md" pt="sm">
        <DonutChart
          data={data}
          chartLabel={`${total} unidades`}
          size={200}
          thickness={30}
          mx="auto"
        />
        <Group gap="lg" justify="center" wrap="wrap">
          {data.map((item) => (
            <Stack key={item.name} gap={2} align="center">
              <Text size="xs" c="dimmed">
                {item.name}
              </Text>
              <Text size="sm" fw={700}>
                {item.value}
              </Text>
            </Stack>
          ))}
        </Group>
      </Stack>
    </ChartCard>
  );
};

export default FleetDonut;
