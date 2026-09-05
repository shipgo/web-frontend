import { ActionIcon, Badge, Box, Divider, Group, Text, Tooltip } from '@mantine/core';
import { useHover } from '@mantine/hooks';
import { IconBrandWhatsapp } from '@tabler/icons-react';

import { formatFechaHora } from '@domain/format';
import { useSelectedViaje } from '../contexts/selectedViaje';
import { getEstadoVisualViaje } from '../utils/estadoVisual';

const MapListadoViajesItem = ({ viaje, isLast }) => {
  const { hovered, ref } = useHover();
  const { selectedViajeId, setSelectedViajeId } = useSelectedViaje();

  const isSelected = selectedViajeId === viaje.id;
  const estado = getEstadoVisualViaje(viaje, viaje.ultimaActualizacion);
  const chofer = viaje.chofer;

  const handleWhatsApp = (e) => {
    e.stopPropagation();
    const digitos = `${chofer?.prefijo ?? ''}${chofer?.telefono ?? ''}`.replace(/\D/g, '');
    if (!digitos) return;
    window.open(`https://wa.me/54${digitos}`, '_blank');
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
              {viaje.choferNombre}
            </Text>
            {chofer?.telefono && (
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
            )}
          </Group>
          <Text size="xs" c="dimmed">
            {viaje.sucursalNombre}
          </Text>
        </Group>

        <Group gap="xs" mt={4}>
          <Text size="xs" c="dimmed">
            Llegada estimada: {formatFechaHora(viaje.fechaHoraFinPlanificada)}
          </Text>
        </Group>
      </Box>
      {!isLast && <Divider />}
    </>
  );
};

export default MapListadoViajesItem;
