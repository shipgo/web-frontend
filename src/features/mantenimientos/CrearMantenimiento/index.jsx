import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { useForm, schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { applyApiError } from "@domain/apiError";
import { mantenimientoApi } from "../api/mantenimientos.api";

import MantenimientoForm from "../components/MantenimientoForm";
import { MANTENIMIENTO_SCHEMA, INITIAL_VALUES } from "../constants/schema";
import { buildMantenimientoReqDTO } from "../utils";

const CrearMantenimiento = () => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: "controlled",
    initialValues: INITIAL_VALUES,
    validate: schemaResolver(MANTENIMIENTO_SCHEMA, { sync: true }),
  });

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const payload = buildMantenimientoReqDTO(values);
        await mantenimientoApi.save(payload);

        notifications.show({
          title: "Mantenimiento registrado",
          message: "El mantenimiento se registró correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/mantenimientos");
      } catch (error) {
        console.error("Error creando mantenimiento:", error);

        const message = applyApiError(form, error, {
          fallbackMessage: "No se pudo registrar el mantenimiento",
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
    [navigate, form],
  );

  const handleCancel = useCallback(() => {
    navigate("~/mantenimientos");
  }, [navigate]);

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Mantenimientos"
        accion="Crear mantenimiento"
        descripcion="Completá los datos para registrar un nuevo mantenimiento"
      />

      <MantenimientoForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
      />
    </PageContainer>
  );
};

export default CrearMantenimiento;
