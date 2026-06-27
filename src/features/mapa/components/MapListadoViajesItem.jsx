import { ActionIcon, Badge, Box, Divider, Group, Text, Tooltip } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { IconBrandWhatsapp } from '@tabler/icons-react';

import { useSelectedViaje } from '../contexts/selectedViaje';
import { ESTADO_CONFIG } from '../mocks';

const MapListadoViajesItem = ({ viaje, isLast }) => {
  const { hovered, ref } = useHover();
  const { selectedViajeId, setSelectedViajeId } = useSelectedViaje();

  const isSelected = selectedViajeId === viaje.id;
  const estado = ESTADO_CONFIG[viaje.estado];

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    window.open(`https://wa.me/54${viaje.telefono}`, '_blank');
  };

  return (
    <>
      <Box
        ref={ref}
        px="md"
        py="sm"
        style={{ cursor: 'pointer' }}
        onClick={() => setSelectedViajeId(viaje.id)}
        bg={isSelected ? 'var(--mantine-color-blue-light)' : hovered ? 'var(--mantine-color-default-hover)' : undefined}
      >
        <Group justify="space-between" mb={4}>
          <Text fw={700} size="sm">
            {viaje.patente}
          </Text>
          <Badge variant="light" color={estado.color} size="sm">
            {estado.label}
          </Badge>
        </Group>

        <Group justify="space-between">
          <Group gap={6}>
            <Text size="sm" c="dimmed">
              {viaje.chofer}
            </Text>
            <Tooltip label="Contactar por WhatsApp" position="right">
              <ActionIcon
                variant="subtle"
                color="green"
                size="sm"
                onClick={handleWhatsApp}
              >
                <IconBrandWhatsapp size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Text size="xs" c="dimmed">
            {viaje.sucursal}
          </Text>
        </Group>

        <Group gap="xs" mt={4}>
          <Text size="xs" c="dimmed">
            ETA: {viaje.eta}
          </Text>
          <Text size="xs" c="dimmed">·</Text>
          <Text size="xs" c="dimmed">
            {viaje.paquetesRestantes} paquetes restantes
          </Text>
        </Group>
      </Box>
      {!isLast && <Divider />}
    </>
  );
};

export default MapListadoViajesItem;
