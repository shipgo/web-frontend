import { Card, Group, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { BarChart } from '@mantine/charts';
import { IconAlertTriangle, IconInfoCircle } from '@tabler/icons-react';
import ScreenContainer from '@components/ScreenContainer';
import { getTimeGranularity } from '../dashboard.helpers';

const DATA_BY_GRANULARITY = {
  sucursales: [
    { eje: 'CABA Centro', porcentaje: 4.2 },
    { eje: 'Rosario', porcentaje: 6.8 },
    { eje: 'Córdoba', porcentaje: 3.1 },
    { eje: 'Mendoza', porcentaje: 8.5 },
    { eje: 'La Plata', porcentaje: 5.3 },
  ],
  dias: [
    { eje: 'Lun', porcentaje: 3.2 },
    { eje: 'Mar', porcentaje: 5.1 },
    { eje: 'Mié', porcentaje: 2.8 },
    { eje: 'Jue', porcentaje: 6.4 },
    { eje: 'Vie', porcentaje: 4.7 },
    { eje: 'Sáb', porcentaje: 7.2 },
    { eje: 'Dom', porcentaje: 9.1 },
  ],
  semanas: [
    { eje: 'Semana 1', porcentaje: 4.5 },
    { eje: 'Semana 2', porcentaje: 6.2 },
    { eje: 'Semana 3', porcentaje: 3.8 },
    { eje: 'Semana 4', porcentaje: 5.1 },
  ],
  meses: [
    { eje: 'Ene', porcentaje: 5.2 },
    { eje: 'Feb', porcentaje: 4.8 },
    { eje: 'Mar', porcentaje: 6.1 },
    { eje: 'Abr', porcentaje: 3.9 },
    { eje: 'May', porcentaje: 5.7 },
    { eje: 'Jun', porcentaje: 4.3 },
  ],
};

const FallosChart = ({ periodoLabel, filtros, isLoading }) => {
  const granularity = getTimeGranularity(filtros);
  const data = DATA_BY_GRANULARITY[granularity];

  return (
    <Card h="100%">
      <Group gap="xs" mb="md">
        <ThemeIcon variant="light" color="red" size="xl">
          <IconAlertTriangle />
        </ThemeIcon>
        <Stack gap={0}>
          <Group gap={4} align="center">
            <Text size="sm" fw={600}>Tasa de fallos por sucursal</Text>
            <Tooltip label="Porcentaje de entregas fallidas por sucursal o período. Un valor alto puede indicar problemas operativos o de dirección." withArrow>
              <IconInfoCircle size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
            </Tooltip>
          </Group>
          <Text size="xs" c="dimmed">% de entregas fallidas · {periodoLabel}</Text>
        </Stack>
      </Group>
      <ScreenContainer onLoading={{ show: isLoading }} styleProps={{ bg: 'transparent', mih: '220px' }}>
        <BarChart
          h={280}
          data={data}
          dataKey="eje"
          series={[{ name: 'porcentaje', color: 'red.5', label: '% Fallos' }]}
          valueFormatter={(v) => `${v}%`}
        />
      </ScreenContainer>
    </Card>
  );
};

export default FallosChart;
