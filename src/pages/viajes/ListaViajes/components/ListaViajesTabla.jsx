import { Fragment } from "react";
import { ActionIcon, Avatar, Badge, Group, Menu, Stack, Table, Text } from "@mantine/core"

import { timeFromNow, toLocalDate } from "@utils/dates";
import { IconMapSearch, IconFileDescription, IconMessageReport, IconEdit, IconTrash, IconDotsVertical } from "@tabler/icons-react";

const ACTIONS = [
  {
    name: 'Detalles', items: [
      { icon: <IconMapSearch size={18} />, label: 'Localizar' },
      { icon: <IconFileDescription size={18} />, label: 'Ver detalles' },
    ]
  },
  {
    name: 'Opciones', items: [
      { icon: <IconMessageReport size={18} />, label: 'Reportar', color: 'orange' },
      { icon: <IconEdit size={18} />, label: 'Editar', color: 'blue' },
      { icon: <IconTrash size={18} />, label: 'Eliminar', color: 'red' },
    ]
  },
];

const COLUMNS = ['ID', 'Fecha de registro', 'Estado', 'Chofer', 'Acciones']
const items = [
  { id: 1, fecha: '2025-05-29T10:00:00Z', estado: 'en camino' },
  { id: 2, fecha: '2025-05-20T03:00:00Z', estado: 'completado' },
  { id: 3, fecha: '2025-05-29T14:00:00Z', estado: 'pendiente' },
]

const getColor = estado => {
  const posibleColors = {
    "en camino": "blue",
    "completado": "green",
    "pendiente": "yellow",
    "cancelado": "red",
  };
  return posibleColors[estado];
};

const shouldDisableAction = (estado, label) => {
  const disableActions = {
    "completado": ["Reportar", "Editar", "Eliminar", "Localizar"],
    "en camino": ["Editar", "Eliminar"],
    "pendiente": ["Localizar", "Reportar"],
    "cancelado": ["Reportar", "Editar", "Eliminar", "Localizar"],
  };
  return disableActions[estado]?.includes(label) ?? true;
};

const ListaViajesTabla = () => {

  return (
    <Table
      stickyHeader
      highlightOnHover
      verticalSpacing='xs'
      horizontalSpacing="xs"
    >
      <Table.Thead>
        <Table.Tr>
          {COLUMNS.map((column) => (
            <Table.Th key={column}>{column}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((item) => (
          <Table.Tr key={item.id}>
            <Table.Td>{item.id}</Table.Td>

            <Table.Td>
            <Stack gap="0">
              <Text size="sm">{toLocalDate(item.fecha)}</Text>
              <Text size="xs" fw="bold">{timeFromNow(item.fecha)}</Text>
            </Stack>
            </Table.Td>
            
            <Table.Td>
              <Badge color={getColor(item.estado)} variant="light" radius="md">
                {item.estado}
              </Badge>
            </Table.Td>

            <Table.Td>
              {item.choferAsignado ? (
                <Group gap="0.5rem">
                  <Avatar src={item.choferAsignado.perfil} />
                  <Stack gap={0}>
                    <Text size="sm">{item.choferAsignado.nombre}</Text>
                    <Text size="xs" fw={600}>{item.choferAsignado.vehiculo_asignado}</Text>
                  </Stack>
                </Group>
              ) : "-"}
            </Table.Td>

            <Table.Td>
            <Menu shadow="md" width={150}>
              <Menu.Target>
                <ActionIcon variant="subtle" size="input-sm">
                  <IconDotsVertical size={18} />
                </ActionIcon>
              </Menu.Target>

              <Menu.Dropdown>
                {ACTIONS.map(({ name, items }, index) => (
                  <Fragment key={name}>
                    <Menu.Label> {name} </Menu.Label>
                    {items.map(({ icon, label, color }) => (
                      <Menu.Item
                        key={label}
                        color={color}
                        leftSection={icon}
                        disabled={shouldDisableAction(item.estado, label)}
                      >
                        {label}
                      </Menu.Item>
                    ))}
                    {index === 0 && <Menu.Divider />}
                  </Fragment>
                ))}
              </Menu.Dropdown>
            </Menu>
            </Table.Td>

          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  )
}

export default ListaViajesTabla