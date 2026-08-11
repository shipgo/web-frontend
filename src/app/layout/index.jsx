import { AppShell } from "@mantine/core";
import { useLocation } from "wouter";

import AppHeader from "./components/Header";
import AppNavbar from "./components/Navbar";

import { HEADER_HEIGHT_PX, NAVBAR_WIDTH_PX } from "./constants/layoutSizes";

const ROUTES_WITH_FOOTER = ['/viajes/crear', '/envios/crear'];

const Layout = ({ children }) => {
  const [location] = useLocation();
  const footerCollapsed = !ROUTES_WITH_FOOTER.includes(location);

  return (
  <AppShell
    layout="alt"
    footer={{ height: HEADER_HEIGHT_PX, collapsed: footerCollapsed }}
    navbar={{ width: NAVBAR_WIDTH_PX }}
    header={{ height: HEADER_HEIGHT_PX }}
  >
    <AppHeader />
    <AppNavbar />
    <AppShell.Main>{children}</AppShell.Main>
  </AppShell>
  );
};

export default Layout;
