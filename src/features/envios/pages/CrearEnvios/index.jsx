import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";

import { schemaResolver } from "@mantine/form";

import { applyApiError } from "@domain/apiError";

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

      const message = applyApiError(form, error, {
        fallbackMessage: "No se pudo crear el envío",
      });

      notifications.show({
        title: "Error",
        message,
        color: "red",
        icon: <IconX />,
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Envíos"
        accion="Crear nuevo envío"
        descripcion="Completá las secciones para registrar un envío"
      />

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
