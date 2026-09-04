import { Badge, Box, Button, Divider, Group, SimpleGrid, Stack, Text, Title, Tooltip } from '@mantine/core';
import {
  IconArrowLeft,
  IconBan,
  IconEdit,
  IconFlagCheck,
  IconPlayerPlay,
} from '@tabler/icons-react';

import { estadoBadge } from '@domain/estados';
import { formatFechaHora } from '@domain/format';
import { useAuthStore } from '@stores/auth.store';

import { puedeCancelar, puedeEditar, puedeFinalizar, puedeIniciar } from '../acciones';

const InfoItem = ({ label, value }) => (
  <Box>
    <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
      {label}
    </Text>
    <Text size="sm" fw={500}>
      {value || '—'}
    </Text>
  </Box>
);

const choferLabel = (chofer) =>
  [chofer?.nombre, chofer?.apellido].filter(Boolean).join(' ') || chofer?.username || '—';

const PlaceholderButton = ({ show, disabled, color, icon, label, onClick }) => {
  if (!show) return null;
  return (
    <Tooltip label="Próximamente (SHG-FE-012)" disabled={!disabled} withArrow>
      <Button variant="light" color={color} leftSection={icon} disabled={disabled} onClick={onClick}>
        {label}
      </Button>
    </Tooltip>
  );
};

const DetalleViajeHeader = ({ viaje, id, onVolver, onEditar, onAccionPendiente }) => {
  const user = useAuthStore((state) => state.user);
  const estadoInfo = estadoBadge('viaje', viaje.estado);
  const choferes = viaje.choferes?.length ? viaje.choferes : viaje.chofer ? [viaje.chofer] : [];

  return (
    <Stack gap="md">
      <Group justify="space-between" align="flex-start">
        <Box>
          <Group gap="xs" mb={4}>
            <Title order={2}>Viaje #{id}</Title>
            <Badge color={estadoInfo.color} variant="light">
              {estadoInfo.label}
            </Badge>
          </Group>
          <Text size="sm" c="dimmed">
            Sucursal: {viaje.sucursal?.nombre ?? '—'}
          </Text>
        </Box>

        <Group>
          {/* Editar ya está implementado (EditarViaje): navegación real, no es
              una transición de estado bloqueada por SHG-FE-012. */}
          {puedeEditar(user, viaje.estado) && (
            <Button leftSection={<IconEdit size={18} />} onClick={onEditar}>
              Editar
            </Button>
          )}

          <PlaceholderButton
            show={puedeIniciar(user, viaje.estado)}
            disabled
            color="blue"
            icon={<IconPlayerPlay size={18} />}
            label="Iniciar"
            onClick={onAccionPendiente}
          />
          <PlaceholderButton
            show={puedeFinalizar(user, viaje.estado)}
            disabled
            color="green"
            icon={<IconFlagCheck size={18} />}
            label="Finalizar"
            onClick={onAccionPendiente}
          />
          <PlaceholderButton
            show={puedeCancelar(user, viaje.estado)}
            disabled
            color="red"
            icon={<IconBan size={18} />}
            label="Cancelar"
            onClick={onAccionPendiente}
          />

          <Button variant="subtle" leftSection={<IconArrowLeft size={18} />} onClick={onVolver}>
            Volver
          </Button>
        </Group>
      </Group>

      <Divider />

      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }}>
        <InfoItem label="Salida planificada" value={formatFechaHora(viaje.fechaHoraInicioPlanificada)} />
        <InfoItem label="Salida real" value={formatFechaHora(viaje.fechaHoraInicio)} />
        <InfoItem label="Llegada planificada" value={formatFechaHora(viaje.fechaHoraFinPlanificada)} />
        <InfoItem label="Llegada real" value={formatFechaHora(viaje.fechaHoraFin)} />
        <InfoItem
          label="Vehículo"
          value={[viaje.vehiculo?.patente, viaje.vehiculo?.modelo?.nombre].filter(Boolean).join(' - ')}
        />
        <InfoItem label="Chofer(es)" value={choferes.map(choferLabel).join(', ')} />
        <InfoItem label="Responsable" value={choferLabel(viaje.responsable)} />
        <InfoItem label="Sucursal" value={viaje.sucursal?.nombre} />
      </SimpleGrid>
    </Stack>
  );
};

export default DetalleViajeHeader;
