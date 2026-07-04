import { useState } from "react";
import { Link } from "wouter";
import {
  Box,
  Breadcrumbs,
  Button,
  Flex,
  Stack,
  Text,
  Title,
} from "@mantine/core";

import PageContainer from "@components/PageContainer";

import { schemaResolver } from "@mantine/form";

import { EnvioFormProvider, useEnvioForm } from "./contexts/CrearEnvioContext";
import { CREAR_ENVIO_SCHEMA, INITIAL_VALUES } from "./constants/schema";
import SeccionOrigen from "./components/SeccionOrigen";
import SeccionCarga from "./components/SeccionCarga";
import Footer from "./components/Footer";

const CrearEnvios = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useEnvioForm({
    mode: "controlled",
    initialValues: INITIAL_VALUES,
    validate: schemaResolver(CREAR_ENVIO_SCHEMA, { sync: true }),
  });

  const handleSubmit = form.onSubmit(() => {
    setIsSubmitting(true);
    // TODO: conectar con API
    setTimeout(() => setIsSubmitting(false), 2000);
  });

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
                Envíos
              </Title>
            </Link>
            <Title order={2}>Crear nuevo envío</Title>
          </Breadcrumbs>
          <Text c="dimmed">Completá las secciones para registrar un envío</Text>
        </Box>

        <Button
          variant="subtle"
          ml="auto"
          component="a"
          href="https://shipgo.gitbook.io/manual"
          target="_blank"
        >
          Necesito ayuda
        </Button>
      </Flex>

      <EnvioFormProvider form={form}>
        <Stack>
          <SeccionOrigen />
          <SeccionCarga />
        </Stack>
        <Footer onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </EnvioFormProvider>
    </PageContainer>
  );
};

export default CrearEnvios;
