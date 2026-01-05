import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Box, Card, Group, Stack, Text, Title, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX, IconArrowLeft } from "@tabler/icons-react";

import { mantenimientoApi } from "@api";
import MantenimientoForm from "../components/MantenimientoForm";
import dayjs from "dayjs";

const EditarMantenimiento = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);
  const [loadingMantenimiento, setLoadingMantenimiento] = useState(true);

  const form = useForm({
    initialValues: {
      nombreMecanico: "",
      apellidoMecanico: "",
      vehiculoID: null,
      tipoMantenimientoID: null,
      fechaHoraMantenimiento: null,
      descripcion: "",
    },
    validate: {
      nombreMecanico: (value) =>
        !value ? "Debes ingresar el nombre del mecánico" : null,
      apellidoMecanico: (value) =>
        !value ? "Debes ingresar el apellido del mecánico" : null,
      vehiculoID: (value) => (!value ? "Debes seleccionar un vehículo" : null),
      tipoMantenimientoID: (value) =>
        !value ? "Debes seleccionar un tipo de mantenimiento" : null,
      fechaHoraMantenimiento: (value) =>
        !value ? "Debes seleccionar una fecha" : null,
    },
  });

  // Cargar datos del mantenimiento
  useEffect(() => {
    const loadMantenimiento = async () => {
      try {
        setLoadingMantenimiento(true);
        const mantenimiento = await mantenimientoApi.getById(id);

        form.setValues({
          nombreMecanico: mantenimiento.nombreMecanico || "",
          apellidoMecanico: mantenimiento.apellidoMecanico || "",
          vehiculoID: mantenimiento.vehiculo?.id?.toString() || null,
          tipoMantenimientoID:
            mantenimiento.tipoMantenimiento?.id?.toString() || null,
          fechaHoraMantenimiento: new Date(mantenimiento.fechaHoraMantenimiento),
          descripcion: mantenimiento.descripcion || "",
        });
      } catch (error) {
        console.error("Error cargando mantenimiento:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar el mantenimiento",
          color: "red",
          icon: <IconX />,
        });
        navigate("~/mantenimientos");
      } finally {
        setLoadingMantenimiento(false);
      }
    };

    if (id) {
      loadMantenimiento();
    }
  }, [id, navigate]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const payload = {
          nombreMecanico: values.nombreMecanico,
          apellidoMecanico: values.apellidoMecanico,
          vehiculoID: parseInt(values.vehiculoID),
          tipoMantenimientoID: parseInt(values.tipoMantenimientoID),
          fechaHoraMantenimiento: dayjs(
            values.fechaHoraMantenimiento
          ).toISOString(),
          descripcion: values.descripcion || null,
        };

        await mantenimientoApi.update(id, payload);

        notifications.show({
          title: "Éxito",
          message: "Mantenimiento actualizado correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/mantenimientos");
      } catch (error) {
        console.error("Error actualizando mantenimiento:", error);
        notifications.show({
          title: "Error",
          message:
            error.response?.data?.message ||
            "No se pudo actualizar el mantenimiento",
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
    navigate("/mantenimientos");
  }, [navigate]);

  if (loadingMantenimiento) {
    return (
      <Stack m="auto" maw="1200" gap="lg" p="lg">
        <Card>
          <Text>Cargando mantenimiento...</Text>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack m="auto" maw="1200" gap="lg" p="lg">
      <Card>
        <Group justify="space-between">
          <Box>
            <Title order={2}>Editar Mantenimiento</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Modifica los datos del mantenimiento
            </Text>
          </Box>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={18} />}
            onClick={handleCancel}
          >
            Volver
          </Button>
        </Group>
      </Card>

      <MantenimientoForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
        isEdit
      />
    </Stack>
  );
};

export default EditarMantenimiento;
