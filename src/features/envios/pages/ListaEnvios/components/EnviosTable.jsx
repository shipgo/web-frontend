import { Fragment } from "react";

import {
  ActionIcon,
  Avatar,
  Badge,
  CopyButton,
  Group,
  Menu,
  Stack,
  Table,
  Text,
  Tooltip,
} from "@mantine/core";
import {
  IconCheck,
  IconCopy,
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

const posibleColors = {
  en_camino: "blue",
  completado: "green",
  entregado: "green",
  asignado_a_viaje: "yellow",
  pendiente: "yellow",
  creado: "gray",
  rechazado: "red",
  cancelado: "red",
};

const getColor = (estado) => {
  const normalizedEstado = estado?.toLowerCase().replace(/\s+/g, "_");

  return posibleColors[normalizedEstado] || "gray";
};

const shouldDisableAction = (estado, label) => {
  const normalizedEstado = estado?.toLowerCase().replace(/\s+/g, "_");
  const disableActions = {
    completado: ["Reportar", "Editar", "Eliminar", "Localizar"],
    entregado: ["Reportar", "Editar", "Eliminar", "Localizar"],
    en_camino: ["Editar", "Eliminar"],
    asignado_a_viaje: ["Localizar", "Reportar"],
    rechazado: ["Reportar", "Editar", "Eliminar", "Localizar"],
    cancelado: ["Reportar", "Editar", "Eliminar", "Localizar"],
  };
  return disableActions[normalizedEstado]?.includes(label) ?? true;
};

const EnviosTable = ({ items = [] }) => {
  if (items.length === 0) {
    return (
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Código</Table.Th>
            <Table.Th>Fecha de registro</Table.Th>
            <Table.Th>Estado</Table.Th>
            <Table.Th>Destino</Table.Th>
            <Table.Th>Acciones</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          <Table.Tr>
            <Table.Td colSpan={6} style={{ textAlign: "center" }}>
              No hay envíos para mostrar
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );
  }

  return (
    <Table stickyHeader highlightOnHover>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Código</Table.Th>
          <Table.Th>Fecha de registro</Table.Th>
          <Table.Th>Estado</Table.Th>
          <Table.Th>Destino</Table.Th>
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {items.map((item) => {
          // Extraer datos del envío con múltiples variantes
          const codigoSeguimiento =
            item.codigoSeguimiento ||
            item.codigo_seguimiento ||
            item.codigo_envio ||
            item.id;
          const fechaRegistro =
            item.fechaCreacion ||
            item.fecha_registro ||
            item.fechaRegistro ||
            item.createdAt;
          const estado = item.estado || "Sin estado";

          // Dirección y ubicación - priorizar objeto destino
          const destino = item.destino || item.puntoEntrega || {};
          const direccion =
            destino.nombreCalle && destino.numeroCalle
              ? `${destino.nombreCalle} ${destino.numeroCalle}`
              : item.direccion || item.direccionEntrega || "Sin dirección";
          const localidad =
            destino.localidad?.nombre ||
            item.localidad?.nombre ||
            item.localidad ||
            "Sin localidad";
          const provincia =
            destino.localidad?.provincia?.nombre ||
            item.localidad?.provincia?.nombre ||
            item.provincia?.nombre ||
            item.provincia ||
            "Sin provincia";

          return (
            <Table.Tr key={item.id}>
              <Table.Td>
                <CopyButton value={codigoSeguimiento} timeout={2000}>
                  {({ copied, copy }) => (
                    <Tooltip
                      label={copied ? "¡Copiado!" : "Copiar código"}
                      withArrow
                      position="top"
                    >
                      <Group
                        gap="xs"
                        style={{ cursor: "pointer" }}
                        onClick={copy}
                      >
                        <Text size="sm" fw={500}>
                          {codigoSeguimiento}
                        </Text>
                        <ActionIcon
                          color={copied ? "teal" : "gray"}
                          variant="subtle"
                          size="sm"
                        >
                          {copied ? (
                            <IconCheck size={16} />
                          ) : (
                            <IconCopy size={16} />
                          )}
                        </ActionIcon>
                      </Group>
                    </Tooltip>
                  )}
                </CopyButton>
              </Table.Td>

              <Table.Td>
                <Stack gap="0">
                  <Text size="sm">{toLocalDate(fechaRegistro)}</Text>
                  <Text size="xs" fw="bold">
                    {timeFromNow(fechaRegistro)}
                  </Text>
                </Stack>
              </Table.Td>

              <Table.Td>
                <Badge color={getColor(estado)} variant="light" radius="md">
                  {estado.replaceAll("_", " ")}
                </Badge>
              </Table.Td>

              <Table.Td>
                <Stack gap={0}>
                  <Text size="sm">{direccion}</Text>
                  <Text size="xs" fw={600}>{`${localidad}, ${provincia}`}</Text>
                </Stack>
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
          );
        })}
      </Table.Tbody>
    </Table>
  );
};

export default EnviosTable;
