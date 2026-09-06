import { BarChart } from '@mantine/charts';
import { IconRoute } from '@tabler/icons-react';

import ChartCard from './ChartCard';
import { mapDesvioViajes } from '../dashboard.mappers';

/**
 * Desvío de los viajes finalizados del período — `series.desvioViajes`
 * (`SHG-BE-003`). Una barra por viaje: `desvioMinutos = fin real - fin planificado`
 * (positivo = terminó tarde, negativo = se adelantó).
 */
const DesvioChart = ({ series, periodoLabel, isLoading, isError, onRetry }) => {
  const data = mapDesvioViajes(series);

  return (
    <ChartCard
      title="Desvío de viajes finalizados"
      tooltip="Diferencia entre la hora de fin real y la planificada de cada viaje finalizado. Positivo = terminó tarde."
      icon={<IconRoute />}
      color="orange"
      subtitle={`Minutos de desvío · ${periodoLabel}`}
      isLoading={isLoading}
      isError={isError}
      isEmpty={!data.length}
      onRetry={onRetry}
      minHeight={280}
    >
      <BarChart
        h={280}
        data={data}
        dataKey="viaje"
        series={[{ name: 'desvio', color: 'orange.5', label: 'Desvío' }]}
        valueFormatter={(value) => `${value} min`}
      />
    </ChartCard>
  );
};

export default DesvioChart;
