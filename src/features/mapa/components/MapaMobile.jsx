import { useEffect, useMemo, useState } from 'react';
import { Link } from 'wouter';
import { ActionIcon, Box, Flex, Select, TextInput } from '@mantine/core';
import { IconPlus, IconSearch } from '@tabler/icons-react';

import { useSelectedViaje } from '../contexts/selectedViaje';
import { useViajesConUbicacion } from '../hooks/useViajesConUbicacion';
import { filtrarViajes, getSucursalesOptions } from '../utils/filtrarViajes';
import MapBottomSheet from './MapBottomSheet';
import MapListadoContenido from './MapListadoContenido';
import MapCard from './MapCard';
import MapTruckMarkers from './MapTruckMarkers';
import MapRoute from './MapRoute';
import MapDetalles from './MapDetalles';
import MapTrackingStatus from './MapTrackingStatus';

const tituloHoja = (n) => `${n} ${n === 1 ? 'viaje en curso' : 'viajes en curso'}`;

/**
 * Mapa en vivo en mobile (< sm): mapa a pantalla completa del contenido, buscador
 * y filtros superpuestos arriba (fila con scroll horizontal) y lista de viajes en
 * una hoja inferior de tres alturas.
 */
const MapaMobile = () => {
  const { selectedViajeId, selectedSucursal: sucursal, setSelectedSucursal } = useSelectedViaje();
  const [search, setSearch] = useState('');
  const [snap, setSnap] = useState('peek');
  const { viajes, isLoading } = useViajesConUbicacion();

  const sucursales = useMemo(() => getSucursalesOptions(viajes), [viajes]);
  const viajesFiltrados = useMemo(
    () => filtrarViajes(viajes, { sucursal, search }),
    [viajes, sucursal, search],
  );

  // Al elegir un viaje la hoja baja a "asomada" para dejar ver el mapa y el panel.
  useEffect(() => {
    if (selectedViajeId != null) setSnap('peek');
  }, [selectedViajeId]);

  return (
    <Box
      data-testid="mapa-mobile"
      pos="relative"
      h="calc(100dvh - var(--app-shell-header-offset, 0rem) - var(--app-shell-footer-offset, 0rem))"
      style={{ overflow: 'hidden' }}
    >
      <MapCard style={{ position: 'absolute', inset: 0, borderRadius: 0 }} showControls={false}>
        <MapTruckMarkers />
        <MapRoute />
      </MapCard>

      <Flex pos="absolute" top={12} left={12} right={12} gap="xs" align="center" style={{ zIndex: 3 }}>
        <Flex
          flex={1}
          gap="xs"
          wrap="nowrap"
          data-testid="mapa-filtros-scroll"
          style={{ overflowX: 'auto', minWidth: 0, scrollbarWidth: 'none' }}
        >
          <TextInput
            size="md"
            radius="xl"
            placeholder="Patente o chofer"
            aria-label="Buscar por patente o chofer"
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            rightSection={<IconSearch size={16} />}
            w={220}
            style={{ flexShrink: 0 }}
          />
          {sucursales.length > 2 && (
            <Select
              size="md"
              radius="xl"
              aria-label="Filtrar por sucursal"
              data={sucursales}
              value={sucursal}
              onChange={(val) => setSelectedSucursal(val ?? 'todas')}
              clearable={false}
              allowDeselect={false}
              w={210}
              style={{ flexShrink: 0 }}
            />
          )}
        </Flex>
        <ActionIcon
          component={Link}
          to="/viajes/crear"
          size={44}
          radius="xl"
          variant="filled"
          aria-label="Nuevo viaje"
          style={{ flexShrink: 0 }}
        >
          <IconPlus size={22} />
        </ActionIcon>
      </Flex>

      <MapTrackingStatus />
      <MapDetalles />

      <MapBottomSheet snap={snap} onSnapChange={setSnap} title={tituloHoja(viajesFiltrados.length)}>
        <MapListadoContenido viajes={viajesFiltrados} isLoading={isLoading} />
      </MapBottomSheet>
    </Box>
  );
};

export default MapaMobile;
