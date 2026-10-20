import { Link, useLocation } from "wouter";

import {
  AppShellNavbar,
  AppShellSection,
  NavLink,
  ScrollArea,
  Text,
  UnstyledButton,
} from "@mantine/core";

import BrandLogo from "@components/BrandLogo";
import {
  IconBook,
  IconBuilding,
  IconExternalLink,
  IconHome,
} from "@tabler/icons-react";

import { ADMIN, PAGES } from "../constants/items";
import { IconMap } from "@tabler/icons-react";
import { useAuth } from "@contexts/auth";
import { hasAnyRole } from "@domain/roles";
import { necesitaOnboardingEmpresa } from "@domain/empresa";

const AppNavbar = () => {
  const [location] = useLocation();
  const { user } = useAuth();

  // SHG-FE-116: un SUPERUSER sin empresa sólo ve "Configurá tu empresa"; ninguna
  // sección de gestión funciona hasta que cree la empresa.
  const sinEmpresa = necesitaOnboardingEmpresa(user);

  const pages = sinEmpresa ? [] : PAGES.filter(({ roles }) => hasAnyRole(user, roles));
  const admin = sinEmpresa ? [] : ADMIN.filter(({ roles }) => hasAnyRole(user, roles));
  const perfilPath = `/usuarios/${user?.id}`;

  return (
    <AppShellNavbar>
      {/* `alt` no vacío: sin él, el link "a" (sin texto propio, sólo el logo)
          queda sin nombre accesible — axe-core `image-alt` + `link-name`,
          crítico/serio en las 9 rutas auditadas (SHG-FE-041). */}
      <AppShellSection>
        <UnstyledButton to="/" component={Link} p="md" display="flex">
          <BrandLogo h={37} alt="ShipGo — inicio" mx="auto" />
        </UnstyledButton>
      </AppShellSection>

      {/* SHG-FE-134: los ítems scrollean dentro del sidebar; el logo y
          "Manual" quedan fijos para que nada sea inalcanzable en ventanas bajas. */}
      <AppShellSection grow component={ScrollArea}>
        {sinEmpresa ? (
          <NavLink
            label="Configurá tu empresa"
            active
            leftSection={<IconBuilding size={18} />}
          />
        ) : (
          <>
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
          </>
        )}

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
                // El perfil propio (/usuarios/:id) cuelga de /usuarios pero se abre
              // desde el menú del avatar: "Usuarios" no debe marcarse ahí.
              active={location.startsWith(to) && location !== perfilPath}
              />
            ))}
          </>
        )}
      </AppShellSection>

      <AppShellSection pt="xl" pb="xs">
        <NavLink
          label="Manual"
          target="_blank"
          href="https://shipgo.gitbook.io/manual"
          leftSection={<IconBook size={18} />}
          rightSection={<IconExternalLink size={18} />}
        />
      </AppShellSection>
    </AppShellNavbar>
  );
};

export default AppNavbar;
