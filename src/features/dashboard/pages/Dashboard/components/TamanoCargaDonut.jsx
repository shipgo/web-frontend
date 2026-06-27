import { Card, Group, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { DonutChart } from '@mantine/charts';
import { IconPackage, IconInfoCircle } from '@tabler/icons-react';
import ScreenContainer from '@components/ScreenContainer';

const TAMANO_CARGA = [
  { name: 'Sobres', value: 234, color: 'blue.4' },
  { name: 'Caja chica', value: 312, color: 'teal.5' },
  { name: 'Caja mediana', value: 187, color: 'violet.5' },
  { name: 'Caja grande', value: 98, color: 'orange.5' },
  { name: 'Carga irregular', value: 43, color: 'red.5' },
];

const TOTAL = TAMANO_CARGA.reduce((acc, e) => acc + e.value, 0);

const TamanoCargaDonut = ({ periodoLabel, isLoading }) => (
  <Card h="100%">
    <Group gap="xs" mb="md">
      <ThemeIcon variant="light" color="teal" size="xl">
        <IconPackage />
      </ThemeIcon>
      <Stack gap={0}>
        <Group gap={4} align="center">
          <Text size="sm" fw={600}>Volumen por tamaño</Text>
          <Tooltip label="Distribución de envíos según el tamaño del paquete en el período seleccionado." withArrow>
            <IconInfoCircle size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
          </Tooltip>
        </Group>
        <Text size="xs" c="dimmed">{periodoLabel}</Text>
      </Stack>
    </Group>
    <ScreenContainer onLoading={{ show: isLoading }} styleProps={{ bg: 'transparent', mih: '220px' }}>
      <Stack gap="md" pt="sm">
        <DonutChart
          data={TAMANO_CARGA}
          chartLabel={`${TOTAL} envíos`}
          size={160}
          thickness={24}
          mx="auto"
        />
        <Group gap="sm" justify="center" wrap="wrap">
          {TAMANO_CARGA.map((e) => (
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

export default TamanoCargaDonut;
