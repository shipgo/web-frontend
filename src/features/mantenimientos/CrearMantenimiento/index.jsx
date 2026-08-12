import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { Box, Button, Group, Text, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
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
    <PageContainer>
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>Programar mantenimiento</Title>
          <Text c="dimmed">Completá los datos para programar un nuevo mantenimiento</Text>
        </Box>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={handleCancel}
        >
          Volver
        </Button>
      </Group>

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
