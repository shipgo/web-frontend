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
  IconCheck,
  IconTrash,
  IconCar,
} from "@tabler/icons-react";

import { timeFromNow, toLocalDate } from "@utils/dates";

const ACTIONS = [
  {
    name: "Detalles",
    items: [
      { icon: <IconFileDescription size={18} />, label: "Ver detalles" },
      { icon: <IconCar size={18} />, label: "Ver vehículo" },
    ],
  },
  {
    name: "Opciones",
    items: [
      { icon: <IconCheck size={18} />, label: "Completar", color: "green" },
      { icon: <IconEdit size={18} />, label: "Editar", color: "blue" },
      { icon: <IconTrash size={18} />, label: "Eliminar", color: "red" },
    ],
  },
];

const COLUMNS = [
  "Vehículo",
  "Tipo de mantenimiento",
  "Fecha programada",
  "Costo",
  "Estado",
  "Sucursal",
  "Acciones",
];

const getEstadoColor = (estado) => {
  const normalizedEstado = estado?.toUpperCase();
  const colores = {
    PENDIENTE: "yellow",
    EN_PROCESO: "blue",
    "EN PROCESO": "blue",
    COMPLETADO: "green",
    CANCELADO: "red",
    VENCIDO: "red",
  };
  return colores[normalizedEstado] || "gray";
};

const shouldDisableAction = (estado, label) => {
  const normalizedEstado = estado?.toUpperCase();
  const disableActions = {
    COMPLETADO: ["Completar", "Editar"],
    CANCELADO: ["Completar", "Editar"],
  };
  return disableActions[normalizedEstado]?.includes(label) ?? false;
};

const formatCurrency = (value) => {
  if (!value) return "Sin costo";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(value);
};

const ListaMantenimientosTabla = ({ items = [] }) => {
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
              No hay mantenimientos para mostrar
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
          const vehiculo = item.vehiculo;
          const patente = vehiculo?.patente || "Sin patente";
          const marcaModelo = vehiculo
            ? `${vehiculo.marca?.nombre || vehiculo.marca || ""} ${
                vehiculo.modelo?.nombre || vehiculo.modelo || ""
              }`.trim() || "Sin datos"
            : "Sin vehículo";

          const tipoMantenimiento =
            item.tipoMantenimiento?.nombre ||
            item.tipo?.nombre ||
            item.tipo ||
            "Sin tipo";

          const fechaProgramada =
            item.fechaProgramada || item.fecha || item.fechaCreacion;
          const costo = item.costo || item.costoEstimado || 0;
          const estado = item.estado || "PENDIENTE";
          const sucursal =
            vehiculo?.sucursal?.nombre || item.sucursal?.nombre || "Sin sucursal";

          return (
            <Table.Tr key={item.id}>
              <Table.Td>
                <Stack gap={0}>
                  <Text size="sm" fw={600}>
                    {patente}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {marcaModelo}
                  </Text>
                </Stack>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{tipoMantenimiento}</Text>
              </Table.Td>

              <Table.Td>
                {fechaProgramada ? (
                  <Stack gap="0">
                    <Text size="sm">{toLocalDate(fechaProgramada)}</Text>
                    <Text size="xs" fw="bold">
                      {timeFromNow(fechaProgramada)}
                    </Text>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    Sin fecha
                  </Text>
                )}
              </Table.Td>

              <Table.Td>
                <Text size="sm" fw={500}>
                  {formatCurrency(costo)}
                </Text>
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
                <Text size="sm">{sucursal}</Text>
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

export default ListaMantenimientosTabla;

