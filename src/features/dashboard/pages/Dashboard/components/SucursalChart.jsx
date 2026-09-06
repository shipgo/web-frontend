import { BarChart } from '@mantine/charts';
import { IconBuildingWarehouse } from '@tabler/icons-react';

import ChartCard from './ChartCard';
import { isSerieVacia, mapVolumenPorSucursal } from '../dashboard.mappers';

/**
 * Volumen de envíos por sucursal de origen — `series.volumenPorSucursal`
 * (`SHG-BE-003`). Con una sucursal puntual seleccionada (o para un ADMIN) queda
 * una sola barra; con "todas" (SUPERUSER) se ven todas las del alcance.
 */
const SucursalChart = ({ series, periodoLabel, isLoading, isError, onRetry }) => {
  const data = mapVolumenPorSucursal(series);

  return (
    <ChartCard
      title="Envíos por sucursal"
      tooltip="Envíos dados de alta en el período, agrupados por sucursal de origen."
      icon={<IconBuildingWarehouse />}
      color="violet"
      subtitle={periodoLabel}
      isLoading={isLoading}
      isError={isError}
      isEmpty={isSerieVacia(data, 'cantidad')}
      onRetry={onRetry}
      minHeight={280}
    >
      <BarChart
        h={280}
        data={data}
        dataKey="sucursal"
        series={[{ name: 'cantidad', color: 'violet.5', label: 'Envíos' }]}
      />
    </ChartCard>
  );
};

export default SucursalChart;
