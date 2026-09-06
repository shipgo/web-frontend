import { BarChart } from '@mantine/charts';
import { IconChartBar } from '@tabler/icons-react';

import ChartCard from './ChartCard';
import { isSerieVacia, mapVolumenPorDia } from '../dashboard.mappers';

/**
 * Volumen de envíos dados de alta por día — `series.volumenPorDia` (`SHG-BE-003`).
 * El backend rellena los días en 0, así que el eje X no tiene huecos.
 */
const VolumeChart = ({ series, periodoLabel, isLoading, isError, onRetry }) => {
  const data = mapVolumenPorDia(series);

  return (
    <ChartCard
      title="Volumen de envíos"
      tooltip="Envíos dados de alta por día en el período seleccionado."
      icon={<IconChartBar />}
      color="blue"
      subtitle={periodoLabel}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isSerieVacia(data, 'cantidad')}
      onRetry={onRetry}
    >
      <BarChart
        h={260}
        data={data}
        dataKey="fecha"
        series={[{ name: 'cantidad', color: 'blue.5', label: 'Envíos' }]}
      />
    </ChartCard>
  );
};

export default VolumeChart;
