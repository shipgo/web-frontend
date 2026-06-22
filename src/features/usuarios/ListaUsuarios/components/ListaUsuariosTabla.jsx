import { useState } from 'react';
import {
  Avatar, Badge, Button, Checkbox, Divider, Drawer, Group,
  Pill, Stack, Table, Text, Title,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconEdit, IconEye, IconKey, IconMail, IconUserOff } from '@tabler/icons-react';

import { toLocalDate } from '@utils/dates';
import { GridData, RowActionsMenu } from '@components';
import ScreenContainer from '@components/ScreenContainer';

const ROL_LABELS = { admin: 'Administrador', operador: 'Operador', chofer: 'Chofer' };
const ESTADO_COLORS = { activo: 'green', inactivo: 'orange' };
const ESTADO_LABELS = { activo: 'Activo', inactivo: 'Dado de baja' };

const ListaUsuariosTabla = ({ items = [], selectedIds, onToggle, onToggleAll }) => {
  const [selected, setSelected] = useState(null);
  const [drawerOpened, { open, close }] = useDisclosure(false);

  const handleViewDetails = (usuario) => {
    setSelected(usuario);
    open();
  };

  const getActions = (row) => [
    { icon: <IconEye size={18} />, label: 'Ver detalles', onClick: () => handleViewDetails(row) },
    { icon: <IconEdit size={18} />, label: 'Editar' },
    { icon: <IconKey size={18} />, label: 'Resetear contraseña', color: 'orange', dividerBefore: true },
    { icon: <IconUserOff size={18} />, label: 'Desactivar', color: 'red', disabled: row.estado === 'inactivo' },
  ];

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const indeterminate = !allSelected && items.some((i) => selectedIds.has(i.id));

  return (
    <>
      <Drawer
        opened={drawerOpened}
        onClose={close}
        position="right"
        styles={{ body: { padding: 'var(--mantine-spacing-xl)' } }}
      >
        {selected && (
          <Stack gap="md">
            <Stack align="center" gap="xs">
              <Avatar name={selected.nombre} color="initials" size={80} />
              <Title order={4} ta="center">{selected.nombre}</Title>
              <Pill>{ROL_LABELS[selected.rol] ?? selected.rol}</Pill>
            </Stack>

            <Group grow>
              <Button leftSection={<IconMail size={16} />} variant="filled">Mensaje</Button>
              <Button leftSection={<IconEdit size={16} />} variant="outline">Editar</Button>
            </Group>

            <Divider label="INFORMACIÓN DE LA CUENTA" labelPosition="center" />

            <GridData
              columnsCount={2}
              items={[
                { label: 'Teléfono', value: selected.telefono },
                { label: 'Email', value: selected.email },
                { label: 'Fecha de alta', value: toLocalDate(selected.fecha_alta) },
              ]}
            />

            {selected.rol === 'chofer' && (
              <>
                <Divider label="ACTIVIDAD RECIENTE" labelPosition="center" />
                <ScreenContainer
                  onEmptyData={{ show: true, title: 'Nada por acá' }}
                  styleProps={{ mih: '8rem' }}
                />
              </>
            )}
          </Stack>
        )}
      </Drawer>

      <Table stickyHeader highlightOnHover verticalSpacing="xs" horizontalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox checked={allSelected} indeterminate={indeterminate} onChange={onToggleAll} />
            </Table.Th>
            <Table.Th>Usuario</Table.Th>
            <Table.Th>Teléfono</Table.Th>
            <Table.Th>Rol</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>

        <Table.Tbody>
          {items.map((row) => (
            <Table.Tr key={row.id} bg={selectedIds.has(row.id) ? 'var(--mantine-color-blue-light)' : undefined}>
              <Table.Td>
                <Checkbox checked={selectedIds.has(row.id)} onChange={() => onToggle(row.id)} />
              </Table.Td>

              <Table.Td>
                <Group gap="xs">
                  <Avatar name={row.nombre} color="initials" size="sm" />
                  <Text size="sm">{row.nombre}</Text>
                </Group>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{row.telefono}</Text>
              </Table.Td>

              <Table.Td>
                <Pill>{ROL_LABELS[row.rol] ?? row.rol}</Pill>
              </Table.Td>

              <Table.Td>
                <Badge color={ESTADO_COLORS[row.estado] ?? 'gray'} variant="light" radius="md">
                  {ESTADO_LABELS[row.estado] ?? row.estado}
                </Badge>
              </Table.Td>

              <Table.Td>
                <RowActionsMenu actions={getActions(row)} />
              </Table.Td>
            </Table.Tr>
          ))}
        </Table.Tbody>
      </Table>
    </>
  );
};

export default ListaUsuariosTabla;
