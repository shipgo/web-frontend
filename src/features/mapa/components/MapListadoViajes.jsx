import { useMemo, useState } from 'react';
import { Card, TextInput, Select, Stack, ScrollArea, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import { ESTADO_CONFIG, SUCURSALES, VIAJES_MOCK } from '../mocks';
import { useSelectedViaje } from '../contexts/selectedViaje';
import MapListadoViajesItem from './MapListadoViajesItem';

const MapListadoViajes = () => {
  const { selectedSucursal: sucursal, setSelectedSucursal: setSucursal } = useSelectedViaje();
  const [search, setSearch] = useState('');

  const viajes = useMemo(() => {
    const q = search.trim().toLowerCase();

    return VIAJES_MOCK
      .filter((v) => {
        const matchSucursal = sucursal === 'todas' || v.sucursal === sucursal;
        const matchSearch =
          !q ||
          v.patente.toLowerCase().includes(q) ||
          v.chofer.toLowerCase().includes(q);
        return matchSucursal && matchSearch;
      })
      .sort((a, b) => ESTADO_CONFIG[a.estado].urgency - ESTADO_CONFIG[b.estado].urgency);
  }, [sucursal, search]);

  return (
    <Card w={340} h="100%" p="md" style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
      <Stack gap="xs" mb="md">
        <Select
          size="sm"
          placeholder="Filtrar por sucursal"
          data={SUCURSALES}
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

      <ScrollArea style={{ flex: 1 }} offsetScrollbars>
        {viajes.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" mt="xl">
            Sin viajes para los filtros seleccionados
          </Text>
        ) : (
          viajes.map((viaje, index) => (
            <MapListadoViajesItem
              key={viaje.id}
              viaje={viaje}
              isLast={index === viajes.length - 1}
            />
          ))
        )}
      </ScrollArea>
    </Card>
  );
};

export default MapListadoViajes;
