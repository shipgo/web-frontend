import { Fragment } from "react";
import { useLocation } from "wouter";
import {
  ActionIcon,
  Badge,
  Checkbox,
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
  IconTool,
  IconTrash,
  IconCar,
} from "@tabler/icons-react";

import { timeFromNow, toLocalDate } from "@utils/dates";
import { useDeleteVehiculo } from "../hooks/useDeleteVehiculo";

const ACTIONS = [
  {
    name: "Detalles",
    items: [
      { icon: <IconFileDescription size={18} />, label: "Ver detalles" },
      { icon: <IconTool size={18} />, label: "Historial mantenimiento" },
    ],
  },
  {
    name: "Opciones",
    items: [
      { icon: <IconEdit size={18} />, label: "Editar", color: "blue" },
      { icon: <IconCar size={18} />, label: "Asignar chofer", color: "yellow" },
      { icon: <IconTrash size={18} />, label: "Eliminar", color: "red" },
    ],
  },
];

const COLUMNS = [
  "",
  "Patente",
  "Marca/Modelo",
  "Tipo",
  "Sucursal",
  "Estado",
  "Fecha de registro",
  "Acciones",
];

const colores = {
  DISPONIBLE: "green",
  EN_USO: "blue",
  "EN USO": "blue",
  MANTENIMIENTO: "orange",
  FUERA_DE_SERVICIO: "red",
  "FUERA DE SERVICIO": "red",
  INACTIVO: "gray",
};
const getEstadoColor = (estado) => {
  const normalizedEstado = estado?.toUpperCase();

  return colores[normalizedEstado] || "gray";
};

const ListaVehiculosTabla = ({
  items = [],
  selectedIds = new Set(),
  onToggle = () => {},
  onToggleAll = () => {},
  onRefresh,
}) => {
  const [, navigate] = useLocation();
  const { confirmDelete } = useDeleteVehiculo(onRefresh);

  const handleEdit = (vehiculoId) => {
    navigate(`~/vehiculos/${vehiculoId}/editar`);
  };

  const handleViewDetails = (vehiculoId) => {
    navigate(`~/vehiculos/${vehiculoId}`);
  };

  const handleDelete = (vehiculo) => {
    confirmDelete(vehiculo);
  };

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
              No hay vehículos para mostrar
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );
  }

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const indeterminate = !allSelected && items.some((i) => selectedIds.has(i.id));

  return (
    <Table.ScrollContainer minWidth={860}>
    <Table stickyHeader highlightOnHover verticalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={40}>
            <Checkbox checked={allSelected} indeterminate={indeterminate} onChange={onToggleAll} />
          </Table.Th>
          {COLUMNS.slice(1).map((column) => (
            <Table.Th key={column}>{column}</Table.Th>
          ))}
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {items.map((item) => {
          const patente = item.patente || "Sin patente";
          const marca = item.modelo?.marca?.nombre || "Sin marca";
          const modelo = item.modelo?.nombre || "Sin modelo";
          const tipoVehiculo =
            item.tipoVehiculo?.nombre || item.tipo || "Sin tipo";
          const sucursal = item.sucursal?.nombre || "Sin sucursal";
          const estado = item.estado || "Sin estado";
          const fechaRegistro = item.anioCompra;

          return (
            <Table.Tr
              key={item.id}
              bg={selectedIds.has(item.id) ? "var(--mantine-color-blue-light)" : undefined}
            >
              <Table.Td>
                <Checkbox checked={selectedIds.has(item.id)} onChange={() => onToggle(item.id)} />
              </Table.Td>

              <Table.Td>
                <Text size="sm" fw={600}>
                  {patente}
                </Text>
              </Table.Td>

              <Table.Td>
                <Stack gap={0}>
                  <Text size="sm" fw={500}>
                    {marca}
                  </Text>
                  <Text size="xs" c="dimmed">
                    {modelo}
                  </Text>
                </Stack>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{tipoVehiculo}</Text>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{sucursal}</Text>
              </Table.Td>

              <Table.Td>
                <Badge
                  color={getEstadoColor(estado)}
                  variant="light"
                  radius="md"
                >
                  {estado.replaceAll("_", " ")}
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
                    <ActionIcon
                      variant="subtle"
                      size="input-sm"
                      aria-label={`Acciones de ${patente}`}
                    >
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
                            onClick={() => {
                              if (label === "Editar") {
                                handleEdit(item.id);
                              } else if (label === "Ver detalles") {
                                handleViewDetails(item.id);
                              } else if (label === "Eliminar") {
                                handleDelete(item);
                              }
                            }}
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
    </Table.ScrollContainer>
  );
};

export default ListaVehiculosTabla;
