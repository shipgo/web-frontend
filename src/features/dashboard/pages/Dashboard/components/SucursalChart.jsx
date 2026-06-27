import { Card, Group, Stack, Text, ThemeIcon, Tooltip } from "@mantine/core";
import { BarChart } from "@mantine/charts";
import { IconBuildingWarehouse, IconInfoCircle } from "@tabler/icons-react";
import ScreenContainer from "@components/ScreenContainer";
import { getTimeGranularity } from '../dashboard.helpers';

const DATA_BY_GRANULARITY = {
  sucursales: [
    { eje: 'CABA Centro', paquetes: 312 },
    { eje: 'Rosario', paquetes: 187 },
    { eje: 'Córdoba', paquetes: 143 },
    { eje: 'Mendoza', paquetes: 98 },
    { eje: 'La Plata', paquetes: 76 },
  ],
  dias: [
    { eje: 'Lun', paquetes: 98 },
    { eje: 'Mar', paquetes: 134 },
    { eje: 'Mié', paquetes: 117 },
    { eje: 'Jue', paquetes: 155 },
    { eje: 'Vie', paquetes: 142 },
    { eje: 'Sáb', paquetes: 76 },
    { eje: 'Dom', paquetes: 31 },
  ],
  semanas: [
    { eje: 'Semana 1', paquetes: 521 },
    { eje: 'Semana 2', paquetes: 643 },
    { eje: 'Semana 3', paquetes: 487 },
    { eje: 'Semana 4', paquetes: 598 },
  ],
  meses: [
    { eje: 'Ene', paquetes: 1240 },
    { eje: 'Feb', paquetes: 980 },
    { eje: 'Mar', paquetes: 1456 },
    { eje: 'Abr', paquetes: 1123 },
    { eje: 'May', paquetes: 1389 },
    { eje: 'Jun', paquetes: 1201 },
  ],
};

const SucursalChart = ({ periodoLabel, filtros, isLoading }) => {
  const granularity = getTimeGranularity(filtros);
  const data = DATA_BY_GRANULARITY[granularity];

  return (
    <Card h="100%">
      <Group gap="xs" mb="md">
        <ThemeIcon variant="light" color="violet" size="xl">
          <IconBuildingWarehouse />
        </ThemeIcon>
        <Stack gap={0}>
          <Group gap={4} align="center">
            <Text size="sm" fw={600}>Rendimiento por sucursal</Text>
            <Tooltip label="Paquetes procesados por sucursal o por período, según el filtro activo." withArrow>
              <IconInfoCircle size={14} style={{ color: 'var(--mantine-color-dimmed)' }} />
            </Tooltip>
          </Group>
          <Text size="xs" c="dimmed">{periodoLabel}</Text>
        </Stack>
      </Group>
      <ScreenContainer onLoading={{ show: isLoading }} styleProps={{ bg: 'transparent', mih: '220px' }}>
        <BarChart
          h={280}
          data={data}
          dataKey="eje"
          series={[{ name: 'paquetes', color: 'violet.5', label: 'Paquetes' }]}
        />
      </ScreenContainer>
    </Card>
  );
};

export default SucursalChart;
