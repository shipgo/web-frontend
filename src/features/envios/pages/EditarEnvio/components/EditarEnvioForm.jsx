import { useState } from "react";
import { useLocation } from "wouter";
import { Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { schemaResolver } from "@mantine/form";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import { envioApi } from "@api";

import EnvioHeader from "../../../components/EnvioHeader";
import {
  EnvioFormProvider,
  useEnvioForm,
} from "../../CrearEnvios/contexts/CrearEnvioContext";
import { CREAR_ENVIO_SCHEMA } from "../../CrearEnvios/constants/schema";
import SeccionOrigen from "../../CrearEnvios/components/SeccionOrigen";
import SeccionCarga from "../../CrearEnvios/components/SeccionCarga";
import Footer from "../../CrearEnvios/components/Footer";
import { buildEnvioFormValues, buildEnvioReqDTO } from "../../../utils";

/**
 * Form de edición de envío. Comparte con `CrearEnvios` el `EnvioFormProvider`,
 * el schema Zod (`CREAR_ENVIO_SCHEMA`) y las secciones (`SeccionOrigen`,
 * `SeccionCarga`, `Footer`) — la única diferencia es la precarga de `values`
 * desde el envío existente (`buildEnvioFormValues`) y el `PUT` en vez de `POST`
 * (`SHG-FE-031`). El gate de estado terminal y el 404 se resuelven en el
 * componente padre (`EditarEnvio/index.jsx`).
 *
 * @param {Object} props
 * @param {string} props.id - id de ruta del envío (string, como lo espera `envioApi.update`).
 * @param {Object} props.envio - `EnvioDTO` ya cargado del backend.
 * @param {Array<{value: string, label: string}>} props.categorias
 */
const EditarEnvioForm = ({ id, envio, categorias }) => {
  const [, navigate] = useLocation();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useEnvioForm({
    mode: "controlled",
    initialValues: buildEnvioFormValues(envio),
    validate: schemaResolver(CREAR_ENVIO_SCHEMA, { sync: true }),
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      const payload = buildEnvioReqDTO(values, {
        id: envio.destino?.id ?? null,
      });

      await envioApi.update(id, payload);

      notifications.show({
        title: "Éxito",
        message: "El envío fue actualizado correctamente",
        color: "green",
        icon: <IconCheck />,
      });

      navigate("~/envios");
    } catch (error) {
      console.error("Error actualizando envío:", error);

      // 400 de validación de campos (`ApiFieldError`, `CONTRACTS.md §5`): mismo
      // patrón puntual que `SHG-FE-016`/`SHG-FE-010` (`form.setErrors` desde
      // `error.response.data.fields` + toast con `message`) hasta que exista el
      // helper global de `SHG-FE-021`. El `EnvioReqDTO` es plano, así que no hay
      // que sacarle prefijo a los `field`.
      const responseData = error?.response?.data;
      if (Array.isArray(responseData?.fields) && responseData.fields.length > 0) {
        form.setErrors(
          Object.fromEntries(
            responseData.fields.map(({ field, error: fieldError }) => [
              field,
              fieldError,
            ]),
          ),
        );
      }

      notifications.show({
        title: "Error",
        message: responseData?.message || "No se pudo actualizar el envío",
        color: "red",
        icon: <IconX />,
      });
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <PageContainer>
      <EnvioHeader
        accion="Editar envío"
        descripcion={`Modificá los datos del envío #${id}`}
      />

      <EnvioFormProvider form={form}>
        <Stack>
          <SeccionOrigen />
          <SeccionCarga categorias={categorias} />
        </Stack>
        <Footer
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Guardar cambios"
        />
      </EnvioFormProvider>
    </PageContainer>
  );
};

export default EditarEnvioForm;
