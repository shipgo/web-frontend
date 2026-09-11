import {
  AppShellHeader,
  Avatar,
  Button,
  Flex,
  Group,
  Menu,
  rem,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";

import { IconLogout, IconSearch } from "@tabler/icons-react";

import { useAuth } from "@contexts/auth";
import { useAuthStore } from "@stores/auth.store";
import { NotificacionesBell } from "@features/notificaciones";
import { OperatingSucursalSelector } from "@components";

const AppHeader = () => {
  const { user } = useAuth();
  const { logout } = useAuthStore();

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

  const fullName = user.getFullName
    ? user.getFullName()
    : user.fullname || "Usuario";

  const initials = user.getInitials
    ? user.getInitials()
    : fullName.substring(0, 2).toUpperCase();
  const role = user.authorities?.[0]?.name || user.role || "Usuario";

  return (
    <AppShellHeader component={Flex} justify="center">
      <Flex flex={1} maw={1440} px="xl" py="xs">
        <Group>
          <TextInput
            w="400"
            type="search"
            variant="filled"
            placeholder="Buscá envíos, viajes..."
            rightSection={<IconSearch size={20} />}
          />
          <OperatingSucursalSelector />
        </Group>

        <Group ml="auto">
          <NotificacionesBell />

          <Menu position="bottom-end" withArrow width={175}>
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
