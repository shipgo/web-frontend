import { Fragment } from "react";
import {
  ActionIcon,
  Avatar,
  Badge,
  Group,
  Menu,
  Stack,
  Table,
  Text,
} from "@mantine/core";

import { timeFromNow, toLocalDate } from "@utils/dates";
import {
  IconMapSearch,
  IconFileDescription,
  IconMessageReport,
  IconEdit,
  IconTrash,
  IconDotsVertical,
} from "@tabler/icons-react";

const ACTIONS = [
  {
    name: "Detalles",
    items: [
      { icon: <IconMapSearch size={18} />, label: "Localizar" },
      { icon: <IconFileDescription size={18} />, label: "Ver detalles" },
    ],
  },
  {
    name: "Opciones",
    items: [
      {
        icon: <IconMessageReport size={18} />,
        label: "Reportar",
        color: "orange",
      },
      { icon: <IconEdit size={18} />, label: "Editar", color: "blue" },
      { icon: <IconTrash size={18} />, label: "Eliminar", color: "red" },
    ],
  },
];

const COLUMNS = ["ID", "Fecha de registro", "Estado", "Chofer", "Acciones"];

const getColor = (estado) => {
  const posibleColors = {
    "EN_CAMINO": "blue",
    "EN CAMINO": "blue",
    "COMPLETADO": "green",
    "PENDIENTE": "yellow",
    "CANCELADO": "red",
  };
  return posibleColors[estado?.toUpperCase()] || "gray";
};

const shouldDisableAction = (estado, label) => {
  const normalizedEstado = estado?.toUpperCase();
  const disableActions = {
    COMPLETADO: ["Reportar", "Editar", "Eliminar", "Localizar"],
    "EN_CAMINO": ["Editar", "Eliminar"],
    "EN CAMINO": ["Editar", "Eliminar"],
    PENDIENTE: ["Localizar", "Reportar"],
    CANCELADO: ["Reportar", "Editar", "Eliminar", "Localizar"],
  };
  return disableActions[normalizedEstado]?.includes(label) ?? true;
};

const ListaViajesTabla = ({ items = [] }) => {
  if (items.length === 0) {
    return (
      <Table>
        <Table.Thead>
          <Table.Tr>
            {COLUMNS.map((column) => (
              <Table.Th key={column}>{column}</Table.Th>
            ))}
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td colSpan={COLUMNS.length} style={{ textAlign: "center" }}>
              No hay viajes para mostrar
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );
  }

  return (
    <Table
      stickyHeader
      highlightOnHover
      verticalSpacing="xs"
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
        {items.map((item) => {
          // Extraer datos del chofer desde el objeto viaje
          const chofer = item.usuario || item.chofer || item.choferAsignado;
          const vehiculo = item.vehiculo;

          return (
            <Table.Tr key={item.id}>
              <Table.Td>{item.id}</Table.Td>

              <Table.Td>
                <Stack gap="0">
                  <Text size="sm">
                    {toLocalDate(item.fechaInicio || item.fecha || item.fechaCreacion)}
                  </Text>
                  <Text size="xs" fw="bold">
                    {timeFromNow(item.fechaInicio || item.fecha || item.fechaCreacion)}
                  </Text>
                </Stack>
              </Table.Td>

              <Table.Td>
                <Badge color={getColor(item.estado)} variant="light" radius="md">
                  {item.estado || "Sin estado"}
                </Badge>
              </Table.Td>

              <Table.Td>
                {chofer ? (
                  <Group gap="0.5rem">
                    <Avatar 
                      src={chofer.profile || chofer.perfil} 
                      name={chofer.nombre || chofer.username}
                    />
                    <Stack gap={0}>
                      <Text size="sm">
                        {chofer.nombre && chofer.apellido
                          ? `${chofer.nombre} ${chofer.apellido}`
                          : chofer.nombre || chofer.username || "Sin nombre"}
                      </Text>
                      {vehiculo && (
                        <Text size="xs" fw={600}>
                          {vehiculo.patente || vehiculo.marca || "Sin vehículo"}
                        </Text>
                      )}
                    </Stack>
                  </Group>
                ) : (
                  <Text size="sm" c="dimmed">Sin chofer asignado</Text>
                )}
              </Table.Td>

              <Table.Td>
                <Menu shadow="md" width={150}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" size="input-sm">
                      <IconDotsVertical size={18} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    {ACTIONS.map(({ name, items: actionItems }, index) => (
                      <Fragment key={name}>
                        <Menu.Label> {name} </Menu.Label>
                        {actionItems.map(({ icon, label, color }) => (
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
          );
        })}
      </Table.Tbody>
    </Table>
  );
};

export default ListaViajesTabla;
