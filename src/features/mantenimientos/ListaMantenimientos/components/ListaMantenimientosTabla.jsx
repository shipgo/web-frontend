import { useLocation } from "wouter";
import { Checkbox, Stack, Table, Text } from "@mantine/core";
import {
  IconEdit,
  IconFileDescription,
  IconTrash,
} from "@tabler/icons-react";

import { RowActionsMenu } from "@components";
import { timeFromNow, toLocalDateTime } from "@utils/dates";

import { useDeleteMantenimiento } from "../hooks/useDeleteMantenimiento";

const getActionsForRow = ({ onVerDetalles, onEditar, onEliminar }) => [
  {
    name: "Detalles",
    items: [
      {
        icon: <IconFileDescription size={18} />,
        label: "Ver detalles",
        onClick: onVerDetalles,
      },
    ],
  },
  {
    name: "Opciones",
    items: [
      { icon: <IconEdit size={18} />, label: "Editar", color: "blue", onClick: onEditar },
      { icon: <IconTrash size={18} />, label: "Eliminar", color: "red", onClick: onEliminar },
    ],
  },
];

const marcaModelo = (vehiculo) => {
  if (!vehiculo) return null;
  const marca = vehiculo.modelo?.marca?.nombre ?? "";
  const modelo = vehiculo.modelo?.nombre ?? "";
  return `${marca} ${modelo}`.trim() || null;
};

const ListaMantenimientosTabla = ({
  items = [],
  selectedIds,
  onToggle,
  onToggleAll,
  onRefresh,
}) => {
  const [, navigate] = useLocation();
  const { confirmDelete } = useDeleteMantenimiento(onRefresh);

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
          <Table.Th>Vehículo</Table.Th>
          <Table.Th>Tipo</Table.Th>
          <Table.Th>Mecánico</Table.Th>
          <Table.Th>Fecha de mantenimiento</Table.Th>
          <Table.Th>Sucursal</Table.Th>
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {items.map((item) => {
          const vehiculo = item.vehiculo;
          const patente = vehiculo?.patente ?? "-";
          const tipo = item.tipoMantenimiento?.nombre ?? "-";
          const mecanico =
            `${item.nombreMecanico ?? ""} ${item.apellidoMecanico ?? ""}`.trim() || "-";
          const sucursal = item.sucursal?.nombre ?? "-";
          const fecha = item.fechaHoraMantenimiento;

          return (
            <Table.Tr
              key={item.id}
              bg={selectedIds.has(item.id) ? "var(--mantine-color-blue-light)" : undefined}
            >
              <Table.Td>
                <Checkbox
                  checked={selectedIds.has(item.id)}
                  onChange={() => onToggle(item.id)}
                />
              </Table.Td>

              <Table.Td>
                <Stack gap={0}>
                  <Text size="sm" fw={600}>
                    {patente}
                  </Text>
                  {marcaModelo(vehiculo) && (
                    <Text size="xs" c="dimmed">
                      {marcaModelo(vehiculo)}
                    </Text>
                  )}
                </Stack>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{tipo}</Text>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{mecanico}</Text>
              </Table.Td>

              <Table.Td>
                {fecha ? (
                  <Stack gap={0}>
                    <Text size="sm">{toLocalDateTime(fecha)}</Text>
                    <Text size="xs" fw="bold">
                      {timeFromNow(fecha)}
                    </Text>
                  </Stack>
                ) : (
                  <Text size="sm" c="dimmed">
                    Sin fecha
                  </Text>
                )}
              </Table.Td>

              <Table.Td>
                <Text size="sm">{sucursal}</Text>
              </Table.Td>

              <Table.Td>
                <RowActionsMenu
                  actions={getActionsForRow({
                    onVerDetalles: () => navigate(`~/mantenimientos/${item.id}`),
                    onEditar: () => navigate(`~/mantenimientos/${item.id}/editar`),
                    onEliminar: () => confirmDelete(item),
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

export default ListaMantenimientosTabla;
