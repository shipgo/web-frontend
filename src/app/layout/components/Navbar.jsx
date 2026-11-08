import { FocusTrap } from "@mantine/core";
import { Link, useLocation } from "wouter";

import {
  AppShellNavbar,
  AppShellSection,
  Avatar,
  Group,
  NavLink,
  ScrollArea,
  Stack,
  Text,
  UnstyledButton,
} from "@mantine/core";

import BrandLogo from "@components/BrandLogo";
import OperatingSucursalSelector from "@components/OperatingSucursalSelector";
import { useIsMobile } from "@hooks/useIsMobile";
import classes from "./Navbar.module.css";
import {
  IconBook,
  IconBuilding,
  IconDots,
  IconExternalLink,
  IconHome,
} from "@tabler/icons-react";

import { ADMIN, PAGES } from "../constants/items";
import { IconMap } from "@tabler/icons-react";
import { useAuth } from "@contexts/auth";
import { hasAnyRole } from "@domain/roles";
import { necesitaOnboardingEmpresa } from "@domain/empresa";
import { rolLabel } from "@domain/roles";
import { iniciales, nombreCompleto } from "@domain/usuario";

const NAV_ROW_MIN_HEIGHT = 44;

/**
 * @param {Object} props
 * @param {boolean} [props.opened] Cajón abierto (sólo relevante en mobile).
 * @param {() => void} [props.onClose] Cierra el cajón (al tocar un enlace).
 * @param {() => void} [props.onOpenUserSheet] Abre la hoja del usuario (fila fija abajo, mobile).
 */
const AppNavbar = ({ opened = false, onClose, onOpenUserSheet }) => {
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
          </>
        )}
      </AppShellSection>

      {/* Mobile: el usuario queda fijo abajo a la izquierda, siempre a la vista.
          Un toque abre la hoja con perfil, apariencia y "Cerrar sesión". */}
      {isMobile && user && (
        <AppShellSection
          pt="xs"
          px="xs"
          style={{
            borderTop: "1px solid var(--mantine-color-default-border)",
            paddingBottom: "calc(var(--mantine-spacing-xs) + env(safe-area-inset-bottom))",
          }}
        >
          <UnstyledButton
            onClick={onOpenUserSheet}
            aria-haspopup="dialog"
            aria-label={`Opciones de ${nombreCompleto(user, "Usuario")}`}
            mih={NAV_ROW_MIN_HEIGHT}
            w="100%"
            px="xs"
            data-testid="drawer-user-row"
          >
            <Group wrap="nowrap" gap="sm">
              <Avatar
                src={user.profile ? `/api${user.profile}` : undefined}
                radius="xl"
                color="colorPalette"
              >
                {iniciales(user) || "U"}
              </Avatar>
              <Stack gap={0} miw={0} style={{ flex: 1 }}>
                <Text size="sm" fw={600} truncate="end">
                  {nombreCompleto(user, "Usuario")}
                </Text>
                <Text size="xs" c="dimmed" truncate="end">
                  {rolLabel(user.authorities?.[0]?.name || user.role)}
                </Text>
              </Stack>
              <IconDots size={20} aria-hidden />
            </Group>
          </UnstyledButton>
        </AppShellSection>
      )}

      {/* Escritorio: "Manual" fijo abajo. Mobile: va dentro de la zona que
          scrollea (el usuario vive en la hoja del avatar del header). */}
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
