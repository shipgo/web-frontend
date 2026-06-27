import { Card, Group, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import { IconTruck, IconInfoCircle } from '@tabler/icons-react';
import ScreenContainer from '@components/ScreenContainer';

const OCUPACION_FLOTA = [
  { name: 'En ruta', value: 17, color: 'blue.5' },
  { name: 'Operativos', value: 7, color: 'teal.6' },
  { name: 'En taller', value: 6, color: 'orange.5' },
];

const TOTAL = OCUPACION_FLOTA.reduce((acc, e) => acc + e.value, 0);

const FleetDonut = ({ periodoLabel, isLoading }) => (
  <Card h="100%">
    <Group gap="xs" mb="md">
      <ThemeIcon variant="light" color="blue" size="xl">
        <IconTruck />
      </ThemeIcon>
      <Stack gap={0}>
        <Group gap={4} align="center">
          <Text size="sm" fw={600}>Ocupación de flota</Text>
          <Tooltip label="Estado operativo actual de los camiones: en ruta, disponibles o en taller." withArrow>
            <IconInfoCircle size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
          </Tooltip>
        </Group>
        <Text size="xs" c="dimmed">{periodoLabel}</Text>
      </Stack>
    </Group>
    <ScreenContainer onLoading={{ show: isLoading }} styleProps={{ bg: 'transparent', mih: '220px' }}>
      <Stack gap="md" pt="sm">
        <DonutChart
          data={OCUPACION_FLOTA}
          chartLabel={`${TOTAL} unidades`}
          size={200}
          thickness={30}
          mx="auto"
        />
        <Group gap="xl" justify="center">
          {OCUPACION_FLOTA.map((e) => (
            <Stack key={e.name} gap={2} align="center">
              <Text size="xs" c="dimmed">{e.name}</Text>
              <Text size="sm" fw={700}>{e.value}</Text>
            </Stack>
          ))}
        </Group>
      </Stack>
    </ScreenContainer>
  </Card>
);

export default FleetDonut;
