import { Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import { IconChartDonut } from '@tabler/icons-react';

const ESTADOS_ENVIOS = [
  { name: 'Entregados', value: 89, color: 'teal.6' },
  { name: 'En ruta', value: 38, color: 'blue.5' },
  { name: 'Fallidos', value: 15, color: 'red.5' },
];

const TOTAL = ESTADOS_ENVIOS.reduce((acc, e) => acc + e.value, 0);

const StatusDonut = () => (
  <Card h="100%">
    <Group gap="xs" mb="md">
      <ThemeIcon variant="light" color="teal" size="xl">
        <IconChartDonut />
      </ThemeIcon>
      <Stack gap={0}>
        <Text size="sm" fw={600}>Estado de envíos</Text>
        <Text size="xs" c="dimmed">Distribución del día de hoy</Text>
      </Stack>
    </Group>
    <Stack gap="md" pt="sm">
      <DonutChart
        data={ESTADOS_ENVIOS}
        chartLabel={`${TOTAL} envíos`}
        size={200}
        thickness={30}
        mx="auto"
      />
      <Group gap="xl" justify="center">
        {ESTADOS_ENVIOS.map((e) => (
          <Stack key={e.name} gap={2} align="center">
            <Text size="xs" c="dimmed">{e.name}</Text>
            <Text size="sm" fw={700}>{e.value}</Text>
          </Stack>
        ))}
      </Group>
    </Stack>
  </Card>
);

export default StatusDonut;
