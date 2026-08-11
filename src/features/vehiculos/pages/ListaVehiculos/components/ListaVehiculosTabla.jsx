import { Avatar, Badge, Checkbox, Group, Stack, Table, Text } from '@mantine/core';
import { IconEdit, IconHistory, IconTools } from '@tabler/icons-react';

import { RowActionsMenu } from '@components';

const ESTADO_COLORS = { disponible: 'green', en_ruta: 'blue', en_mantenimiento: 'orange' };
const ESTADO_LABELS = { disponible: 'Disponible', en_ruta: 'En ruta', en_mantenimiento: 'En mantenimiento' };
const TIPO_LABELS = { moto: 'Moto', auto: 'Auto', camioneta: 'Camioneta', camion: 'Camión' };

const getActionsForRow = (estado) => [
  { icon: <IconEdit size={18} />, label: 'Editar' },
  { icon: <IconHistory size={18} />, label: 'Ver historial' },
  {
    icon: <IconTools size={18} />,
    label: 'Enviar a mantenimiento',
    color: 'orange',
    dividerBefore: true,
    disabled: estado === 'en_mantenimiento',
  },
];

const ListaVehiculosTabla = ({ items = [], selectedIds, onToggle, onToggleAll }) => {
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const indeterminate = !allSelected && items.some((i) => selectedIds.has(i.id));

  return (
    <Table stickyHeader highlightOnHover verticalSpacing="xs" horizontalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={40}>
            <Checkbox checked={allSelected} indeterminate={indeterminate} onChange={onToggleAll} />
          </Table.Th>
          <Table.Th>Patente</Table.Th>
          <Table.Th>Vehículo</Table.Th>
          <Table.Th>Capacidad</Table.Th>
          <Table.Th>Chofer asignado</Table.Th>
          <Table.Th>Estado</Table.Th>
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {items.map(({ id, patente, marca, modelo, tipo, capacidad, estado, chofer_asignado }) => (
          <Table.Tr key={id} bg={selectedIds.has(id) ? 'var(--mantine-color-blue-light)' : undefined}>
            <Table.Td>
              <Checkbox checked={selectedIds.has(id)} onChange={() => onToggle(id)} />
            </Table.Td>

            <Table.Td>
              <Text size="sm" fw={600} ff="monospace">{patente}</Text>
            </Table.Td>

            <Table.Td>
              <Stack gap={0}>
                <Text size="sm">{`${marca} ${modelo}`}</Text>
                <Text size="xs" fw={600} c="dimmed">{TIPO_LABELS[tipo] ?? tipo}</Text>
              </Stack>
            </Table.Td>

            <Table.Td>
              <Text size="sm">{capacidad.toLocaleString('es-AR')} kg</Text>
            </Table.Td>

            <Table.Td>
              {chofer_asignado ? (
                <Group gap="xs">
                  <Avatar src={chofer_asignado.perfil} size="sm" />
                  <Text size="sm">{chofer_asignado.nombre}</Text>
                </Group>
              ) : (
                <Text size="sm" c="dimmed">Sin asignar</Text>
              )}
            </Table.Td>

            <Table.Td>
              <Badge color={ESTADO_COLORS[estado] ?? 'gray'} variant="light" radius="md">
                {ESTADO_LABELS[estado] ?? estado}
              </Badge>
            </Table.Td>

            <Table.Td>
              <RowActionsMenu actions={getActionsForRow(estado)} />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};

export default ListaVehiculosTabla;
