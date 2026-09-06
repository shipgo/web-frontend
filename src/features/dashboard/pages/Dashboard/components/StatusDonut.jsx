import { DonutChart } from '@mantine/charts';
import { Group, Stack, Text } from '@mantine/core';
import { IconChartDonut } from '@tabler/icons-react';

import ChartCard from './ChartCard';
import { getEnviosTotal, isDonutVacio, mapEnviosDonut } from '../dashboard.mappers';

/**
 * Distribución de envíos por estado en el período — `resumen.envios.porEstado`
 * (`SHG-BE-003`). Los labels/colores salen del mapa canónico `ESTADO_ENVIO`.
 */
const StatusDonut = ({ resumen, periodoLabel, isLoading, isError, onRetry }) => {
  const data = mapEnviosDonut(resumen);
  const total = getEnviosTotal(resumen);

  return (
    <ChartCard
      title="Envíos por estado"
      tooltip="Distribución de los envíos dados de alta en el período, por estado."
      icon={<IconChartDonut />}
      color="teal"
      subtitle={periodoLabel}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isDonutVacio(data)}
      onRetry={onRetry}
    >
      <Stack gap="md" pt="sm">
        <DonutChart
          data={data}
          chartLabel={`${total} envíos`}
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

export default StatusDonut;
