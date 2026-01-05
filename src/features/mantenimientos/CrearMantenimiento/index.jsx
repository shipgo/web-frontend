import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { Box, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";

import { mantenimientoApi } from "@api";
import MantenimientoForm from "../components/MantenimientoForm";
import dayjs from "dayjs";

const CrearMantenimiento = () => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

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

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const payload = {
          nombreMecanico: values.nombreMecanico,
          apellidoMecanico: values.apellidoMecanico,
          vehiculoID: parseInt(values.vehiculoID),
          tipoMantenimientoID: parseInt(values.tipoMantenimientoID),
          fechaHoraMantenimiento: dayjs(values.fechaHoraMantenimiento).toISOString(),
          descripcion: values.descripcion || null,
        };

        await mantenimientoApi.save(payload);

        notifications.show({
          title: "Éxito",
          message: "Mantenimiento creado correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/mantenimientos");
      } catch (error) {
        console.error("Error creando mantenimiento:", error);
        notifications.show({
          title: "Error",
          message:
            error.response?.data?.message ||
            "No se pudo crear el mantenimiento",
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
    navigate("/mantenimientos");
  }, [navigate]);

  return (
    <Stack m="auto" maw="1200" gap="lg" p="lg">
      <Card>
        <Group justify="space-between">
          <Box>
            <Title order={2}>Programar Mantenimiento</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Completa los datos para programar un nuevo mantenimiento
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
      />
    </Stack>
  );
};

export default CrearMantenimiento;
