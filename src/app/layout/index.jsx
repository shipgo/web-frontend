import { AppShell } from "@mantine/core";

import AppHeader from "./components/Header";
import AppNavbar from "./components/Navbar";
import FooterSlotProvider from "./FooterSlotProvider";
import { useFooterSlot } from "./footerSlot";

import { HEADER_HEIGHT_PX, NAVBAR_WIDTH_PX } from "./constants/layoutSizes";

const LayoutShell = ({ children }) => {
  // El slot `AppShell.footer` se despliega mientras alguna pantalla tenga un
  // `<PageFooter>` montado (ver `FooterSlotContext` / `SHG-FE-036`). Antes esto
  // era una lista de rutas exactas (`ROUTES_WITH_FOOTER`), que dejaba el footer
  // invisible en cualquier ruta no listada (p. ej. `/envios/editar/:id`).
  const { hasFooter } = useFooterSlot();

  return (
    <AppShell
      layout="alt"
      footer={{ height: HEADER_HEIGHT_PX, collapsed: !hasFooter }}
      navbar={{ width: NAVBAR_WIDTH_PX }}
      header={{ height: HEADER_HEIGHT_PX }}
    >
      <AppHeader />
      <AppNavbar />
      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};

const Layout = ({ children }) => (
  <FooterSlotProvider>
    <LayoutShell>{children}</LayoutShell>
  </FooterSlotProvider>
);

export default Layout;
