import { Center, Loader, ScrollArea, Text } from '@mantine/core';

import MapListadoViajesItem from './MapListadoViajesItem';

/** Lista scrolleable de viajes en curso (compartida por la lista lateral y la hoja mobile). */
const MapListadoContenido = ({ viajes, isLoading }) => (
  <ScrollArea style={{ flex: 1, minHeight: 0 }} offsetScrollbars>
    {isLoading ? (
      <Center mt="xl">
        <Loader size="sm" />
      </Center>
    ) : viajes.length === 0 ? (
      <Text c="dimmed" size="sm" ta="center" mt="xl">
        Sin viajes para los filtros seleccionados
      </Text>
    ) : (
      viajes.map((viaje, index) => (
        <MapListadoViajesItem key={viaje.id} viaje={viaje} isLast={index === viajes.length - 1} />
      ))
    )}
  </ScrollArea>
);

export default MapListadoContenido;
