import { useMemo, useState } from 'react';
import { Card, Center, Loader, TextInput, Select, Stack, ScrollArea, Text } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import { useSelectedViaje } from '../contexts/selectedViaje';
import { useViajesConUbicacion } from '../hooks/useViajesConUbicacion';
import { getEstadoVisualViaje } from '../utils/estadoVisual';
import MapListadoViajesItem from './MapListadoViajesItem';

const MapListadoViajes = () => {
  const { selectedSucursal: sucursal, setSelectedSucursal: setSucursal } = useSelectedViaje();
  const [search, setSearch] = useState('');
  const { viajes, isLoading } = useViajesConUbicacion();

  const sucursales = useMemo(() => {
    const nombres = [...new Set(viajes.map((v) => v.sucursalNombre).filter(Boolean))].sort();
    return [
      { value: 'todas', label: 'Todas las sucursales' },
      ...nombres.map((nombre) => ({ value: nombre, label: nombre })),
    ];
  }, [viajes]);

  const viajesFiltrados = useMemo(() => {
    const q = search.trim().toLowerCase();

    return viajes
      .filter((v) => {
        const matchSucursal = sucursal === 'todas' || v.sucursalNombre === sucursal;
        const matchSearch =
          !q ||
          v.patente.toLowerCase().includes(q) ||
          v.choferNombre.toLowerCase().includes(q);
        return matchSucursal && matchSearch;
      })
      .sort((a, b) => {
        const prioridadA = getEstadoVisualViaje(a, a.ultimaActualizacion).prioridad;
        const prioridadB = getEstadoVisualViaje(b, b.ultimaActualizacion).prioridad;
        return prioridadA - prioridadB;
      });
  }, [viajes, sucursal, search]);

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

      <ScrollArea style={{ flex: 1 }} offsetScrollbars>
        {isLoading ? (
          <Center mt="xl">
            <Loader size="sm" />
          </Center>
        ) : viajesFiltrados.length === 0 ? (
          <Text c="dimmed" size="sm" ta="center" mt="xl">
            Sin viajes para los filtros seleccionados
          </Text>
        ) : (
          viajesFiltrados.map((viaje, index) => (
            <MapListadoViajesItem
              key={viaje.id}
              viaje={viaje}
              isLast={index === viajesFiltrados.length - 1}
            />
          ))
        )}
      </ScrollArea>
    </Card>
  );
};

export default MapListadoViajes;
