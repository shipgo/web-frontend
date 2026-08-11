import { useState } from 'react';
import { Card, Group, SegmentedControl, Stack, Text, ThemeIcon } from '@mantine/core';
import { IconPackage } from '@tabler/icons-react';
import { Marker } from 'react-map-gl/mapbox';

import Map from '@components/Map';

const MARCADORES = [
  { id: 1, lat: -34.6037, lng: -58.3816, estado: 'entregado' },
  { id: 2, lat: -34.6158, lng: -58.4333, estado: 'pendiente' },
  { id: 3, lat: -34.5755, lng: -58.437, estado: 'entregado' },
  { id: 4, lat: -34.6489, lng: -58.5614, estado: 'pendiente' },
  { id: 5, lat: -34.7206, lng: -58.263, estado: 'entregado' },
  { id: 6, lat: -34.5259, lng: -58.515, estado: 'pendiente' },
  { id: 7, lat: -34.67, lng: -58.55, estado: 'entregado' },
  { id: 8, lat: -34.6083, lng: -58.3712, estado: 'pendiente' },
];

const INITIAL_VIEW = { latitude: -34.6037, longitude: -58.4816, zoom: 9 };

const MARKER_COLOR = {
  entregado: 'teal',
  pendiente: 'orange',
};

const FILTROS = [
  { label: 'Todos', value: 'todos' },
  { label: 'Entregados', value: 'entregado' },
  { label: 'Pendientes', value: 'pendiente' },
];

const OperationsMap = () => {
  const [filtro, setFiltro] = useState('todos');

  const marcadoresFiltrados = filtro === 'todos'
    ? MARCADORES
    : MARCADORES.filter((m) => m.estado === filtro);

  return (
    <Card p={0} style={{ overflow: 'hidden' }}>
      <Group p="md" gap="xs" justify="space-between">
        <Group gap="xs">
          <ThemeIcon variant="light" color="blue" size="xl">
            <IconPackage />
          </ThemeIcon>
          <Stack gap={0}>
            <Text size="sm" fw={600}>Mapa de operaciones</Text>
            <Text size="xs" c="dimmed">Envíos de hoy</Text>
          </Stack>
        </Group>
        <SegmentedControl
          size="xs"
          value={filtro}
          onChange={setFiltro}
          data={FILTROS}
        />
      </Group>
      <div style={{ height: '400px' }}>
        <Map initialViewState={INITIAL_VIEW}>
          {marcadoresFiltrados.map((m) => (
            <Marker key={m.id} latitude={m.lat} longitude={m.lng}>
              <ThemeIcon size="sm" radius="xl" color={MARKER_COLOR[m.estado]} variant="filled">
                <IconPackage size={10} />
              </ThemeIcon>
            </Marker>
          ))}
        </Map>
      </div>
    </Card>
  );
};

export default OperationsMap;
