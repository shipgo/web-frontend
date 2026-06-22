import { Badge, Checkbox, Group, Stack, Table, Text, Tooltip } from '@mantine/core';
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
import ProgressBar from '@components/ProgressBar';
import { RowActionsMenu } from '@components';

const getActionsForRow = (status) => {
  const actions = {
    planificado: [
      { icon: <IconRoute size={18} />, label: 'Ver hoja de ruta' },
      { icon: <IconEdit size={18} />, label: 'Editar viaje' },
      { icon: <IconTrash size={18} />, label: 'Cancelar viaje', color: 'red', dividerBefore: true },
    ],
    asignado: [
      { icon: <IconRoute size={18} />, label: 'Ver hoja de ruta' },
      { icon: <IconEdit size={18} />, label: 'Editar viaje' },
      { icon: <IconUserX size={18} />, label: 'Desvincular chofer' },
      { icon: <IconTrash size={18} />, label: 'Cancelar viaje', color: 'red', dividerBefore: true },
    ],
    'en curso': [
      { icon: <IconMapSearch size={18} />, label: 'Monitorear' },
      { icon: <IconMessageReport size={18} />, label: 'Reportar incidente' },
    ],
    finalizado: [{ icon: <IconRoute size={18} />, label: 'Ver hoja de ruta' }],
    interrumpido: [{ icon: <IconRoute size={18} />, label: 'Ver hoja de ruta' }],
  };
  return actions[status.toLowerCase()] ?? [];
};

const STATUS_COLORS = {
  'en curso': 'blue',
  finalizado: 'green',
  planificado: 'orange',
  interrumpido: 'red',
  asignado: 'yellow',
};

const showWarning = (item) =>
  ['planificado', 'asignado'].includes(item.estado.toLowerCase()) &&
  dayjs(item.fecha).isBefore(dayjs());

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
          <Table.Th>Carga</Table.Th>
          <Table.Th>Progreso</Table.Th>
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {items.map((item) => (
          <Table.Tr key={item.id} bg={selectedIds.has(item.id) ? 'var(--mantine-color-blue-light)' : undefined}>
            <Table.Td>
              <Checkbox checked={selectedIds.has(item.id)} onChange={() => onToggle(item.id)} />
            </Table.Td>

            <Table.Td>{item.id}</Table.Td>

            <Table.Td>
              <Group>
                <Stack gap="0">
                  <Text size="sm">{toLocalDate(item.fecha)}</Text>
                  <Text size="xs" fw="bold">{timeFromNow(item.fecha)}</Text>
                </Stack>
                {showWarning(item) && (
                  <Tooltip withArrow label="Viaje retrasado">
                    <IconAlertTriangle size={20} color="orange" />
                  </Tooltip>
                )}
              </Group>
            </Table.Td>

            <Table.Td>
              <Badge color={STATUS_COLORS[item.estado.toLowerCase()] ?? 'gray'} variant="light" radius="md">
                {item.estado}
              </Badge>
            </Table.Td>

            <Table.Td>
              <Stack gap={0}>
                <Text size="sm">{item.vehiculo.patente}</Text>
                <Text size="xs" fw={600}>{item.chofer.nombre}</Text>
              </Stack>
            </Table.Td>

            <Table.Td>
              <Stack gap={0}>
                <Text size="sm">{item.carga.peso} kg</Text>
                <Text size="xs" fw={600}>{item.carga.envios} envíos ({item.carga.bultos} bultos)</Text>
              </Stack>
            </Table.Td>

            <Table.Td>
              <Stack gap="0.25rem">
                <Text size="sm">{item.paquetes_entregados} / {item.carga.envios} entregas</Text>
                <ProgressBar usedValue={item.paquetes_entregados} maxValue={item.carga.envios} />
              </Stack>
            </Table.Td>

            <Table.Td>
              <RowActionsMenu actions={getActionsForRow(item.estado)} />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};

export default ListaViajesTabla;
