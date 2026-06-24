import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { IconAlertTriangle } from '@tabler/icons-react';
import ScreenContainer from '@components/ScreenContainer';

const FALLOS_SUCURSAL = [
  { sucursal: 'CABA Centro', porcentaje: 4.2 },
  { sucursal: 'Rosario', porcentaje: 6.8 },
  { sucursal: 'Córdoba', porcentaje: 3.1 },
  { sucursal: 'Mendoza', porcentaje: 8.5 },
  { sucursal: 'La Plata', porcentaje: 5.3 },
];

const FallosChart = ({ periodoLabel, isLoading }) => (
  <Card h="100%">
    <Group gap="xs" mb="md">
      <ThemeIcon variant="light" color="red" size="xl">
        <IconAlertTriangle />
      </ThemeIcon>
      <Stack gap={0}>
        <Text size="sm" fw={600}>Tasa de fallos por sucursal</Text>
        <Text size="xs" c="dimmed">% de entregas fallidas · {periodoLabel}</Text>
      </Stack>
    </Group>
    <ScreenContainer onLoading={{ show: isLoading }} styleProps={{ bg: 'transparent', mih: '220px' }}>
      <BarChart
        h={280}
        data={FALLOS_SUCURSAL}
        dataKey="sucursal"
        series={[{ name: 'porcentaje', color: 'red.5', label: '% Fallos' }]}
        valueFormatter={(v) => `${v}%`}
      />
    </ScreenContainer>
  </Card>
);

export default FallosChart;
