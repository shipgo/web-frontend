import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { Alert, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";

import { schemaResolver } from "@mantine/form";

import { applyApiError } from "@domain/apiError";
import { useAuth } from "@contexts/auth";
import { useOperatingContext } from "@contexts/operatingContext";

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

  // SHG-FE-052 — bug de backend confirmado en vivo: `POST /api/envio` resuelve
  // la sucursal de origen SIEMPRE server-side desde
  // `getCurrentUser().getSucursal()` (`EnvioService.save` → `EstadoEnvioCreado
  // .execute`, sin chequeo de null) y no acepta ningún id explícito del
  // cliente. Un SUPERUSER sin sucursal propia (caso real del seed dev,
  // usuario `super`) hace que ese `.getSucursal()` devuelva `null`, y el
  // siguiente `.getPuntoEntrega()` encadenado tira `NullPointerException` →
  // `500` (reproducido contra el backend real corriendo en dev). La
  // "sucursal operativa" del selector del header tampoco sirve de nada acá:
  // el backend la ignoraría igual. Mientras no exista soporte de backend
  // (documentado para abrir la tarea, análoga a la que haría falta en
  // `POST /api/viaje`), bloqueamos el submit para no dejar que el SUPERUSER
  // dispare ese 500 a ciegas.
  const { user } = useAuth();
  const { isSuperUser } = useOperatingContext();
  const sinSucursalPropia = isSuperUser && !user?.sucursal;

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
    if (sinSucursalPropia) return;

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
        stripPrefix: "destino",
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
          {sinSucursalPropia && (
            <Alert
              color="red"
              variant="light"
              icon={<IconAlertTriangle size={16} />}
              title="No podés crear envíos todavía"
            >
              Tu usuario de SUPERUSER no tiene una sucursal propia asignada.
              El backend no permite hoy elegir una sucursal de origen
              alternativa al crear un envío (falla con un error interno) —
              pendiente de soporte de backend. Pedile a un ADMIN que lo cargue,
              o esperá a que se resuelva.
            </Alert>
          )}
          <SeccionOrigen />
          <SeccionCarga categorias={categorias} />
        </Stack>
        <Footer
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          disableSubmit={sinSucursalPropia}
        />
      </EnvioFormProvider>
    </PageContainer>
  );
};

export default CrearEnvios;
