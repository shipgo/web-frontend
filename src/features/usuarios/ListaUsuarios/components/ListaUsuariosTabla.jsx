import { useLocation } from "wouter";
import {
  Avatar,
  Badge,
  Checkbox,
  Group,
  Stack,
  Table,
  Text,
} from "@mantine/core";
import {
  IconEdit,
  IconEye,
  IconKey,
  IconTrash,
} from "@tabler/icons-react";

import { timeFromNow, toLocalDate } from "@utils/dates";
import { RowActionsMenu } from "@components";
import { API_URLS } from "@constants/apiUrls";
import { rolBadge } from "@domain/roles";
import { useAuthStore } from "@stores/auth.store";
import { useDeleteUsuario } from "../hooks/useDeleteUsuario";
import { usePasswordReset } from "../../hooks/usePasswordReset";

const ListaUsuariosTabla = ({
  items = [],
  selectedIds,
  onToggle,
  onToggleAll,
  onRefresh,
}) => {
  const [, navigate] = useLocation();
  const { confirmDelete } = useDeleteUsuario(onRefresh);
  const { confirmReset } = usePasswordReset();
  const currentUser = useAuthStore((state) => state.user);

  const handleEdit = (userId) => navigate(`~/usuarios/${userId}/editar`);
  const handleViewDetails = (userId) => navigate(`~/usuarios/${userId}`);

  const getActions = (usuario) => {
    // SHG-FE-094: nunca ofrecer "Eliminar" sobre el propio usuario logueado
    // (hard delete sin guarda de backend contra auto-borrado — la decisión de
    // alcance fue resolverlo sólo en el frontend). "Desactivar" se quitó del
    // menú: no tenía `onClick` ni soporte de backend (`enabled` no existe en
    // `UserDTO`), y activar/desactivar usuarios quedó fuera de alcance.
    const isSelf =
      Boolean(currentUser?.id) && String(currentUser.id) === String(usuario.id);

    const actions = [
      { icon: <IconEye size={18} />, label: "Ver detalles", onClick: () => handleViewDetails(usuario.id) },
      { icon: <IconEdit size={18} />, label: "Editar", color: "blue", onClick: () => handleEdit(usuario.id) },
      { icon: <IconKey size={18} />, label: "Resetear contraseña", color: "orange", onClick: () => confirmReset(usuario) },
    ];

    if (!isSelf) {
      actions.push({
        icon: <IconTrash size={18} />,
        label: "Eliminar",
        color: "red",
        dividerBefore: true,
        onClick: () => confirmDelete(usuario),
      });
    }

    return actions;
  };

  const allSelected = items.length > 0 && items.every((i) => selectedIds.has(i.id));
  const indeterminate = !allSelected && items.some((i) => selectedIds.has(i.id));

  return (
    <Table.ScrollContainer minWidth={760}>
    <Table stickyHeader highlightOnHover verticalSpacing="xs" horizontalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={40}>
            <Checkbox checked={allSelected} indeterminate={indeterminate} onChange={onToggleAll} />
          </Table.Th>
          <Table.Th>Usuario</Table.Th>
          <Table.Th>Email</Table.Th>
          <Table.Th>Rol</Table.Th>
          <Table.Th>Sucursal</Table.Th>
          <Table.Th>Fecha de registro</Table.Th>
          <Table.Th>Acciones</Table.Th>
        </Table.Tr>
      </Table.Thead>

      <Table.Tbody>
        {items.map((item) => {
          const fullName =
            item.nombre && item.apellido
              ? `${item.nombre} ${item.apellido}`
              : item.nombre || item.username || "Sin nombre";

          const email = item.email || "Sin email";
          const sucursal = item.sucursal?.nombre || "Sin sucursal";
          const fechaRegistro = item.fechaCreacion || item.createdAt || item.fecha;
          const authorities = item.authorities || [];

          return (
            <Table.Tr
              key={item.id}
              bg={selectedIds.has(item.id) ? "var(--mantine-color-blue-light)" : undefined}
            >
              <Table.Td>
                <Checkbox checked={selectedIds.has(item.id)} onChange={() => onToggle(item.id)} />
              </Table.Td>

              <Table.Td>
                <Group gap="sm">
                  {item.profile ? (
                    <Avatar
                      src={`/api${API_URLS.FILES_URL}/${item.profile}`}
                      name={fullName}
                      radius="xl"
                    />
                  ) : (
                    <Avatar name={fullName} color="initials" radius="xl" />
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
                <Group gap="xs">
                  {authorities.map((auth, index) => {
                    const rol = rolBadge(auth);
                    return (
                      <Badge key={index} color={rol.color} variant="light" radius="md">
                        {rol.label}
                      </Badge>
                    );
                  })}
                </Group>
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
                <RowActionsMenu actions={getActions(item)} ariaLabel={`Acciones de ${fullName}`} />
              </Table.Td>
            </Table.Tr>
          );
        })}
      </Table.Tbody>
    </Table>
    </Table.ScrollContainer>
  );
};

export default ListaUsuariosTabla;
