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
import {
  IconDotsVertical,
  IconEdit,
  IconFileDescription,
  IconMapSearch,
  IconMessageReport,
  IconTrash,
} from "@tabler/icons-react";

import { timeFromNow, toLocalDate } from "@utils/dates";

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

const getColor = (estado) => {
  const posibleColors = {
    en_camino: "blue",
    completado: "green",
    asignado_a_viaje: "yellow",
    creado: "gray",
    rechazado: "red",
  };
  return posibleColors[estado];
};

const shouldDisableAction = (estado, label) => {
  const disableActions = {
    completado: ["Reportar", "Editar", "Eliminar", "Localizar"],
    en_camino: ["Editar", "Eliminar"],
    asignado_a_viaje: ["Localizar", "Reportar"],
    rechazado: ["Reportar", "Editar", "Eliminar", "Localizar"],
  };
  return disableActions[estado]?.includes(label) ?? true;
};

const EnviosTable = ({ items = [] }) => (
  <Table stickyHeader highlightOnHover>
    <Table.Thead>
      <Table.Tr>
        <Table.Th>Código</Table.Th>
        <Table.Th>Fecha de registro</Table.Th>
        <Table.Th>Estado</Table.Th>
        <Table.Th>Destino</Table.Th>
        <Table.Th>Chofer</Table.Th>
        <Table.Th>Acciones</Table.Th>
      </Table.Tr>
    </Table.Thead>

    <Table.Tbody>
      {items.map(
        ({
          id,
          codigoSeguimiento,
          direccion,
          estado,
          fecha_registro,
          localidad,
          provincia,
          chofer_asignado: choferAsignado,
        }) => (
          <Table.Tr key={id}>
            <Table.Td>{codigoSeguimiento}</Table.Td>

            <Table.Td>
              <Stack gap="0">
                <Text size="sm">{toLocalDate(fecha_registro)}</Text>
                <Text size="xs" fw="bold">
                  {timeFromNow(fecha_registro)}
                </Text>
              </Stack>
            </Table.Td>

            <Table.Td>
              <Badge color={getColor(estado)} variant="light" radius="md">
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
              {choferAsignado ? (
                <Group gap="0.5rem">
                  <Avatar src={choferAsignado.perfil} />
                  <Stack gap={0}>
                    <Text size="sm">{choferAsignado.nombre}</Text>
                    <Text size="xs" fw={600}>
                      {choferAsignado.vehiculo_asignado}
                    </Text>
                  </Stack>
                </Group>
              ) : (
                "-"
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
                  {ACTIONS.map(({ name, items }, index) => (
                    <Fragment key={name}>
                      <Menu.Label> {name} </Menu.Label>
                      {items.map(({ icon, label, color }) => (
                        <Menu.Item
                          key={label}
                          color={color}
                          leftSection={icon}
                          disabled={shouldDisableAction(estado, label)}
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
        )
      )}
    </Table.Tbody>
  </Table>
);

export default EnviosTable;
