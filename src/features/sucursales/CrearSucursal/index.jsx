import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { useForm, schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { sucursalApi } from "@api";
import SucursalForm from "../components/SucursalForm";
import { SUCURSAL_SCHEMA, SUCURSAL_INITIAL_VALUES } from "../constants/schema";

const CrearSucursal = () => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: "controlled",
    initialValues: SUCURSAL_INITIAL_VALUES,
    validate: schemaResolver(SUCURSAL_SCHEMA, { sync: true }),
  });

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const payload = {
          nombre: values.nombre,
          email: values.email,
          prefijo: values.prefijo,
          telefono: values.telefono,
          puntoEntrega: {
            numeroCalle: values.numeroCalle,
            nombreCalle: values.nombreCalle,
            localidadID: parseInt(values.localidadID),
          },
        };

        await sucursalApi.save(payload);

        notifications.show({
          title: "Éxito",
          message: "Sucursal creada correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/sucursales");
      } catch (error) {
        console.error("Error creando sucursal:", error);
        notifications.show({
          title: "Error",
          message:
            error.response?.data?.message || "No se pudo crear la sucursal",
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [navigate]
  );

  const handleCancel = useCallback(() => {
    navigate("~/sucursales");
  }, [navigate]);

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Sucursales"
        accion="Crear sucursal"
        descripcion="Completá los datos para registrar una nueva sucursal"
      />

      <SucursalForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
      />
    </PageContainer>
  );
};

export default CrearSucursal;
