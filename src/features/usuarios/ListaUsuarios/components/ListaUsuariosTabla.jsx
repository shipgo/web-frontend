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

import { EMPTY } from "@domain/format";
import { timeFromNow, toLocalDate } from "@utils/dates";
import { RowActionsMenu } from "@components";
import { API_URLS } from "@constants/apiUrls";
import { rolBadge } from "@domain/roles";
import { useAuthStore } from "@stores/auth.store";
import { useDeleteUsuario } from "../hooks/useDeleteUsuario";
import { usePasswordReset } from "../../hooks/usePasswordReset";
import { canManageUsuario } from "../../utils";

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

  // SHG-FE-094 / SHG-FE-095: nunca ofrecer "Eliminar" (ni individual ni
  // masivo) sobre el propio usuario logueado — hard delete sin guarda de
  // backend contra auto-borrado, la decisión de alcance fue resolverlo sólo
  // en el frontend. Se usa también para deshabilitar el checkbox de la
  // propia fila (bulk delete de SelectionBanner).
  const isSelf = (usuario) =>
    Boolean(currentUser?.id) && String(currentUser.id) === String(usuario.id);

  const getActions = (usuario) => {
    // "Desactivar" se quitó del menú: no tenía `onClick` ni soporte de
    // backend (`enabled` no existe en `UserDTO`), y activar/desactivar
    // usuarios quedó fuera de alcance.
    const self = isSelf(usuario);
    // SHG-FE-121: un ADMIN no edita ni borra a otros ADMIN/SUPERUSER (404 del backend).
    const manageable = canManageUsuario(currentUser, usuario);

    const actions = [
      { icon: <IconEye size={18} />, label: "Ver detalles", onClick: () => handleViewDetails(usuario.id) },
    ];
    if (manageable) {
      actions.push({ icon: <IconEdit size={18} />, label: "Editar", color: "blue", onClick: () => handleEdit(usuario.id) });
    }
    actions.push({ icon: <IconKey size={18} />, label: "Resetear contraseña", color: "orange", onClick: () => confirmReset(usuario) });

    if (!self && manageable) {
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

  // "Seleccionar todos" ignora la propia fila (no seleccionable): si no se
  // excluyera acá, el checkbox de cabecera nunca llegaría a `checked` con el
  // resto de la página ya tildada (la propia fila jamás entra a `selectedIds`).
  const selectableItems = items.filter((i) => !isSelf(i) && canManageUsuario(currentUser, i));
  const allSelected = selectableItems.length > 0 && selectableItems.every((i) => selectedIds.has(i.id));
  const indeterminate = !allSelected && selectableItems.some((i) => selectedIds.has(i.id));

  return (
    <Table.ScrollContainer minWidth={760}>
    <Table stickyHeader highlightOnHover verticalSpacing="xs" horizontalSpacing="xs">
      <Table.Thead>
        <Table.Tr>
          <Table.Th w={40}>
            <Checkbox
              aria-label="Seleccionar todos los usuarios"
              checked={allSelected}
              indeterminate={indeterminate}
              onChange={onToggleAll}
            />
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
          const self = isSelf(item);
          const manageable = canManageUsuario(currentUser, item);

          return (
            <Table.Tr
              key={item.id}
              bg={selectedIds.has(item.id) ? "var(--mantine-color-blue-light)" : undefined}
            >
              <Table.Td>
                <Checkbox
                  aria-label={
                    self
                      ? "No podés seleccionar tu propio usuario"
                      : !manageable
                        ? `No podés seleccionar a ${item.username}`
                        : `Seleccionar usuario ${item.username}`
                  }
                  checked={selectedIds.has(item.id)}
                  disabled={self || !manageable}
                  onChange={() => onToggle(item.id)}
                />
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
                    {EMPTY}
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
