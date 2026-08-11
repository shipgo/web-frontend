import { Card, Flex, Text } from '@mantine/core';

import { useSelectedViaje } from '../contexts/selectedViaje';
import { VIAJES_MOCK } from '../mocks';

const MapPlaceholder = () => {
  const { selectedViajeId } = useSelectedViaje();
  const viaje = VIAJES_MOCK.find((v) => v.id === selectedViajeId);

  return (
    <Card flex={1} p={0}>
      <Flex h="100%" align="center" justify="center">
        {viaje ? (
          <Text c="dimmed" size="sm" ta="center">
            Simulando cámara de Mapbox centrada en:{' '}
            <Text span fw={600} c="inherit">
              {viaje.chofer}
            </Text>{' '}
            — Sucursal:{' '}
            <Text span fw={600} c="inherit">
              {viaje.sucursal}
            </Text>
          </Text>
        ) : (
          <Text c="dimmed" size="sm">
            Seleccioná un viaje para rastrear su ruta
          </Text>
        )}
      </Flex>
    </Card>
  );
};

export default MapPlaceholder;
