import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { IconRoute } from '@tabler/icons-react';
import ScreenContainer from '@components/ScreenContainer';

const DESVIACION_VIAJES = [
  { viaje: 'V-101', planificado: 45, real: 52 },
  { viaje: 'V-102', planificado: 60, real: 58 },
  { viaje: 'V-103', planificado: 90, real: 117 },
  { viaje: 'V-104', planificado: 30, real: 33 },
  { viaje: 'V-105', planificado: 75, real: 89 },
  { viaje: 'V-106', planificado: 50, real: 49 },
];

const DesvioChart = ({ periodoLabel, isLoading }) => (
  <Card h="100%">
    <Group gap="xs" mb="md">
      <ThemeIcon variant="light" color="orange" size="xl">
        <IconRoute />
      </ThemeIcon>
      <Stack gap={0}>
        <Text size="sm" fw={600}>Desviación de ruta</Text>
        <Text size="xs" c="dimmed">Planificado vs real (min) · {periodoLabel}</Text>
      </Stack>
    </Group>
    <ScreenContainer onLoading={{ show: isLoading }} styleProps={{ bg: 'transparent', mih: '220px' }}>
      <BarChart
        h={280}
        data={DESVIACION_VIAJES}
        dataKey="viaje"
        series={[
          { name: 'planificado', color: 'blue.4', label: 'Planificado' },
          { name: 'real', color: 'orange.5', label: 'Real' },
        ]}
        valueFormatter={(v) => `${v} min`}
      />
    </ScreenContainer>
  </Card>
);

export default DesvioChart;
