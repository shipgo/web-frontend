import { Avatar, Group, NavLink, Stack, Switch, Text } from "@mantine/core";
import { IconLogout, IconUser } from "@tabler/icons-react";
import { Link } from "wouter";

import { useAuth } from "@contexts/auth";
import { useAuthStore } from "@stores/auth.store";
import { necesitaOnboardingEmpresa } from "@domain/empresa";
import { rolLabel } from "@domain/roles";
import { iniciales, nombreCompleto } from "@domain/usuario";
import { useToggleColorScheme } from "@hooks/useToggleColorScheme";

const ROW_MIN_HEIGHT = 44;

/**
 * Pie del cajón móvil: usuario, "Mi perfil", modo oscuro y "Cerrar sesión".
 * Reemplaza al menú del avatar del header, que en mobile no se muestra.
 */
const MobileUserSection = () => {
  const { user } = useAuth();
  const { logout } = useAuthStore();
  const { computedColorScheme, handleToggleColorScheme } = useToggleColorScheme();

  if (!user) return null;

  const esOscuro = computedColorScheme === "dark";
  const role = rolLabel(user.authorities?.[0]?.name || user.role);
  const sinEmpresa = necesitaOnboardingEmpresa(user);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <Stack gap={0} data-testid="mobile-user-section">
      <Group wrap="nowrap" px="md" py="xs" mih={ROW_MIN_HEIGHT}>
        <Avatar
          src={user.profile ? `/api${user.profile}` : undefined}
          radius="xl"
          color="colorPalette"
        >
          {iniciales(user) || "U"}
        </Avatar>
        <Stack gap={0} miw={0}>
          <Text fw={600} size="sm" truncate="end">
            {nombreCompleto(user, "Usuario")}
          </Text>
          <Text size="xs" c="dimmed">
            {role}
          </Text>
        </Stack>
      </Group>

      {!sinEmpresa && (
        <NavLink
          to={`/usuarios/${user.id}`}
          component={Link}
          label="Mi perfil"
          mih={ROW_MIN_HEIGHT}
          leftSection={<IconUser size={18} />}
        />
      )}

      <Group px="md" mih={ROW_MIN_HEIGHT} justify="space-between" wrap="nowrap">
        <Switch
          w="100%"
          size="md"
          label="Modo oscuro"
          labelPosition="left"
          checked={esOscuro}
          onChange={handleToggleColorScheme}
          styles={{ body: { width: "100%", justifyContent: "space-between" } }}
        />
      </Group>

      <NavLink
        color="red"
        label="Cerrar sesión"
        mih={ROW_MIN_HEIGHT}
        onClick={handleLogout}
        leftSection={<IconLogout size={18} />}
      />
    </Stack>
  );
};

export default MobileUserSection;
