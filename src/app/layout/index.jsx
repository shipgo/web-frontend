import { AppShell } from "@mantine/core";

import AppHeader from "./components/Header";
import AppNavbar from "./components/Navbar";

import { HEADER_HEIGHT_PX, NAVBAR_WIDTH_PX } from "./constants/layoutSizes";

const Layout = ({ children }) => (
  <AppShell
    layout="alt"
    footer={{ height: HEADER_HEIGHT_PX }}
    navbar={{ width: NAVBAR_WIDTH_PX }}
    header={{ height: HEADER_HEIGHT_PX }}
  >
    <AppHeader />
    <AppNavbar />
    <AppShell.Main>
      <AppShell.Section grow>{children}</AppShell.Section>
    </AppShell.Main>
  </AppShell>
);

export default Layout;
