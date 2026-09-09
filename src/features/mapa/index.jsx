import { Box, Button, Flex } from '@mantine/core';
import { Link } from 'wouter';
import { IconPlus } from '@tabler/icons-react';

import PageContainer from '@components/PageContainer';
import PageHeader from '@components/PageHeader';
import SelectedViajeProvider from './providers/selectedViaje';
import TrackingProvider from './providers/tracking';
import MapListadoViajes from './components/MapListadoViajes';
import MapCard from './components/MapCard';
import MapTruckMarkers from './components/MapTruckMarkers';
import MapRoute from './components/MapRoute';
import MapDetalles from './components/MapDetalles';
import MapTrackingStatus from './components/MapTrackingStatus';

const Mapa = () => (
  <SelectedViajeProvider>
    <TrackingProvider>
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
          <Box style={{ position: 'relative', flex: 1, minWidth: 0 }}>
            <MapCard style={{ position: 'absolute', inset: 0 }}>
              <MapTruckMarkers />
              <MapRoute />
            </MapCard>
            <MapTrackingStatus />
            <MapDetalles />
          </Box>
        </Flex>
      </PageContainer>
    </TrackingProvider>
  </SelectedViajeProvider>
);

export default Mapa;
