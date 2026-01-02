import { Fragment } from "react";
import {
  ActionIcon,
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
  IconMapPin,
  IconTrash,
  IconBuilding,
} from "@tabler/icons-react";

import { timeFromNow, toLocalDate } from "@utils/dates";

const ACTIONS = [
  {
    name: "Detalles",
    items: [
      { icon: <IconFileDescription size={18} />, label: "Ver detalles" },
      { icon: <IconMapPin size={18} />, label: "Ver ubicación" },
    ],
  },
  {
    name: "Opciones",
    items: [
      { icon: <IconEdit size={18} />, label: "Editar", color: "blue" },
      { icon: <IconBuilding size={18} />, label: "Ver vehículos", color: "cyan" },
      { icon: <IconTrash size={18} />, label: "Eliminar", color: "red" },
    ],
  },
];

const COLUMNS = [
  "Nombre",
  "Dirección",
  "Provincia",
  "Teléfono",
  "Estado",
  "Fecha de registro",
  "Acciones",
];

const getEstadoColor = (estado) => {
  const normalizedEstado = estado?.toUpperCase();
  const colores = {
    ACTIVA: "green",
    ACTIVO: "green",
    INACTIVA: "red",
    INACTIVO: "red",
    MANTENIMIENTO: "yellow",
  };
  return colores[normalizedEstado] || "gray";
};

const ListaSucursalesTabla = ({ items = [] }) => {
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
              No hay sucursales para mostrar
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );
  }

  return (
    <Table stickyHeader highlightOnHover verticalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          {COLUMNS.map((column) => (
            <Table.Th key={column}>{column}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((item) => {
          const nombre = item.nombre || "Sin nombre";
          const direccion = item.direccion || "Sin dirección";
          const localidad = item.localidad?.nombre || item.localidad || "";
          const provincia =
            item.localidad?.provincia?.nombre ||
            item.provincia?.nombre ||
            item.provincia ||
            "Sin provincia";
          const telefono = item.telefono || "Sin teléfono";
          const estado = item.estado || item.activo ? "ACTIVA" : "INACTIVA";
          const fechaRegistro =
            item.fechaCreacion || item.createdAt || item.fecha;

          return (
            <Table.Tr key={item.id}>
              <Table.Td>
                <Text size="sm" fw={600}>
                  {nombre}
                </Text>
              </Table.Td>

              <Table.Td>
                <Stack gap={0}>
                  <Text size="sm">{direccion}</Text>
                  {localidad && (
                    <Text size="xs" c="dimmed">
                      {localidad}
                    </Text>
                  )}
                </Stack>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{provincia}</Text>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{telefono}</Text>
              </Table.Td>

              <Table.Td>
                <Badge
                  color={getEstadoColor(estado)}
                  variant="light"
                  radius="md"
                >
                  {estado}
                </Badge>
              </Table.Td>

              <Table.Td>
                {fechaRegistro ? (
                  <Stack gap="0">
                    <Text size="sm">{toLocalDate(fechaRegistro)}</Text>
                    <Text size="xs" fw="bold">
                      {timeFromNow(fechaRegistro)}
                    </Text>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    Sin fecha
                  </Text>
                )}
              </Table.Td>

              <Table.Td>
                <Menu shadow="md" width={200}>
                  <Menu.Target>
                    <ActionIcon variant="subtle" size="input-sm">
                      <IconDotsVertical size={18} />
                    </ActionIcon>
                  </Menu.Target>

                  <Menu.Dropdown>
                    {ACTIONS.map(({ name, items: actionItems }, index) => (
                      <Fragment key={name}>
                        <Menu.Label>{name}</Menu.Label>
                        {actionItems.map(({ icon, label, color }) => (
                          <Menu.Item key={label} color={color} leftSection={icon}>
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

export default ListaSucursalesTabla;

