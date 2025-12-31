import {
  ActionIcon,
  AppShellHeader,
  Avatar,
  Button,
  Flex,
  Group,
  Indicator,
  Menu,
  rem,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from "@mantine/core";

import { IconBell, IconLogout, IconSearch } from "@tabler/icons-react";

import { useAuth } from "@contexts/auth";

const AppHeader = () => {
  const { user } = useAuth();

  return (
    <AppShellHeader component={Flex} justify="center">
      <Flex flex={1} maw={1440} px="xl">
        <Group>
          <TextInput
            w="400"
            type="search"
            radius="xl"
            variant="filled"
            placeholder="Buscá envíos, viajes..."
            rightSection={<IconSearch size={20} />}
          />
        </Group>

        <Group ml="auto" gap="xs">
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
            <Menu.Target>
              <Button
                pr="0"
                size="lg"
                variant="transparent"
                rightSection={
                  <Avatar
                    radius="xl"
                    color="colorPalette"
                    name={user.fullname}
                  />
                }
                leftSection={
                  <Stack gap={0} ta="right" maw={300}>
                    <Text fw={600} size="sm" truncate="end">
                      {user.fullname}
                    </Text>
                    <Text size="xs" c="gray">
                      {user.role}
                    </Text>
                  </Stack>
                }
              />
            </Menu.Target>

            <Menu.Dropdown>
              <Menu.Item
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
