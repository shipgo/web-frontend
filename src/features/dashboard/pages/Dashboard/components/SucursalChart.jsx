import { Card, Group, Stack, Text, ThemeIcon } from "@mantine/core";
import { BarChart } from "@mantine/charts";
import { IconBuildingWarehouse } from "@tabler/icons-react";
import ScreenContainer from "@components/ScreenContainer";

const VOLUMEN_SUCURSALES = [
  { sucursal: "CABA Centro", paquetes: 312 },
  { sucursal: "Rosario", paquetes: 187 },
  { sucursal: "Córdoba", paquetes: 143 },
  { sucursal: "Mendoza", paquetes: 98 },
  { sucursal: "La Plata", paquetes: 76 },
];

const SucursalChart = ({ periodoLabel, isLoading }) => (
  <Card h="100%">
    <Group gap="xs" mb="md">
      <ThemeIcon variant="light" color="violet" size="xl">
        <IconBuildingWarehouse />
      </ThemeIcon>
      <Stack gap={0}>
        <Text size="sm" fw={600}>
          Rendimiento por sucursal
        </Text>
        <Text size="xs" c="dimmed">
          {periodoLabel}
        </Text>
      </Stack>
    </Group>
    <ScreenContainer onLoading={{ show: isLoading }} styleProps={{ bg: 'transparent', mih: '220px' }}>
      <BarChart
        h={280}
        data={VOLUMEN_SUCURSALES}
        dataKey="sucursal"
        series={[{ name: "paquetes", color: "violet.5", label: "Paquetes" }]}
      />
    </ScreenContainer>
  </Card>
);

export default SucursalChart;
