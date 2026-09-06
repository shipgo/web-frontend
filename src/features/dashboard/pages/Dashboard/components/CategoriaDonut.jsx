import { DonutChart } from '@mantine/charts';
import { Group, Stack, Text } from '@mantine/core';
import { IconPackage } from '@tabler/icons-react';

import ChartCard from './ChartCard';
import {
  getCategoriaTotal,
  isDonutVacio,
  mapVolumenPorCategoria,
} from '../dashboard.mappers';

/**
 * Volumen de envíos por categoría — `series.volumenPorCategoria` (`SHG-BE-003`).
 *
 * Reemplaza al viejo `TamanoCargaDonut` ("tamaño de carga"): `CONTRACTS.md §2`
 * eliminó `tamano` / dimensiones del modelo de Envío en el MVP, así que ese widget
 * quedó sin dato de backend. El backend expone en su lugar el conteo de líneas de
 * `detalleEnvio` por categoría.
 */
const CategoriaDonut = ({ series, periodoLabel, isLoading, isError, onRetry }) => {
  const data = mapVolumenPorCategoria(series);
  const total = getCategoriaTotal(series);

  return (
    <ChartCard
      title="Envíos por categoría"
      tooltip="Distribución de las líneas de detalle de los envíos del período, por categoría de carga."
      icon={<IconPackage />}
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
          chartLabel={`${total} líneas`}
          size={160}
          thickness={24}
          mx="auto"
        />
        <Group gap="sm" justify="center" wrap="wrap">
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

export default CategoriaDonut;
