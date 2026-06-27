import { useRef, useState } from 'react';

import { Button, Flex, Grid, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import {
  IconAlertTriangle,
  IconDownload,
  IconPackage,
  IconRoute,
  IconTruck,
} from '@tabler/icons-react';
import PageContainer from '@components/PageContainer';

import { getPeriodoLabel } from './dashboard.helpers';
import DashboardFiltros from './components/DashboardFiltros';
import KpiCard from './components/KpiCard';
import VolumeChart from './components/VolumeChart';
import FleetDonut from './components/FleetDonut';
import TamanoCargaDonut from './components/TamanoCargaDonut';
import SucursalChart from './components/SucursalChart';
import FallosChart from './components/FallosChart';
import DesvioChart from './components/DesvioChart';
import IncidenciasTable from './components/IncidenciasTable';

const ENVIOS_HOY = { total: 142, entregados: 89, pendientes: 53 };
const VIAJES_ACTIVOS = 17;
const ALERTAS = { total: 8, criticas: 3 };
const FLOTA = { operativos: 24, enTaller: 6, total: 30 };

const DEFAULT_FILTROS = { date: [null, null], sucursal: null, quickFilterLabel: null };

const DashboardPage = () => {
  const [filtros, setFiltros] = useState(DEFAULT_FILTROS);
  const [isLoading, setIsLoading] = useState(false);
  const loadingTimerRef = useRef(null);

  const periodoLabel = getPeriodoLabel(filtros);

  const handleFiltersChange = (newFiltros) => {
    clearTimeout(loadingTimerRef.current);
    setIsLoading(true);
    setFiltros(newFiltros);
    loadingTimerRef.current = setTimeout(() => setIsLoading(false), 700);
  };

  return (
    <PageContainer>
      <Flex justify="space-between" align="flex-end">
        <Stack gap="0">
          <Title order={2}>Dashboard</Title>
          <Text c="dimmed">Resumen operativo del día</Text>
        </Stack>
        <Flex gap="xs">
          <Button variant="light" leftSection={<IconDownload size={16} />}>
            Exportar PDF
          </Button>
          <Button variant="subtle">
            Necesito ayuda
          </Button>
        </Flex>
      </Flex>

      <DashboardFiltros onFiltersChange={handleFiltersChange} />

      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }}>
        <KpiCard
          title="Envíos para hoy"
          value={ENVIOS_HOY.total}
          subtitle={`${ENVIOS_HOY.entregados} entregados · ${ENVIOS_HOY.pendientes} pendientes`}
          icon={<IconPackage />}
          color="teal"
          isLoading={isLoading}
          tooltip="Total de envíos programados para el día. Incluye entregados y pendientes."
        />
        <KpiCard
          title="Viajes Activos"
          value={VIAJES_ACTIVOS}
          subtitle="camiones en ruta ahora"
          icon={<IconRoute />}
          color="blue"
          isLoading={isLoading}
          tooltip="Camiones actualmente en ruta en el turno activo."
        />
        <KpiCard
          title="Alertas / Atrasos"
          value={ALERTAS.total}
          subtitle={`${ALERTAS.criticas} críticas · ${ALERTAS.total - ALERTAS.criticas} moderadas`}
          icon={<IconAlertTriangle />}
          color="red"
          isLoading={isLoading}
          tooltip="Incidencias activas detectadas. Las críticas requieren atención inmediata."
        />
        <KpiCard
          title="Disponibilidad de Flota"
          value={`${FLOTA.operativos}/${FLOTA.total}`}
          subtitle={`${FLOTA.enTaller} en taller`}
          icon={<IconTruck />}
          color="green"
          isLoading={isLoading}
          tooltip="Camiones operativos sobre el total disponible. Excluye los que están en taller."
        />
      </SimpleGrid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <VolumeChart periodoLabel={periodoLabel} isLoading={isLoading} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <FleetDonut periodoLabel={periodoLabel} isLoading={isLoading} />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <TamanoCargaDonut periodoLabel={periodoLabel} isLoading={isLoading} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 8 }}>
          <SucursalChart periodoLabel={periodoLabel} filtros={filtros} isLoading={isLoading} />
        </Grid.Col>
      </Grid>

      <Grid>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <FallosChart periodoLabel={periodoLabel} filtros={filtros} isLoading={isLoading} />
        </Grid.Col>
        <Grid.Col span={{ base: 12, md: 6 }}>
          <DesvioChart periodoLabel={periodoLabel} isLoading={isLoading} />
        </Grid.Col>
      </Grid>

      <IncidenciasTable periodoLabel={periodoLabel} isLoading={isLoading} />
    </PageContainer>
  );
};

export default DashboardPage;
