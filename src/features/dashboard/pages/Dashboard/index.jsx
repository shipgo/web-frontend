import { useMemo, useState } from 'react';

import { Button, Flex, Grid, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import {
  IconAlertTriangle,
  IconClockCheck,
  IconDownload,
  IconPackage,
  IconRoute,
} from '@tabler/icons-react';

import PageContainer from '@components/PageContainer';
import PageHeader from '@components/PageHeader';
import { useIsMobile } from '@hooks/useIsMobile';
import { useOperatingContext } from '@contexts/operatingContext';

import { getDefaultFiltros, getPeriodoLabel, toDashboardParams } from './dashboard.helpers';
import { mapResumenToKpis } from './dashboard.mappers';
import { exportarDashboardPDF } from './exportarDashboard';
import {
  useDashboardResumen,
  useDashboardSeries,
} from './hooks/useDashboardData';
import DashboardFiltros from './components/DashboardFiltros';
import KpiCard from './components/KpiCard';
import VolumeChart from './components/VolumeChart';
import FleetDonut from './components/FleetDonut';
import StatusDonut from './components/StatusDonut';
import CategoriaDonut from './components/CategoriaDonut';
import SucursalChart from './components/SucursalChart';
import DesvioChart from './components/DesvioChart';

const pct = (value) => (value == null ? '—' : `${Math.round(value)}%`);

const DashboardPage = () => {
  // SHG-FE-052: sembrar el filtro de sucursal del dashboard con la sucursal
  // operativa activa del selector del header (si el SUPERUSER eligió una).
  // Sólo se usa como valor INICIAL — a partir de ahí `DashboardFiltros` (su
  // propio selector, ya existente) manda; cambiar la sucursal del header
  // mientras el dashboard sigue abierto no lo pisa, para no pelear con una
  // elección manual que el usuario ya haya hecho en esta pantalla.
  const isMobile = useIsMobile();
  const { activeSucursalId } = useOperatingContext();
  const [filtros, setFiltros] = useState(() =>
    getDefaultFiltros(activeSucursalId != null ? String(activeSucursalId) : null),
  );

  const params = useMemo(() => toDashboardParams(filtros), [filtros]);

  const resumenQuery = useDashboardResumen(params);
  const seriesQuery = useDashboardSeries(params);

  const kpis = useMemo(
    () => mapResumenToKpis(resumenQuery.data),
    [resumenQuery.data],
  );

  const periodoLabel = getPeriodoLabel(filtros, filtros.sucursalLabel);

  const resumenLoading = resumenQuery.isFetching;
  const resumenError = resumenQuery.isError;
  const seriesLoading = seriesQuery.isFetching;
  const seriesError = seriesQuery.isError;

  const handleExportar = () =>
    exportarDashboardPDF({
      filtros,
      params,
      resumen: resumenQuery.data,
      series: seriesQuery.data,
    });

  return (
    <PageContainer>
      {isMobile ? (
        <PageHeader
          title="Dashboard"
          subtitle={periodoLabel}
          primaryAction={{
            label: 'Exportar PDF',
            icon: <IconDownload size={20} />,
            onClick: handleExportar,
          }}
        />
      ) : (
        <Flex justify="space-between" align="flex-end" wrap="wrap" gap="md">
          <Stack gap="0">
            <Title order={2}>Dashboard</Title>
            <Text c="dimmed">Resumen · {periodoLabel}</Text>
          </Stack>
          <Flex gap="xs">
            {/* `c="var(--shg-button-text-primary)"`: ver ese token en
                `cssVariablesResolver.js` (SHG-FE-069) — sin esto, el texto
                del color primario en `variant="light"` no llega a 4.5:1 en
                dark mode (axe-core `color-contrast`, SHG-FE-070). */}
            <Button
              variant="light"
              leftSection={<IconDownload size={16} />}
              onClick={handleExportar}
              c="var(--shg-button-text-primary)"
            >
              Exportar PDF
            </Button>
            <Button
              variant="subtle"
              component="a"
              href="https://shipgo.gitbook.io/manual"
              target="_blank"
            >
              Ayuda
            </Button>
          </Flex>
        </Flex>
      )}

      <DashboardFiltros value={filtros} onChange={setFiltros} />

      <SimpleGrid cols={{ base: 2, lg: 4 }} spacing={{ base: 'xs', sm: 'md' }}>
        <KpiCard
          title="Envíos del período"
          value={kpis ? kpis.envios.value : '—'}
          subtitle={
            kpis
              ? `${kpis.envios.entregados} entregados · ${kpis.envios.pendientes} pendientes`
              : ''
          }
          icon={<IconPackage />}
          color="teal"
          isLoading={resumenLoading}
          isError={resumenError}
          onRetry={resumenQuery.refetch}
          tooltip="Envíos creados en el período seleccionado."
        />
        <KpiCard
          title="Viajes activos"
          value={kpis ? kpis.viajesActivos.value : '—'}
          subtitle={
            kpis
              ? `${kpis.viajesActivos.planificados} planificados · ${kpis.viajesActivos.finalizados} finalizados`
              : ''
          }
          icon={<IconRoute />}
          color="blue"
          isLoading={resumenLoading}
          isError={resumenError}
          onRetry={resumenQuery.refetch}
          tooltip="Viajes en carga o en camino. Abajo, como referencia, los planificados y los finalizados del período."
        />
        <KpiCard
          title="Incidencias"
          value={kpis ? kpis.incidencias.value : '—'}
          subtitle={
            kpis
              ? `${kpis.incidencias.viajesConProblemas} viajes · ${kpis.incidencias.enviosRechazados} envíos no entregados`
              : ''
          }
          icon={<IconAlertTriangle />}
          color="red"
          isLoading={resumenLoading}
          isError={resumenError}
          onRetry={resumenQuery.refetch}
          tooltip="Viajes con problemas y envíos no entregados en el período."
        />
        <KpiCard
          title="Entregas a tiempo"
          value={kpis ? pct(kpis.entregasATiempo.porcentaje) : '—'}
          subtitle={
            kpis
              ? `${kpis.entregasATiempo.aTiempo} de ${kpis.entregasATiempo.base} entregas llegaron en el horario planificado`
              : ''
          }
          icon={<IconClockCheck />}
          color="grape"
          ring={
            kpis && kpis.entregasATiempo.porcentaje != null
              ? {
                  sections: [
                    { value: kpis.entregasATiempo.porcentaje, color: 'teal' },
                  ],
                  label: `${kpis.entregasATiempo.aTiempo}/${kpis.entregasATiempo.base}`,
                }
              : null
          }
          isLoading={resumenLoading}
          isError={resumenError}
          onRetry={resumenQuery.refetch}
          tooltip="Entregas dentro del horario planificado del viaje, sobre el total de entregas con viaje."
        />
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <VolumeChart
            series={seriesQuery.data}
            periodoLabel={periodoLabel}
            isLoading={seriesLoading}
            isError={seriesError}
            onRetry={seriesQuery.refetch}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <FleetDonut
            resumen={resumenQuery.data}
            isLoading={resumenLoading}
            isError={resumenError}
            onRetry={resumenQuery.refetch}
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <CategoriaDonut
            series={seriesQuery.data}
            periodoLabel={periodoLabel}
            isLoading={seriesLoading}
            isError={seriesError}
            onRetry={seriesQuery.refetch}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <SucursalChart
            series={seriesQuery.data}
            periodoLabel={periodoLabel}
            isLoading={seriesLoading}
            isError={seriesError}
            onRetry={seriesQuery.refetch}
          />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <StatusDonut
            resumen={resumenQuery.data}
            periodoLabel={periodoLabel}
            isLoading={resumenLoading}
            isError={resumenError}
            onRetry={resumenQuery.refetch}
          />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <DesvioChart
            series={seriesQuery.data}
            periodoLabel={periodoLabel}
            isLoading={seriesLoading}
            isError={seriesError}
            onRetry={seriesQuery.refetch}
          />
        </Grid.Col>
      </Grid>
    </PageContainer>
  );
};

export default DashboardPage;
