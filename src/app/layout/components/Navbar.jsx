import { FocusTrap } from "@mantine/core";
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
import OperatingSucursalSelector from "@components/OperatingSucursalSelector";
import { useIsMobile } from "@hooks/useIsMobile";
import MobileUserSection from "./MobileUserSection";
import classes from "./Navbar.module.css";
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

const NAV_ROW_MIN_HEIGHT = 44;

/**
 * @param {Object} props
 * @param {boolean} [props.opened] Cajón abierto (sólo relevante en mobile).
 * @param {() => void} [props.onClose] Cierra el cajón (al tocar un enlace).
 */
const AppNavbar = ({ opened = false, onClose }) => {
  const isMobile = useIsMobile();
  const [location] = useLocation();
  const { user } = useAuth();

  // SHG-FE-116: un SUPERUSER sin empresa sólo ve "Configurá tu empresa"; ninguna
  // sección de gestión funciona hasta que cree la empresa.
  const sinEmpresa = necesitaOnboardingEmpresa(user);

  const pages = sinEmpresa ? [] : PAGES.filter(({ roles }) => hasAnyRole(user, roles));
  const admin = sinEmpresa ? [] : ADMIN.filter(({ roles }) => hasAnyRole(user, roles));
  const perfilPath = `/usuarios/${user?.id}`;
  const mih = isMobile ? NAV_ROW_MIN_HEIGHT : undefined;
  const cerrado = isMobile && !opened;

  // Tocar cualquier enlace del cajón lo cierra (también si es la ruta actual).
  const handleClick = (event) => {
    if (isMobile && event.target.closest?.("a[href]")) onClose?.();
  };

  const manualLink = (
    <NavLink
      mih={mih}
      label="Manual"
      target="_blank"
      href="https://shipgo.gitbook.io/manual"
      leftSection={<IconBook size={18} />}
      rightSection={<IconExternalLink size={18} />}
    />
  );

  return (
    <AppShellNavbar
      id="app-navbar"
      className={classes.navbar}
      onClick={handleClick}
      aria-label="Menú principal"
      // Cerrado en mobile queda fuera de pantalla: que no reciba foco ni lectores.
      inert={cerrado || undefined}
      aria-hidden={cerrado || undefined}
    >
      <FocusTrap active={isMobile && opened}>
      <div style={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0 }}>
      {/* `alt` no vacío: sin él, el link "a" (sin texto propio, sólo el logo)
          queda sin nombre accesible — axe-core `image-alt` + `link-name`,
          crítico/serio en las 9 rutas auditadas (SHG-FE-041). */}
      <AppShellSection>
        <UnstyledButton to="/" component={Link} p="md" display="flex">
          <BrandLogo h={37} alt="ShipGo — inicio" mx="auto" />
        </UnstyledButton>
      </AppShellSection>

      {isMobile && (
        <AppShellSection px="md" pb="xs">
          <OperatingSucursalSelector />
        </AppShellSection>
      )}

      {/* SHG-FE-134: los ítems scrollean dentro del sidebar; el logo y
          "Manual" quedan fijos para que nada sea inalcanzable en ventanas bajas. */}
      <AppShellSection grow component={ScrollArea}>
        {sinEmpresa ? (
          <NavLink
              mih={mih}
            label="Configurá tu empresa"
            active
            leftSection={<IconBuilding size={18} />}
          />
        ) : (
          <>
            <NavLink
              mih={mih}
              to="/"
              label="Inicio"
              component={Link}
              active={location === "/"}
              leftSection={<IconHome size={18} />}
            />

            <NavLink
              mih={mih}
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
              Operación
            </Text>
            {pages.map(({ label, to, icon }) => (
              <NavLink
              mih={mih}
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
              Administración
            </Text>
            {admin.map(({ label, to, icon }) => (
              <NavLink
              mih={mih}
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

        {isMobile && (
          <>
            <div style={{ paddingTop: 12, paddingBottom: 4 }}>{manualLink}</div>
            <MobileUserSection />
          </>
        )}
      </AppShellSection>

      {/* Escritorio: "Manual" fijo abajo. Mobile: va dentro de la zona que
          scrollea (arriba), junto con el bloque de usuario. */}
      {!isMobile && (
        <AppShellSection pt="xl" pb="xs">
          {manualLink}
        </AppShellSection>
      )}
      </div>
      </FocusTrap>
    </AppShellNavbar>
  );
};

export default AppNavbar;
