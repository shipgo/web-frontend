import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import {
  Box,
  Breadcrumbs,
  Button,
  Flex,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";

import { schemaResolver } from "@mantine/form";

import { envioApi, categoriaApi } from "@api";
import { EnvioFormProvider, useEnvioForm } from "./contexts/CrearEnvioContext";
import { CREAR_ENVIO_SCHEMA, INITIAL_VALUES } from "./constants/schema";
import SeccionOrigen from "./components/SeccionOrigen";
import SeccionCarga from "./components/SeccionCarga";
import Footer from "./components/Footer";
import { buildEnvioReqDTO } from "../../utils";

const CrearEnvios = () => {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categorias, setCategorias] = useState([]);

  const form = useEnvioForm({
    mode: "controlled",
    initialValues: INITIAL_VALUES,
    validate: schemaResolver(CREAR_ENVIO_SCHEMA, { sync: true }),
  });

  useEffect(() => {
    categoriaApi
      .getAll()
      .then((data) =>
        setCategorias(
          (data ?? []).map((c) => ({ value: String(c.id), label: c.nombre })),
        ),
      )
      .catch(() => {
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar las categorías",
          color: "red",
          icon: <IconX />,
        });
      });
  }, []);

  const handleSubmit = form.onSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const payload = buildEnvioReqDTO(values);

      const envio = await envioApi.save(payload);

      notifications.show({
        title: "Envío creado",
        message: envio?.codigoSeguimiento
          ? `Código de seguimiento: ${envio.codigoSeguimiento}`
          : "El envío se creó correctamente",
        color: "green",
        icon: <IconCheck />,
      });

      navigate(envio?.id ? `~/envios/${envio.id}` : "~/envios");
    } catch (error) {
      console.error("Error creando envío:", error);

      const data = error?.response?.data;
      const fieldErrors = data?.fieldErrors ?? data?.errors;
      if (Array.isArray(fieldErrors)) {
        fieldErrors.forEach((fieldError) => {
          const field = fieldError?.field ?? fieldError?.campo;
          const message =
            fieldError?.message ?? fieldError?.mensaje ?? fieldError?.error;
          if (field && message) form.setFieldError(field, message);
        });
      }

      notifications.show({
        title: "Error",
        message:
          data?.mensaje || data?.message || "No se pudo crear el envío",
        color: "red",
        icon: <IconX />,
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <SeccionCarga categorias={categorias} />
        </Stack>
        <Footer onSubmit={handleSubmit} isSubmitting={isSubmitting} />
      </EnvioFormProvider>
    </PageContainer>
  );
};

export default CrearEnvios;
