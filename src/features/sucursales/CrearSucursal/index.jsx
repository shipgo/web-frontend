import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { Box, Button, Group, Text, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import { sucursalApi } from "@api";
import SucursalForm from "../components/SucursalForm";

const CrearSucursal = () => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

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
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>Crear sucursal</Title>
          <Text c="dimmed">Completá los datos para registrar una nueva sucursal</Text>
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
      />
    </PageContainer>
  );
};

export default CrearSucursal;
