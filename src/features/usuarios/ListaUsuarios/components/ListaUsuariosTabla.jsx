import {
  Avatar,
  Badge,
  Checkbox,
  Group,
  Stack,
  Table,
  Text,
} from "@mantine/core";

import { EMPTY } from "@domain/format";
import { timeFromNow, toLocalDate } from "@utils/dates";
import { RowActionsMenu } from "@components";
import { API_URLS } from "@constants/apiUrls";
import { rolBadge } from "@domain/roles";
import { useUsuarioRowActions } from "../hooks/useUsuarioRowActions";
import { nombreCompleto } from "@domain/usuario";

const ListaUsuariosTabla = ({
  items = [],
  selectedIds,
  onToggle,
  onToggleAll,
  onRefresh,
}) => {
  const { getActions, isSelf, isManageable } = useUsuarioRowActions(onRefresh);

  // "Seleccionar todos" ignora la propia fila (no seleccionable): si no se
  // excluyera acá, el checkbox de cabecera nunca llegaría a `checked` con el
  // resto de la página ya tildada (la propia fila jamás entra a `selectedIds`).
  const selectableItems = items.filter((i) => !isSelf(i) && isManageable(i));
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
          const fullName = nombreCompleto(item, "Sin nombre");

          const email = item.email || "Sin email";
          const sucursal = item.sucursal?.nombre || "Sin sucursal";
          const fechaRegistro = item.fechaCreacion || item.createdAt || item.fecha;
          const authorities = item.authorities || [];
          const self = isSelf(item);
          const manageable = isManageable(item);

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
