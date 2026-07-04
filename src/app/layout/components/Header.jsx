import {
  ActionIcon,
  AppShellHeader,
  Avatar,
  Flex,
  Group,
  Indicator,
  Menu,
  rem,
  TextInput,
  Tooltip,
} from "@mantine/core";

import { IconBell, IconLogout, IconSearch } from "@tabler/icons-react";

import { useAuth } from "@contexts/auth";
import { useLocation } from "wouter";

const AppHeader = () => {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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
        </Group>

        <Group ml="auto">
          <Tooltip label="Notificaciones">
            <Indicator inline size={12} offset={5} processing>
              <ActionIcon
                size="input-sm"
                variant="subtle"
                aria-label="Notificaciones"
              >
                <IconBell size={24} />
              </ActionIcon>
            </Indicator>
          </Tooltip>

          <Menu position="bottom-end" withArrow width={175}>
            <Menu.Target style={{ cursor: "pointer" }}>
              <Avatar radius="xl" color="colorPalette" name={user.fullname} />
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
