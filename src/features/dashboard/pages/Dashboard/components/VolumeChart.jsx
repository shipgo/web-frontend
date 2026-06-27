import { Card, Group, Stack, Text, ThemeIcon, Tooltip } from "@mantine/core";
import { BarChart } from "@mantine/charts";
import { IconChartBar, IconInfoCircle } from "@tabler/icons-react";
import ScreenContainer from "@components/ScreenContainer";

const VOLUMEN_SEMANAL = [
  { dia: "Lunes", paquetes: 98 },
  { dia: "Martes", paquetes: 134 },
  { dia: "Miércoles", paquetes: 117 },
  { dia: "Jueves", paquetes: 155 },
  { dia: "Viernes", paquetes: 142 },
  { dia: "Sábado", paquetes: 76 },
  { dia: "Domingo", paquetes: 31 },
];

const VolumeChart = ({ periodoLabel, isLoading }) => (
  <Card h="100%">
    <Group gap="xs" mb="md">
      <ThemeIcon variant="light" color="blue" size="xl">
        <IconChartBar />
      </ThemeIcon>
      <Stack gap={0}>
        <Group gap={4} align="center">
          <Text size="sm" fw={600}>Volumen de paquetes</Text>
          <Tooltip label="Total de paquetes procesados por día en el período seleccionado." withArrow>
            <IconInfoCircle size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
          </Tooltip>
        </Group>
        <Text size="xs" c="dimmed">{periodoLabel}</Text>
      </Stack>
    </Group>
    <ScreenContainer onLoading={{ show: isLoading }} styleProps={{ bg: 'transparent', mih: '220px' }}>
      <BarChart
        h={260}
        data={VOLUMEN_SEMANAL}
        dataKey="dia"
        series={[{ name: "paquetes", color: "blue.5", label: "Paquetes" }]}
      />
    </ScreenContainer>
  </Card>
);

export default VolumeChart;
