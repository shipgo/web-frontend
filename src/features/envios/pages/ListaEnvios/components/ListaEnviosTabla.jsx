import { useLocation } from 'wouter';
import { Avatar, Badge, Checkbox, Group, Stack, Table, Text } from '@mantine/core';
import {
  IconEdit,
  IconFileDescription,
  IconMapSearch,
  IconMessageReport,
  IconTrash,
} from '@tabler/icons-react';

import { timeFromNow, toLocalDate } from '@utils/dates';
import { RowActionsMenu } from '@components';

const getActionsForRow = (estado, { onEditar, onVerDetalles }) => {
  const disabledByState = {
    completado: ['Reportar', 'Editar', 'Eliminar', 'Localizar'],
    en_camino: ['Editar', 'Eliminar'],
    cancelado: ['Reportar', 'Editar', 'Eliminar', 'Localizar'],
  };

  const actions = [
    {
      name: 'Detalles',
      items: [
        { icon: <IconMapSearch size={18} />, label: 'Localizar' },
        { icon: <IconFileDescription size={18} />, label: 'Ver detalles', onClick: onVerDetalles },
      ],
    },
    {
      name: 'Opciones',
      items: [
        { icon: <IconMessageReport size={18} />, label: 'Reportar', color: 'orange' },
        { icon: <IconEdit size={18} />, label: 'Editar', color: 'blue', onClick: onEditar },
        { icon: <IconTrash size={18} />, label: 'Eliminar', color: 'red' },
      ],
    },
  ];

  return actions.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      disabled: disabledByState[estado]?.includes(item.label),
    })),
  }));
};

const STATUS_COLORS = {
  'en camino': 'blue',
  completado: 'green',
  pendiente: 'orange',
  cancelado: 'red',
};

const ListaEnviosTabla = ({ items = [], selectedIds, onToggle, onToggleAll }) => {
  const [, navigate] = useLocation();
  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const indeterminate = !allSelected && items.some((i) => selectedIds.has(i.id));

  return (
    <Table stickyHeader highlightOnHover verticalSpacing="xs" horizontalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={40}>
            <Checkbox
              checked={allSelected}
              indeterminate={indeterminate}
              onChange={onToggleAll}
            />
          </Table.Th>
          <Table.Th>Código</Table.Th>
          <Table.Th>Fecha de registro</Table.Th>
          <Table.Th>Estado</Table.Th>
          <Table.Th>Destino</Table.Th>
          <Table.Th>Chofer asignado</Table.Th>
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {items.map(({ id, codigo_envio, direccion, localidad, provincia, estado, fecha_registro, chofer_asignado }) => (
          <Table.Tr key={id} bg={selectedIds.has(id) ? 'var(--mantine-color-blue-light)' : undefined}>
            <Table.Td>
              <Checkbox checked={selectedIds.has(id)} onChange={() => onToggle(id)} />
            </Table.Td>

            <Table.Td>
              <Text size="sm" ff="monospace">{codigo_envio}</Text>
            </Table.Td>

            <Table.Td>
              <Stack gap="0">
                <Text size="sm">{toLocalDate(fecha_registro)}</Text>
                <Text size="xs" fw="bold">{timeFromNow(fecha_registro)}</Text>
              </Stack>
            </Table.Td>

            <Table.Td>
              <Badge color={STATUS_COLORS[estado] ?? 'gray'} variant="light" radius="md">
                {estado}
              </Badge>
            </Table.Td>

            <Table.Td>
              <Stack gap={0}>
                <Text size="sm">{direccion}</Text>
                <Text size="xs" fw={600}>{`${localidad}, ${provincia}`}</Text>
              </Stack>
            </Table.Td>

            <Table.Td>
              {chofer_asignado ? (
                <Group gap="0.5rem">
                  <Avatar src={chofer_asignado.perfil} size="sm" />
                  <Stack gap={0}>
                    <Text size="sm">{chofer_asignado.nombre}</Text>
                    <Text size="xs" fw={600}>{chofer_asignado.vehiculo_asignado}</Text>
                  </Stack>
                </Group>
              ) : (
                <Text c="dimmed" size="sm">Sin asignar</Text>
              )}
            </Table.Td>

            <Table.Td>
              <RowActionsMenu
                actions={getActionsForRow(estado, {
                  onVerDetalles: () => navigate(`~/envios/${id}`),
                  onEditar: () => navigate(`~/envios/editar/${id}`),
                })}
                width={160}
              />
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};

export default ListaEnviosTabla;
