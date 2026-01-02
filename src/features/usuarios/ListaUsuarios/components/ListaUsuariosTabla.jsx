import { Fragment } from "react";
import { useLocation } from "wouter";
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
  IconKey,
  IconTrash,
  IconUserOff,
} from "@tabler/icons-react";

import { timeFromNow, toLocalDate } from "@utils/dates";
import { useDeleteUsuario } from "../hooks/useDeleteUsuario";
import { API_URLS } from "@constants/apiUrls";

const ACTIONS = [
  {
    name: "Detalles",
    items: [{ icon: <IconFileDescription size={18} />, label: "Ver detalles" }],
  },
  {
    name: "Opciones",
    items: [
      { icon: <IconEdit size={18} />, label: "Editar", color: "blue" },
      {
        icon: <IconKey size={18} />,
        label: "Resetear contraseña",
        color: "orange",
      },
      { icon: <IconUserOff size={18} />, label: "Desactivar", color: "orange" },
      { icon: <IconTrash size={18} />, label: "Eliminar", color: "red" },
    ],
  },
];

const COLUMNS = [
  "Usuario",
  "Email",
  "Rol",
  "Sucursal",
  "Fecha de registro",
  "Acciones",
];

const getRolColor = (rol) => {
  const normalizedRol = rol?.toUpperCase();
  const colores = {
    ADMIN: "red",
    ROLE_ADMIN: "red",
    ADMINISTRADOR: "red",
    CHOFER: "blue",
    ROLE_CHOFER: "blue",
    SUPERVISOR: "yellow",
    ROLE_SUPERVISOR: "yellow",
    USUARIO: "gray",
    ROLE_USUARIO: "gray",
  };
  return colores[normalizedRol] || "gray";
};

const getRolLabel = (authorities) => {
  if (!authorities || authorities.length === 0) return "Usuario";

  const rol = authorities[0];
  const rolName = rol.name || rol.authority || rol;

  // Limpiar el nombre del rol
  return rolName.replace("ROLE_", "").replace(/_/g, " ");
};

const ListaUsuariosTabla = ({ items = [], onRefresh }) => {
  const [, navigate] = useLocation();
  const { confirmDelete } = useDeleteUsuario(onRefresh);

  const handleEdit = (userId) => {
    navigate(`~/usuarios/${userId}/editar`);
  };

  const handleViewDetails = (userId) => {
    navigate(`~/usuarios/${userId}`);
  };

  const handleDelete = (usuario) => {
    confirmDelete(usuario);
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
              No hay usuarios para mostrar
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
          const fullName =
            item.nombre && item.apellido
              ? `${item.nombre} ${item.apellido}`
              : item.nombre || item.username || "Sin nombre";

          const avatar = item.profile;
          const email = item.email || "Sin email";
          const sucursal = item.sucursal?.nombre || "Sin sucursal";
          const fechaRegistro =
            item.fechaCreacion || item.createdAt || item.fecha;
          const authorities = item.authorities || [];
          const rolLabel = getRolLabel(authorities);

          return (
            <Table.Tr key={item.id}>
              <Table.Td>
                <Group gap="sm">
                  {item.profile ? (
                    <Avatar
                      src={`/api${API_URLS.FILES_URL}/${item.profile}`}
                      name={fullName}
                      radius="xl"
                    />
                  ) : (
                    <Avatar src={avatar} name={fullName} radius="xl" />
                  )}
                  <Stack gap={0}>
                    <Text size="sm" fw={500}>
                      {fullName}
                    </Text>
                    <Text size="xs" c="dimmed">
                      @{item.username}
                    </Text>
                  </Stack>
                </Group>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{email}</Text>
              </Table.Td>

              <Table.Td>
                <Badge
                  color={getRolColor(authorities[0]?.name || authorities[0])}
                  variant="light"
                  radius="md"
                >
                  {rolLabel}
                </Badge>
              </Table.Td>

              <Table.Td>
                <Text size="sm">{sucursal}</Text>
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
  );
};

export default ListaUsuariosTabla;
