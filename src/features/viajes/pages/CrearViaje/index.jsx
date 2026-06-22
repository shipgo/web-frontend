import { Link } from "wouter";
import {
  AppShellFooter,
  Box,
  Breadcrumbs,
  Button,
  Flex,
  Text,
  Title,
} from "@mantine/core";

import PageContainer from "@components/PageContainer";

import SeccionEnvios from "./SeccionEnvios";
import SeccionRecursos from "./SeccionRecursos";
import SeccionResumen from "./SeccionResumen";
import SeccionDetalles from "./SeccionDetalles";

import EnviosFormProvider from "./contexts/EnviosFormProvider";
import Footer from "./Footer";

const CrearViaje = () => {
  return (
    <PageContainer>
      <Flex align="flex-end" gap="xs">
        <Box>
          <Breadcrumbs
            separatorMargin="sm"
            separator={<Title order={3}>/</Title>}
          >
            <Link href="/" asChild>
              <Title
                order={2}
                style={{ cursor: "pointer" }}
                c="var(--mantine-color-colorPalette-light-color)"
              >
                Viajes
              </Title>
            </Link>
            <Title order={2}>Crear nuevo viaje</Title>
          </Breadcrumbs>
          <Text c="dimmed">Completa las secciones para crear un viaje</Text>
        </Box>

        <Button variant="subtle" ml="auto">
          Necesito ayuda
        </Button>

        <Button color="red" variant="light">
          Cancelar
        </Button>
      </Flex>

      <EnviosFormProvider>
        <SeccionDetalles />
        <SeccionEnvios />
        <SeccionRecursos />
        <SeccionResumen />
        <Footer />
      </EnviosFormProvider>
    </PageContainer>
  );
};

export default CrearViaje;
