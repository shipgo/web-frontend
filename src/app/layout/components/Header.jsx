import {
  AppShellHeader,
  Avatar,
  Button,
  Flex,
  Group,
  Kbd,
  Menu,
  rem,
  Stack,
  Switch,
  Text,
} from "@mantine/core";
import { spotlight } from "@mantine/spotlight";

import { Link } from "wouter";

import {
  IconLogout,
  IconMoonStars,
  IconSearch,
  IconSun,
  IconUser,
} from "@tabler/icons-react";

import { useAuth } from "@contexts/auth";
import { useAuthStore } from "@stores/auth.store";
import { NotificacionesBell } from "@features/notificaciones";
import { OperatingSucursalSelector } from "@components";
import { necesitaOnboardingEmpresa } from "@domain/empresa";
import { rolLabel } from "@domain/roles";
import { iniciales, nombreCompleto } from "@domain/usuario";
import { useToggleColorScheme } from "@hooks/useToggleColorScheme";

import NavigationSpotlight from "./NavigationSpotlight";

// `Menu.Item` fuerza `role="menuitem"` (que no admite `aria-checked`).
const setMenuItemCheckbox = (el) => el?.setAttribute("role", "menuitemcheckbox");

const AppHeader = () => {
  const { user } = useAuth();
  const { logout } = useAuthStore();
  const { computedColorScheme, handleToggleColorScheme } = useToggleColorScheme();

  // Si no hay usuario, no renderizar el header (o renderizar versión simplificada)
  if (!user) {
    return null;
  }

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const esOscuro = computedColorScheme === "dark";
  const fullName = nombreCompleto(user, "Usuario");
  const initials = iniciales(user) || "U";
  const role = rolLabel(user.authorities?.[0]?.name || user.role);
  // SHG-FE-116: sin empresa no hay nada que buscar ni notificaciones: queda el
  // menú del usuario (con "Cerrar sesión").
  const sinEmpresa = necesitaOnboardingEmpresa(user);

  return (
    <AppShellHeader component={Flex} justify="center">
      <Flex flex={1} maw={1440} px="xl" py="xs">
        {!sinEmpresa && (
          <Group>
            <Button
              w={400}
              justify="space-between"
              variant="default"
              onClick={() => spotlight.open()}
              leftSection={<IconSearch size={18} />}
              rightSection={
                <Group gap={4} wrap="nowrap">
                  <Kbd size="xs">Ctrl</Kbd>
                  <Kbd size="xs">K</Kbd>
                </Group>
              }
            >
              <Text size="sm" c="dimmed" fw={400}>
                Buscar o navegar...
              </Text>
            </Button>
            <OperatingSucursalSelector />
          </Group>
        )}

        {!sinEmpresa && <NavigationSpotlight />}

        <Group ml="auto">
          {!sinEmpresa && <NotificacionesBell />}

          <Menu position="bottom-end" withArrow width={210}>
            <Menu.Target>
              <Button
                pr="0"
                size="lg"
                variant="transparent"
                rightSection={
                  user.profile ? (
                    <Avatar
                      src={`/api${user.profile}`}
                      radius="xl"
                      color="colorPalette"
                    />
                  ) : (
                    <Avatar radius="xl" color="colorPalette">
                      {initials}
                    </Avatar>
                  )
                }
                leftSection={
                  <Stack gap={0} ta="right" maw={300}>
                    <Text fw={600} size="sm" truncate="end">
                      {fullName}
                    </Text>
                    <Text size="xs" c="gray">
                      {role}
                    </Text>
                  </Stack>
                }
              />
            </Menu.Target>

            <Menu.Dropdown>
              {/* SHG-FE-134: sin empresa la ruta del perfil no se renderiza. */}
              {!sinEmpresa && (
                <Menu.Item
                  component={Link}
                  to={`/usuarios/${user.id}`}
                  leftSection={
                    <IconUser style={{ width: rem(14), height: rem(14) }} />
                  }
                >
                  Mi perfil
                </Menu.Item>
              )}
              {/* SHG-FE-134: la fila entera es el único destino de clic/teclado
                  (`menuitemcheckbox` + `aria-checked`; Menu.Item fija
                  role="menuitem" y no admite `aria-checked`, por eso se corrige por ref); el Switch es sólo visual
                  (aria-hidden, fuera del tab order, sin eventos de puntero) para no
                  anidar un input focusable dentro de un menuitem. */}
              <Menu.Item
                ref={setMenuItemCheckbox}
                aria-checked={esOscuro}
                closeMenuOnClick={false}
                onClick={handleToggleColorScheme}
                rightSection={
                  <Switch
                    readOnly
                    size="md"
                    tabIndex={-1}
                    aria-hidden="true"
                    checked={esOscuro}
                    onChange={() => {}}
                    style={{ pointerEvents: "none" }}
                    thumbIcon={
                      esOscuro ? (
                        <IconMoonStars
                          size={12}
                          color="var(--mantine-color-blue-6)"
                        />
                      ) : (
                        <IconSun
                          size={12}
                          color="var(--mantine-color-yellow-6)"
                        />
                      )
                    }
                  />
                }
              >
                Modo oscuro
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item
                color="red"
                onClick={handleLogout}
                leftSection={
                  <IconLogout style={{ width: rem(14), height: rem(14) }} />
                }
              >
                Cerrar sesión
              </Menu.Item>
            </Menu.Dropdown>
          </Menu>
        </Group>
      </Flex>
    </AppShellHeader>
  );
};

export default AppHeader;
