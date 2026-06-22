import { useState } from 'react';
import { Badge, Checkbox, Drawer, Stack, Table, Text, Title } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconBuildingOff, IconEdit, IconEye } from '@tabler/icons-react';

import { RowActionsMenu } from '@components';

const ESTADO_COLORS = { activa: 'green', inactiva: 'gray' };

const ListaSucursalesTabla = ({ items = [], selectedIds, onToggle, onToggleAll }) => {
  const [selected, setSelected] = useState(null);
  const [drawerOpened, { open, close }] = useDisclosure(false);

  const handleViewDetails = (sucursal) => {
    setSelected(sucursal);
    open();
  };

  const getActions = (row) => [
    { icon: <IconEye size={18} />, label: 'Ver detalles', onClick: () => handleViewDetails(row) },
    { icon: <IconEdit size={18} />, label: 'Editar' },
    {
      icon: <IconBuildingOff size={18} />,
      label: 'Desactivar',
      color: 'red',
      dividerBefore: true,
      disabled: row.estado === 'inactiva',
    },
  ];

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const indeterminate = !allSelected && items.some((i) => selectedIds.has(i.id));

  return (
    <>
      <Drawer
        opened={drawerOpened}
        onClose={close}
        position="right"
        title={selected && <Title order={5}>{selected.nombre}</Title>}
      >
        {selected && (
          <Stack gap="md">
            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Dirección completa</Text>
              <Text size="sm">{selected.direccion}</Text>
              <Text size="sm" c="dimmed">{`${selected.barrio}, ${selected.localidad}, ${selected.provincia} (CP ${selected.cp})`}</Text>
            </Stack>

            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Teléfono sucursal</Text>
              <Text size="sm">{selected.telefono}</Text>
            </Stack>

            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Horarios</Text>
              <Text size="sm">{selected.horarios}</Text>
            </Stack>

            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Responsable</Text>
              <Text size="sm" fw={500}>{selected.responsable.nombre}</Text>
              <Text size="sm" c="dimmed">{selected.responsable.email}</Text>
              <Text size="sm" c="dimmed">{selected.responsable.telefono}</Text>
            </Stack>

            <Stack gap={4}>
              <Text size="xs" c="dimmed" tt="uppercase" fw={600}>Estado</Text>
              <Badge color={ESTADO_COLORS[selected.estado] ?? 'gray'} variant="dot" w="fit-content">
                {selected.estado}
              </Badge>
            </Stack>
          </Stack>
        )}
      </Drawer>

      <Table stickyHeader highlightOnHover verticalSpacing="xs" horizontalSpacing="xs">
        <Table.Thead>
          <Table.Tr>
            <Table.Th w={40}>
              <Checkbox checked={allSelected} indeterminate={indeterminate} onChange={onToggleAll} />
            </Table.Th>
            <Table.Th>Nombre</Table.Th>
            <Table.Th>Ubicación</Table.Th>
            <Table.Th>Teléfono</Table.Th>
            <Table.Th>Responsable</Table.Th>
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
                <Text size="sm" fw={500}>{row.nombre}</Text>
              </Table.Td>

              <Table.Td>
                <Stack gap={0}>
                  <Text size="sm">{row.localidad}</Text>
                  <Text size="xs" fw={600} c="dimmed">{row.provincia}</Text>
                </Stack>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{row.telefono}</Text>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{row.responsable.nombre}</Text>
              </Table.Td>

              <Table.Td>
                <Badge color={ESTADO_COLORS[row.estado] ?? 'gray'} variant="dot" radius="md">
                  {row.estado}
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

export default ListaSucursalesTabla;
