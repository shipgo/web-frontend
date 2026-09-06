import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, Text } from "@mantine/core";
import { useForm, schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { applyApiError } from "@domain/apiError";
import { sucursalApi } from "@api";
import SucursalForm from "../components/SucursalForm";
import { SUCURSAL_SCHEMA, SUCURSAL_INITIAL_VALUES } from "../constants/schema";

const EditarSucursal = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);
  const [loadingSucursal, setLoadingSucursal] = useState(true);

  const form = useForm({
    mode: "controlled",
    initialValues: SUCURSAL_INITIAL_VALUES,
    validate: schemaResolver(SUCURSAL_SCHEMA, { sync: true }),
  });

  // Cargar datos de la sucursal
  useEffect(() => {
    const loadSucursal = async () => {
      try {
        setLoadingSucursal(true);
        const sucursal = await sucursalApi.getById(id);
        const puntoEntrega = sucursal.puntoEntrega || {};
        const localidad = puntoEntrega.localidad || {};

        form.setValues({
          nombre: sucursal.nombre || "",
          email: sucursal.email || "",
          prefijo: sucursal.prefijo || "",
          telefono: sucursal.telefono || "",
          nombreCalle: puntoEntrega.nombreCalle || "",
          numeroCalle: puntoEntrega.numeroCalle || "",
          provinciaID: localidad.provincia?.id?.toString() || null,
          localidadID: localidad.id?.toString() || null,
        });
        form.resetDirty();
      } catch (error) {
        console.error("Error cargando sucursal:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar la sucursal",
          color: "red",
          icon: <IconX />,
        });
        navigate("~/sucursales");
      } finally {
        setLoadingSucursal(false);
      }
    };

    if (id) {
      loadSucursal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const payload = {
          nombre: values.nombre,
          // `email` es opcional (SHG-BE-008): mandamos `null` en vez de "" cuando
          // no se informó, para no persistir un string vacío.
          email: values.email?.trim() || null,
          prefijo: values.prefijo,
          telefono: values.telefono,
          puntoEntrega: {
            numeroCalle: values.numeroCalle,
            nombreCalle: values.nombreCalle,
            localidadID: parseInt(values.localidadID),
          },
        };

        await sucursalApi.update(id, payload);

        notifications.show({
          title: "Éxito",
          message: "Sucursal actualizada correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/sucursales");
      } catch (error) {
        console.error("Error actualizando sucursal:", error);
        // Ver nota en `CrearSucursal`: los `field` vienen prefijados
        // "puntoEntrega." — el helper los alinea a los nombres planos del form.
        notifications.show({
          title: "Error",
          message: applyApiError(form, error, {
            stripPrefix: "puntoEntrega",
            fallbackMessage: "No se pudo actualizar la sucursal",
          }),
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [id, navigate, form]
  );

  const handleCancel = useCallback(() => {
    navigate("~/sucursales");
  }, [navigate]);

  if (loadingSucursal) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando sucursal...</Text>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Sucursales"
        accion="Editar sucursal"
        descripcion="Modificá los datos de la sucursal"
      />

      <SucursalForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
        isEdit
      />
    </PageContainer>
  );
};

export default EditarSucursal;
