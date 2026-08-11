import { Button, Flex } from '@mantine/core';
import { Link } from 'wouter';
import { IconPlus } from '@tabler/icons-react';

import PageContainer from '@components/PageContainer';
import PageHeader from '@components/PageHeader';
import SelectedViajeProvider from './providers/selectedViaje';
import MapListadoViajes from './components/MapListadoViajes';
import MapCard from './components/MapCard';
import MapTruckMarkers from './components/MapTruckMarkers';
import MapRoute from './components/MapRoute';

const Mapa = () => (
  <SelectedViajeProvider>
    <PageContainer
      h="calc(100dvh - var(--app-shell-header-offset, 0rem) - var(--app-shell-footer-offset, 0rem))"
      pb="md"
    >
      <PageHeader
        title="Mapa en vivo"
        subtitle="Seguimiento de viajes activos en tiempo real"
      >
        <Button component={Link} to="/viajes/crear" leftSection={<IconPlus size={16} />}>
          Nuevo viaje
        </Button>
      </PageHeader>
      <Flex flex={1} gap="md" style={{ minHeight: 0 }}>
        <MapListadoViajes />
        <MapCard>
          <MapTruckMarkers />
          <MapRoute />
        </MapCard>
      </Flex>
    </PageContainer>
  </SelectedViajeProvider>
);

export default Mapa;
