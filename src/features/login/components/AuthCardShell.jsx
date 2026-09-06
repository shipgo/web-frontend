import {
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
 * (login, recuperar cuenta, reset por token). Fuerza el tema `light` igual que
 * `LoginPage` y centra una `Card` con el logo, un título y un subtítulo.
 */
const AuthCardShell = ({ title, subtitle, children }) => (
  <MantineProvider forceColorScheme="light">
    <Center mih="100svh" p="xl">
      <Card w={FORM_WIDTH} maw="100%" p="xl" withBorder shadow="sm">
        <Stack gap="lg" p="md">
          <Stack gap={4}>
            <Image src={logo} w={220} fit="contain" />
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
