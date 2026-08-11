import { Avatar, Badge, Checkbox, Group, Stack, Table, Text, Tooltip } from '@mantine/core';
import {
  IconAlertTriangle,
  IconEdit,
  IconMapSearch,
  IconMessageReport,
  IconRoute,
  IconTrash,
  IconUserX,
} from '@tabler/icons-react';
import dayjs from 'dayjs';

import { timeFromNow, toLocalDate } from '@utils/dates';
import { RowActionsMenu } from '@components';

const getActionsForRow = (estado) => {
  const normalizedEstado = estado?.toUpperCase();
  const actions = {
    PLANIFICADO: [
      { icon: <IconRoute size={18} />, label: 'Ver hoja de ruta' },
      { icon: <IconEdit size={18} />, label: 'Editar viaje' },
      { icon: <IconTrash size={18} />, label: 'Cancelar viaje', color: 'red', dividerBefore: true },
    ],
    ASIGNADO: [
      { icon: <IconRoute size={18} />, label: 'Ver hoja de ruta' },
      { icon: <IconEdit size={18} />, label: 'Editar viaje' },
      { icon: <IconUserX size={18} />, label: 'Desvincular chofer' },
      { icon: <IconTrash size={18} />, label: 'Cancelar viaje', color: 'red', dividerBefore: true },
    ],
    'EN CURSO': [
      { icon: <IconMapSearch size={18} />, label: 'Monitorear' },
      { icon: <IconMessageReport size={18} />, label: 'Reportar incidente' },
    ],
    FINALIZADO: [{ icon: <IconRoute size={18} />, label: 'Ver hoja de ruta' }],
    INTERRUMPIDO: [{ icon: <IconRoute size={18} />, label: 'Ver hoja de ruta' }],
  };
  return actions[normalizedEstado] ?? [];
};

const STATUS_COLORS = {
  'EN CURSO': 'blue',
  FINALIZADO: 'green',
  PLANIFICADO: 'orange',
  INTERRUMPIDO: 'red',
  ASIGNADO: 'yellow',
};

const showWarning = (item, fecha) =>
  ['PLANIFICADO', 'ASIGNADO'].includes(item.estado?.toUpperCase()) &&
  fecha &&
  dayjs(fecha).isBefore(dayjs());

const ListaViajesTabla = ({ items = [], selectedIds, onToggle, onToggleAll }) => {
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const indeterminate = !allSelected && items.some((i) => selectedIds.has(i.id));

  return (
    <Table stickyHeader highlightOnHover verticalSpacing="xs" horizontalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={40}>
            <Checkbox checked={allSelected} indeterminate={indeterminate} onChange={onToggleAll} />
          </Table.Th>
          <Table.Th>ID Viaje</Table.Th>
          <Table.Th>Fecha programada</Table.Th>
          <Table.Th>Estado</Table.Th>
          <Table.Th>Recursos</Table.Th>
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {items.map((item) => {
          const chofer = item.chofer;
          const vehiculo = item.vehiculo;
          const fecha = item.fechaHoraInicioPlanificada || item.fechaHoraInicio;

          return (
            <Table.Tr key={item.id} bg={selectedIds.has(item.id) ? 'var(--mantine-color-blue-light)' : undefined}>
              <Table.Td>
                <Checkbox checked={selectedIds.has(item.id)} onChange={() => onToggle(item.id)} />
              </Table.Td>

              <Table.Td>{item.id}</Table.Td>

              <Table.Td>
                <Group>
                  <Stack gap="0">
                    <Text size="sm">{toLocalDate(fecha)}</Text>
                    <Text size="xs" fw="bold">{timeFromNow(fecha)}</Text>
                  </Stack>
                  {showWarning(item, fecha) && (
                    <Tooltip withArrow label="Viaje retrasado">
                      <IconAlertTriangle size={20} color="orange" />
                    </Tooltip>
                  )}
                </Group>
              </Table.Td>

              <Table.Td>
                <Badge color={STATUS_COLORS[item.estado?.toUpperCase()] ?? 'gray'} variant="light" radius="md">
                  {item.estado || 'Sin estado'}
                </Badge>
              </Table.Td>

              <Table.Td>
                {chofer ? (
                  <Group gap="0.5rem">
                    <Avatar name={chofer.nombre || chofer.username} color="initials" size="sm" />
                    <Stack gap={0}>
                      <Text size="sm">
                        {chofer.nombre && chofer.apellido
                          ? `${chofer.nombre} ${chofer.apellido}`
                          : chofer.nombre || chofer.username || 'Sin nombre'}
                      </Text>
                      {vehiculo && (
                        <Text size="xs" fw={600}>{vehiculo.patente || 'Sin vehículo'}</Text>
                      )}
                    </Stack>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">Sin chofer asignado</Text>
                )}
              </Table.Td>

              <Table.Td>
                <RowActionsMenu actions={getActionsForRow(item.estado)} />
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
};

export default ListaViajesTabla;
