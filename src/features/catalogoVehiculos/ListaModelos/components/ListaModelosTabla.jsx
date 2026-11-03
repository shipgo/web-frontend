import { Fragment } from "react";
import { ActionIcon, Menu, Table, Text } from "@mantine/core";
import { IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import { useLocation } from "wouter";

import { useDeleteModelo } from "../hooks/useDeleteModelo";

const COLUMNS = ["Nombre", "Marca", "Año", "Acciones"];

const ListaModelosTabla = ({ items = [], onRefresh }) => {
  const [, navigate] = useLocation();
  const { openDeleteModal } = useDeleteModelo(onRefresh);

  const handleAction = (action, item) => {
    switch (action) {
      case "Editar":
        navigate(`/modelos/${item.id}/editar`);
        break;
      case "Eliminar":
        openDeleteModal(item);
        break;
      default:
        break;
    }
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
              No hay modelos para mostrar
            </Table.Td>
          </Table.Tr>
        </Table.Tbody>
      </Table>
    );
  }

  return (
    <Table.ScrollContainer minWidth={640}>
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
            const marca = item.marca?.nombre || "Sin marca";

            return (
              <Table.Tr key={item.id}>
                <Table.Td>
                  <Text size="sm" fw={600}>
                    {nombre}
                  </Text>
                </Table.Td>

                <Table.Td>
                  <Text size="sm">{marca}</Text>
                </Table.Td>

                <Table.Td>
                  <Text size="sm">{item.anio ?? "Sin año"}</Text>
                </Table.Td>

                <Table.Td>
                  <Menu shadow="md" width={200}>
                    <Menu.Target>
                      <ActionIcon
                        variant="subtle"
                        size="input-sm"
                        aria-label={`Acciones de ${nombre}`}
                      >
                        <IconDotsVertical size={18} />
                      </ActionIcon>
                    </Menu.Target>

                    <Menu.Dropdown>
                      <Fragment>
                        <Menu.Item
                          color="blue"
                          leftSection={<IconEdit size={18} />}
                          onClick={() => handleAction("Editar", item)}
                        >
                          Editar
                        </Menu.Item>
                        <Menu.Item
                          color="red"
                          leftSection={<IconTrash size={18} />}
                          onClick={() => handleAction("Eliminar", item)}
                        >
                          Eliminar
                        </Menu.Item>
                      </Fragment>
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

export default ListaModelosTabla;
