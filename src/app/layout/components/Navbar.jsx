import { Link, useLocation } from "wouter";

import {
  AppShellNavbar,
  Button,
  NavLink,
  Text,
  useMantineColorScheme,
} from "@mantine/core";
import {
  IconBook,
  IconExternalLink,
  IconHome,
  IconMoonStars,
  IconSettings,
  IconSun,
} from "@tabler/icons-react";

import { ADMIN, PAGES } from "../constants/items";
import { IconMap } from "@tabler/icons-react";

const AppNavbar = () => {
  const [location] = useLocation();
  const { toggleColorScheme, colorScheme } = useMantineColorScheme();

  return (
    <AppShellNavbar>
      <Button
        h="70"
        to="/"
        size="xl"
        radius="0"
        variant="subtle"
        component={Link}
      >
        ShipGo!
      </Button>

      <NavLink
        to="/"
        label="Home"
        component={Link}
        active={location === "/"}
        leftSection={<IconHome size={18} />}
      />

      <NavLink
        to="/mapa"
        label="Mapa"
        component={Link}
        active={location.startsWith("/mapa")}
        leftSection={<IconMap size={18} />}
      />

      <Text size="xs" fw="bold" m="12" tt="uppercase">
        Gestionar
      </Text>
      {PAGES.map(({ label, to, icon }) => (
        <NavLink
          to={to}
          key={label}
          label={label}
          component={Link}
          leftSection={icon}
          active={location.startsWith(to)}
        />
      ))}

      <Text size="xs" fw="bold" m="12" tt="uppercase">
        Administrar
      </Text>
      {ADMIN.map(({ label, to, icon }) => (
        <NavLink
          to={to}
          key={label}
          label={label}
          component={Link}
          leftSection={icon}
        />
      ))}

      <NavLink
        mt="auto"
        to="/opciones"
        label="Opciones"
        component={Link}
        leftSection={<IconSettings size={18} />}
      />

      <NavLink
        onClick={toggleColorScheme}
        label={colorScheme === "dark" ? "Modo oscuro" : "Modo claro"}
        leftSection={
          colorScheme === "dark" ? (
            <IconMoonStars size={18} />
          ) : (
            <IconSun size={18} />
          )
        }
      />

      <NavLink
        label="Manual"
        target="_blank"
        href="//www.sgoogle.com.ar"
        leftSection={<IconBook size={18} />}
        rightSection={<IconExternalLink size={18} />}
      />
    </AppShellNavbar>
  );
};

export default AppNavbar;
