import { Link, useLocation } from "wouter";

import {
  AppShellNavbar,
  Image,
  NavLink,
  Text,
  UnstyledButton,
  useMantineColorScheme,
} from "@mantine/core";

import logo from "/src/assets/logoipsum-custom-logo.svg";
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
import { useAuth } from "@contexts/auth";
import { hasAnyRole } from "@domain/roles";

const AppNavbar = () => {
  const [location] = useLocation();
  const { toggleColorScheme, colorScheme } = useMantineColorScheme();
  const { user } = useAuth();

  const pages = PAGES.filter(({ roles }) => hasAnyRole(user, roles));
  const admin = ADMIN.filter(({ roles }) => hasAnyRole(user, roles));

  return (
    <AppShellNavbar>
      <UnstyledButton to="/" component={Link} p="md" display="flex">
        <Image src={logo} h={37} w="auto" fit="contain" mx="auto" />
      </UnstyledButton>

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

      {pages.length > 0 && (
        <>
          <Text size="xs" fw="bold" m="12" tt="uppercase">
            Gestionar
          </Text>
          {pages.map(({ label, to, icon }) => (
            <NavLink
              to={to}
              key={label}
              label={label}
              component={Link}
              leftSection={icon}
              active={location.startsWith(to)}
            />
          ))}
        </>
      )}

      {admin.length > 0 && (
        <>
          <Text size="xs" fw="bold" m="12" tt="uppercase">
            Administrar
          </Text>
          {admin.map(({ label, to, icon }) => (
            <NavLink
              to={to}
              key={label}
              label={label}
              component={Link}
              leftSection={icon}
              active={location.startsWith(to)}
            />
          ))}
        </>
      )}

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
        href="https://shipgo.gitbook.io/manual"
        leftSection={<IconBook size={18} />}
        rightSection={<IconExternalLink size={18} />}
      />
    </AppShellNavbar>
  );
};

export default AppNavbar;
