import { useEffect } from "react";
import { AppShell, Overlay } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useLocation } from "wouter";

import AppHeader from "./components/Header";
import AppNavbar from "./components/Navbar";
import UserSheet from "./components/UserSheet";
import FooterSlotProvider from "./FooterSlotProvider";
import { useFooterSlot } from "./footerSlot";

import { HEADER_HEIGHT_PX, NAVBAR_WIDTH_PX } from "./constants/layoutSizes";

const LayoutShell = ({ children }) => {
  // El slot `AppShell.footer` se despliega mientras alguna pantalla tenga un
  // `<PageFooter>` montado (ver `FooterSlotContext` / `SHG-FE-036`). Antes esto
  // era una lista de rutas exactas (`ROUTES_WITH_FOOTER`), que dejaba el footer
  // invisible en cualquier ruta no listada (p. ej. `/envios/editar/:id`).
  const { hasFooter } = useFooterSlot();
  const [location] = useLocation();
  // Cajón de navegación en mobile (< sm): lo abre la hamburguesa del header.
  const [menuOpened, { toggle: toggleMenu, close: closeMenu }] = useDisclosure(false);
  // Hoja del usuario (mobile): la abren el avatar del header y la fila del usuario
  // fijada abajo del cajón. Al abrirla desde el cajón, éste se cierra.
  const [sheetOpened, { open: openSheet, close: closeSheet }] = useDisclosure(false);
  const openSheetFromDrawer = () => {
    closeMenu();
    openSheet();
  };

  // Se cierra al navegar...
  useEffect(() => {
    closeMenu();
  }, [location, closeMenu]);

  // ...y con Escape.
  useEffect(() => {
    if (!menuOpened) return undefined;
    const onKeyDown = (event) => {
      if (event.key === "Escape") closeMenu();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [menuOpened, closeMenu]);

  return (
    <AppShell
      layout="alt"
      footer={{ height: HEADER_HEIGHT_PX, collapsed: !hasFooter }}
      navbar={{
        width: NAVBAR_WIDTH_PX,
        breakpoint: "sm",
        collapsed: { mobile: !menuOpened },
      }}
      header={{ height: HEADER_HEIGHT_PX }}
    >
      <AppHeader
        menuOpened={menuOpened}
        onToggleMenu={toggleMenu}
        onOpenUserSheet={openSheet}
      />
      {/* Scrim del cajón: sólo mobile; tocar fuera cierra. */}
      {menuOpened && (
        <Overlay
          hiddenFrom="sm"
          fixed
          zIndex={150}
          backgroundOpacity={0.45}
          onClick={closeMenu}
          data-testid="menu-scrim"
        />
      )}
      <AppNavbar
        opened={menuOpened}
        onClose={closeMenu}
        onOpenUserSheet={openSheetFromDrawer}
      />
      <UserSheet opened={sheetOpened} onClose={closeSheet} />
      {/* minWidth 0 / clip: nada del contenido ensancha el body en mobile. */}
      <AppShell.Main style={{ minWidth: 0, overflowX: "clip" }}>{children}</AppShell.Main>
    </AppShell>
  );
};

const Layout = ({ children }) => (
  <FooterSlotProvider>
    <LayoutShell>{children}</LayoutShell>
  </FooterSlotProvider>
);

export default Layout;
