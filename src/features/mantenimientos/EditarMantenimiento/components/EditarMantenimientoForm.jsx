import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { useForm, schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { applyApiError } from "@domain/apiError";
import { mantenimientoApi } from "../../api/mantenimientos.api";

import MantenimientoForm from "../../components/MantenimientoForm";
import { MANTENIMIENTO_SCHEMA } from "../../constants/schema";
import {
  buildMantenimientoFormValues,
  buildMantenimientoReqDTO,
} from "../../utils";

/**
 * Comparte con `CrearMantenimiento` el `MantenimientoForm`, el schema Zod
 * (`MANTENIMIENTO_SCHEMA`, vía `schemaResolver`) y el builder del payload
 * (`buildMantenimientoReqDTO`). Diferencias: precarga con
 * `buildMantenimientoFormValues` y `PUT` en vez de `POST`.
 *
 * `fechaHoraRegistro` se reenvía explícitamente: el `update` del backend hace
 * `modelMapper.map(reqDTO, entidad)`, que pisaría `fechaHoraRegistro` con `null`
 * si no se manda (mismo riesgo que documentó `SHG-FE-010` para `ViajeReqDTO`).
 */
const EditarMantenimientoForm = ({ id, mantenimiento }) => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: "controlled",
    initialValues: buildMantenimientoFormValues(mantenimiento),
    validate: schemaResolver(MANTENIMIENTO_SCHEMA, { sync: true }),
  });

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const payload = buildMantenimientoReqDTO(values, {
          fechaHoraRegistro: mantenimiento.fechaHoraRegistro,
        });
        await mantenimientoApi.update(id, payload);

        notifications.show({
          title: "Mantenimiento actualizado",
          message: "Los cambios se guardaron correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/mantenimientos");
      } catch (error) {
        console.error("Error actualizando mantenimiento:", error);

        const message = applyApiError(form, error, {
          fallbackMessage: "No se pudo actualizar el mantenimiento",
        });

        notifications.show({
          title: "Error",
          message,
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [id, navigate, form, mantenimiento.fechaHoraRegistro],
  );

  const handleCancel = useCallback(() => {
    navigate("~/mantenimientos");
  }, [navigate]);

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Mantenimientos"
        accion="Editar mantenimiento"
        descripcion={`Modificá los datos del mantenimiento #${id}`}
      />

      <MantenimientoForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
        isEdit
      />
    </PageContainer>
  );
};

export default EditarMantenimientoForm;
