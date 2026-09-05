import { useLocation } from 'wouter';
import { Avatar, Badge, Checkbox, Group, Stack, Table, Text } from '@mantine/core';
import {
  IconEdit,
  IconFileDescription,
  IconMapSearch,
  IconTrash,
} from '@tabler/icons-react';

import { timeFromNow, toLocalDate } from '@utils/dates';
import { RowActionsMenu } from '@components';
import { esEstadoTerminal, estadoBadge } from '@domain/estados';

import { useDeleteEnvio } from '../hooks/useDeleteEnvio';

/** Fecha de alta = `historialEstado` con `estado === 'creado'` (CONTRACTS.md §4 / SHG-BE-004). */
const getFechaAlta = (envio) =>
  (envio.historialEstado ?? []).find((h) => h.estado === 'creado')?.fechaHoraInicio ?? null;

const getActionsForRow = (envio, { onEditar, onVerDetalles, onEliminar }) => {
  const terminal = esEstadoTerminal('envio', envio.estado);

  return [
    {
      name: 'Detalles',
      items: [
        { icon: <IconMapSearch size={18} />, label: 'Localizar', disabled: true },
        { icon: <IconFileDescription size={18} />, label: 'Ver detalles', onClick: onVerDetalles },
      ],
    },
    {
      name: 'Opciones',
      items: [
        { icon: <IconEdit size={18} />, label: 'Editar', color: 'blue', disabled: terminal, onClick: onEditar },
        { icon: <IconTrash size={18} />, label: 'Eliminar', color: 'red', onClick: onEliminar },
      ],
    },
  ];
};

const ListaEnviosTabla = ({ items = [], selectedIds, onToggle, onToggleAll, onRefresh }) => {
  const [, navigate] = useLocation();
  const { confirmDelete } = useDeleteEnvio(onRefresh);

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
          <Table.Th>Remitente</Table.Th>
          <Table.Th>Destino</Table.Th>
          <Table.Th>Fecha de alta</Table.Th>
          <Table.Th>Estado</Table.Th>
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {items.map((envio) => {
          const { id, codigoSeguimiento, nombre, apellido, estado } = envio;
          const destino = envio.destino ?? {};
          const localidad = destino.localidad ?? {};
          const provincia = localidad.provincia ?? {};
          const direccion = [destino.nombreCalle, destino.numeroCalle].filter(Boolean).join(' ');
          const fechaAlta = getFechaAlta(envio);
          const estadoInfo = estadoBadge('envio', estado);

          return (
            <Table.Tr key={id} bg={selectedIds.has(id) ? 'var(--mantine-color-blue-light)' : undefined}>
              <Table.Td>
                <Checkbox checked={selectedIds.has(id)} onChange={() => onToggle(id)} />
              </Table.Td>

              <Table.Td>
                <Text size="sm" ff="monospace">{codigoSeguimiento}</Text>
              </Table.Td>

              <Table.Td>
                <Group gap="0.5rem">
                  <Avatar radius="xl" size="sm" />
                  <Text size="sm">{`${nombre ?? ''} ${apellido ?? ''}`.trim() || '-'}</Text>
                </Group>
              </Table.Td>

              <Table.Td>
                <Stack gap={0}>
                  <Text size="sm">{direccion || '-'}</Text>
                  <Text size="xs" fw={600}>
                    {[localidad.nombre, provincia.nombre].filter(Boolean).join(', ') || '-'}
                  </Text>
                </Stack>
              </Table.Td>

              <Table.Td>
                {fechaAlta ? (
                  <Stack gap="0">
                    <Text size="sm">{toLocalDate(fechaAlta)}</Text>
                    <Text size="xs" fw="bold">{timeFromNow(fechaAlta)}</Text>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">-</Text>
                )}
              </Table.Td>

              <Table.Td>
                <Badge color={estadoInfo.color} variant="light" radius="md">
                  {estadoInfo.label}
                </Badge>
              </Table.Td>

              <Table.Td>
                <RowActionsMenu
                  actions={getActionsForRow(envio, {
                    onVerDetalles: () => navigate(`~/envios/${id}`),
                    onEditar: () => navigate(`~/envios/editar/${id}`),
                    onEliminar: () => confirmDelete(envio),
                  })}
                  width={160}
                />
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
  );
};

export default ListaEnviosTabla;
