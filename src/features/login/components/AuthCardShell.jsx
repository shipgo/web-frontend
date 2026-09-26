import { Link } from "wouter";
import {
  Anchor,
  Card,
  Center,
  Image,
  MantineProvider,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import logo from "/src/assets/logoipsum-custom-logo.svg";

const FORM_WIDTH = "32rem";

/**
 * Contenedor visual compartido por las pantallas públicas de autenticación
 * (login, recuperar cuenta, reset por token). Fuerza tema `light` porque estas
 * vistas tienen un fondo/logo de marca fijo que no fue diseñado para dark mode.
 * Es un patrón igual al de Landing — vistas públicas sin autenticación que
 * contrastan con las rutas autenticadas (SHG-FE-061). Rediseñar para dark mode
 * sería una tarea de diseño aparte, fuera del alcance de SHG-FE-062.
 * Centra una `Card` con el logo, un título y un subtítulo.
 */
const AuthCardShell = ({ title, subtitle, children }) => (
  <MantineProvider forceColorScheme="light">
    <Center mih="100svh" p="xl">
      <Card w={FORM_WIDTH} maw="100%" p="xl" withBorder shadow="sm">
        <Stack gap="lg" p="md">
          <Stack gap={4}>
            {/* SHG-FE-100: el logo no linkeaba a `/` acá (sí en `LoginPage`) —
                mismo `Anchor` que usa el login para que sea consistente. */}
            <Anchor component={Link} href="/" aria-label="ShipGo — inicio" w={220}>
              <Image src={logo} alt="ShipGo logo" w={220} fit="contain" />
            </Anchor>
            <Title order={1}>{title}</Title>
            {subtitle ? <Text c="dimmed">{subtitle}</Text> : null}
          </Stack>
          {children}
        </Stack>
      </Card>
    </Center>
  </MantineProvider>
);

export default AuthCardShell;
