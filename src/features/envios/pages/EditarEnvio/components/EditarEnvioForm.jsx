import { useState } from "react";
import { useLocation } from "wouter";
import { Alert, Stack } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { schemaResolver } from "@mantine/form";
import { IconCheck, IconInfoCircle, IconX } from "@tabler/icons-react";

import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { applyApiError } from "@domain/apiError";
import { envioApi } from "@api";

import {
  EnvioFormProvider,
  useEnvioForm,
} from "../../CrearEnvios/contexts/CrearEnvioContext";
import { CREAR_ENVIO_SCHEMA } from "../../CrearEnvios/constants/schema";
import SeccionOrigen from "../../CrearEnvios/components/SeccionOrigen";
import SeccionCarga from "../../CrearEnvios/components/SeccionCarga";
import Footer from "../../CrearEnvios/components/Footer";
import { buildEnvioFormValues, buildEnvioReqDTO, esEnvioEnRuta } from "../../../utils";

const pickDestinoYBultos = (v) => ({
  tipoEntrega: v.tipoEntrega,
  sucursalEntregaID: v.sucursalEntregaID,
  nombreCalle: v.nombreCalle,
  numeroCalle: v.numeroCalle,
  piso: v.piso,
  departamento: v.departamento,
  provinciaID: v.provinciaID,
  localidadID: v.localidadID,
  coordenadas: v.coordenadas,
  detalleEnvios: v.detalleEnvios,
});

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
  const [errorConflicto, setErrorConflicto] = useState(null);
  // `CONTRACTS.md §16.4` (`SHG-FE-113`): con el envío en ruta sólo se editan los
  // datos de contacto; destino y bultos quedan bloqueados.
  const enRuta = esEnvioEnRuta(envio.estado);

  const form = useEnvioForm({
    mode: "controlled",
    initialValues: buildEnvioFormValues(envio),
    validate: schemaResolver(CREAR_ENVIO_SCHEMA, { sync: true }),
  });

  const handleSubmit = form.onSubmit(async (values) => {
    setIsSubmitting(true);
    setErrorConflicto(null);
    try {
      // En ruta, destino y bultos se mandan tal como vinieron del backend: aunque
      // el form los hubiera tocado, el payload no lleva cambios en ellos.
      const valuesAEnviar = enRuta
        ? { ...values, ...pickDestinoYBultos(buildEnvioFormValues(envio)) }
        : values;
      const payload = buildEnvioReqDTO(valuesAEnviar, {
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

      const message = applyApiError(form, error, {
        fallbackMessage: "No se pudo actualizar el envío",
      });
      // 409 (p. ej. estado terminal o edición no permitida en ruta, §16.4):
      // el mensaje del backend queda visible también dentro del form.
      if (error?.response?.status === 409) setErrorConflicto(message);

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
    <Stack>
      <PageBreadcrumbsHeader
        entidad="Envíos"
        accion="Editar envío"
        descripcion={`Modificá los datos del envío #${id}`}
      />

      <EnvioFormProvider form={form}>
        <Stack>
          {errorConflicto && (
            <Alert color="red" variant="light" icon={<IconX size={18} />} data-testid="error-conflicto">
              {errorConflicto}
            </Alert>
          )}
          {enRuta && (
            <Alert
              color="blue"
              variant="light"
              icon={<IconInfoCircle size={18} />}
              title="Envío en ruta"
              data-testid="aviso-envio-en-ruta"
            >
              Este envío ya está en ruta: por ahora sólo podés cambiar los datos de contacto
              (nombre, apellido, teléfono y emails). El destino y los paquetes no se pueden
              modificar.
            </Alert>
          )}
          <SeccionOrigen destinoBloqueado={enRuta} />
          <SeccionCarga categorias={categorias} bloqueada={enRuta} />
        </Stack>
        <Footer
          onSubmit={handleSubmit}
          isSubmitting={isSubmitting}
          submitLabel="Guardar cambios"
        />
      </EnvioFormProvider>
    </Stack>
  );
};

export default EditarEnvioForm;
