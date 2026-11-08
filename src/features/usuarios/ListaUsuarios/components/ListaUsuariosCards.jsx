import { Avatar, Group, Stack, Text } from '@mantine/core';

import { ListCard, ResponsiveList, RowActionsMenu } from '@components';
import { API_URLS } from '@constants/apiUrls';
import { rolBadge } from '@domain/roles';
import { nombreCompleto } from '@domain/usuario';
import { useUsuarioRowActions } from '../hooks/useUsuarioRowActions';

/**
 * Lista responsive de usuarios: tarjetas en mobile, la tabla (children) en escritorio.
 */
const ListaUsuariosCards = ({ items = [], selectedIds, onToggle, onRefresh, children, ...screenProps }) => {
  const { getActions, isSelf, isManageable } = useUsuarioRowActions(onRefresh);

  return (
    <ResponsiveList
      items={items}
      selectedIds={selectedIds}
      onToggle={onToggle}
      getActions={(usuario) => (
        <RowActionsMenu
          actions={getActions(usuario)}
          ariaLabel={`Acciones de ${nombreCompleto(usuario, 'Sin nombre')}`}
        />
      )}
      renderCard={(usuario, { selected, onToggle: toggle, actions }) => {
        const fullName = nombreCompleto(usuario, 'Sin nombre');
        const rol = rolBadge(usuario.authorities?.[0]);
        const selectable = !isSelf(usuario) && isManageable(usuario);
        return (
          <ListCard
            title={
              <Group gap="sm" wrap="nowrap">
                <Avatar
                  size="sm"
                  radius="xl"
                  color="initials"
                  name={fullName}
                  src={usuario.profile ? `/api${API_URLS.FILES_URL}/${usuario.profile}` : undefined}
                />
                <Stack gap={0} miw={0}>
                  <Text fw={600} truncate>{fullName}</Text>
                  <Text size="xs" c="dimmed" truncate>@{usuario.username}</Text>
                </Stack>
              </Group>
            }
            badge={usuario.authorities?.[0] ? rol : undefined}
            badgeBelow
            lines={[
              { label: 'Email', value: usuario.email || 'Sin email' },
              { label: 'Sucursal', value: usuario.sucursal?.nombre || 'Sin sucursal' },
            ]}
            selected={selectable ? selected : undefined}
            onToggle={toggle}
            selectLabel={`Seleccionar usuario ${usuario.username}`}
            actions={actions}
          />
        );
      }}
      {...screenProps}
    >
      {children}
    </ResponsiveList>
  );
};

export default ListaUsuariosCards;
