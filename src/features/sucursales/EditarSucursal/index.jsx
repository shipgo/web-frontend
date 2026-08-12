import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Box, Card, Group, Text, Title, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX, IconArrowLeft } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import { sucursalApi } from "@api";
import SucursalForm from "../components/SucursalForm";

const EditarSucursal = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);
  const [loadingSucursal, setLoadingSucursal] = useState(true);

  const form = useForm({
    initialValues: {
      nombre: "",
      email: "",
      prefijo: "",
      telefono: "",
      nombreCalle: "",
      numeroCalle: "",
      provinciaID: null,
      localidadID: null,
    },
    validate: {
      nombre: (value) => (!value ? "Debes ingresar el nombre" : null),
      email: (value) => {
        if (!value) return "Debes ingresar el email";
        if (!/^\S+@\S+\.\S+$/.test(value)) return "El email no es válido";
        return null;
      },
      prefijo: (value) => (!value ? "Debes ingresar el prefijo" : null),
      telefono: (value) => (!value ? "Debes ingresar el teléfono" : null),
      nombreCalle: (value) => (!value ? "Debes ingresar la calle" : null),
      numeroCalle: (value) => (!value ? "Debes ingresar el número" : null),
      localidadID: (value) =>
        !value ? "Debes seleccionar una localidad" : null,
    },
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
          email: values.email,
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
        notifications.show({
          title: "Error",
          message:
            error.response?.data?.message ||
            "No se pudo actualizar la sucursal",
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [id, navigate]
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
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>Editar sucursal</Title>
          <Text c="dimmed">Modificá los datos de la sucursal</Text>
        </Box>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={handleCancel}
        >
          Volver
        </Button>
      </Group>

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
