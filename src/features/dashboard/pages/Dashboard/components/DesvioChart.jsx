import { BarChart } from '@mantine/charts';
import { IconRoute } from '@tabler/icons-react';

import ChartCard from './ChartCard';
import { useBarChartProps } from './useChartProps';
import { mapDesvioViajes } from '../dashboard.mappers';

/**
 * Desvío de los viajes finalizados del período — `series.desvioViajes`
 * (`SHG-BE-003`). Una barra por viaje: `desvioMinutos = fin real - fin planificado`
 * (positivo = terminó tarde, negativo = se adelantó).
 */
const DesvioChart = ({ series, periodoLabel, isLoading, isError, onRetry }) => {
  const chartProps = useBarChartProps(280);
  const data = mapDesvioViajes(series);

  return (
    <ChartCard
      title="Retraso o adelanto de los viajes finalizados"
      tooltip="Minutos respecto de lo planificado (positivo = terminó tarde)."
      icon={<IconRoute />}
      color="orange"
      subtitle={`Minutos · ${periodoLabel}`}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data.length}
      onRetry={onRetry}
      minHeight={280}
    >
      <BarChart
        {...chartProps}
        data={data}
        dataKey="viaje"
        series={[{ name: 'desvio', color: 'orange.5', label: 'Minutos' }]}
        valueFormatter={(value) => `${value} min`}
      />
    </ChartCard>
  );
};

export default DesvioChart;
