import { useMemo, useState } from 'react';
import { Card, Select, Stack, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import { useSelectedViaje } from '../contexts/selectedViaje';
import { useViajesConUbicacion } from '../hooks/useViajesConUbicacion';
import { filtrarViajes, getSucursalesOptions } from '../utils/filtrarViajes';
import MapListadoContenido from './MapListadoContenido';

const MapListadoViajes = () => {
  const { selectedSucursal: sucursal, setSelectedSucursal: setSucursal } = useSelectedViaje();
  const [search, setSearch] = useState('');
  const { viajes, isLoading } = useViajesConUbicacion();

  const sucursales = useMemo(() => getSucursalesOptions(viajes), [viajes]);

  const viajesFiltrados = useMemo(
    () => filtrarViajes(viajes, { sucursal, search }),
    [viajes, sucursal, search],
  );

  return (
    <Card w={340} h="100%" p="md" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <Stack gap="xs" mb="md">
        <Select
          size="sm"
          placeholder="Filtrar por sucursal"
          data={sucursales}
          value={sucursal}
          onChange={(val) => setSucursal(val ?? 'todas')}
          clearable={false}
        />
        <TextInput
          size="sm"
          radius="xl"
          variant="filled"
          placeholder="Buscar por patente o chofer"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          rightSection={<IconSearch size={14} />}
        />
      </Stack>

      <MapListadoContenido viajes={viajesFiltrados} isLoading={isLoading} />
    </Card>
  );
};

export default MapListadoViajes;
