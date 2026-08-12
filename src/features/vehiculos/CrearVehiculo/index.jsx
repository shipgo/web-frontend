import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { Box, Button, Group, Text, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import { vehiculoApi } from "@api";
import VehiculoForm from "../components/VehiculoForm";

const CrearVehiculo = () => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: {
      patente: "",
      tipoVehiculoID: null,
      marcaID: null,
      modeloID: null,
      combustibleID: null,
      tipoRuedaID: null,
      anioCompra: new Date().getFullYear(),
      kilometraje: 0,
      cantidadRuedas: 4,
      pesoMaximo: 0,
      consumoPromedio: 0,
    },
    validate: {
      patente: (value) =>
        !value ? "El campo patente no puede estar vacío" : null,
      tipoVehiculoID: (value) =>
        !value ? "Debe seleccionar un tipo de vehículo" : null,
      modeloID: (value) => (!value ? "Debe seleccionar un modelo" : null),
      combustibleID: (value) =>
        !value ? "Debe seleccionar un combustible" : null,
      tipoRuedaID: (value) =>
        !value ? "Debe seleccionar un tipo de rueda" : null,
      anioCompra: (value) => {
        if (!value) return "El campo año de compra no puede estar vacío";
        if (value < 1900) return "El año debe ser mayor a 1900";
        if (value > new Date().getFullYear())
          return "El año no puede ser mayor al actual";
        return null;
      },
      kilometraje: (value) => {
        if (value === null || value === undefined)
          return "El campo kilometraje no puede estar vacío";
        if (value < 0) return "El kilometraje debe ser mayor o igual a 0";
        return null;
      },
      cantidadRuedas: (value) => {
        if (!value) return "El campo cantidad de ruedas no puede estar vacío";
        if (value < 2) return "La cantidad de ruedas debe ser mayor a 2";
        return null;
      },
      pesoMaximo: (value) => {
        if (value === null || value === undefined)
          return "El campo peso máximo no puede estar vacío";
        if (value <= 0) return "El peso máximo debe ser mayor a 0";
        return null;
      },
      consumoPromedio: (value) => {
        if (value === null || value === undefined)
          return "El campo consumo promedio no puede estar vacío";
        if (value <= 0) return "El consumo promedio debe ser mayor a 0";
        return null;
      },
    },
  });

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const vehiculoData = {
          patente: values.patente,
          tipoVehiculoID: parseInt(values.tipoVehiculoID),
          modeloID: parseInt(values.modeloID),
          combustibleID: parseInt(values.combustibleID),
          tipoRuedaID: parseInt(values.tipoRuedaID),
          anioCompra: parseInt(values.anioCompra),
          kilometraje: parseInt(values.kilometraje),
          cantidadRuedas: parseInt(values.cantidadRuedas),
          pesoMaximo: parseFloat(values.pesoMaximo),
          consumoPromedio: parseFloat(values.consumoPromedio),
        };

        await vehiculoApi.save(vehiculoData);

        notifications.show({
          title: "Vehículo creado",
          message: "El vehículo se creó correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/vehiculos");
      } catch (error) {
        console.error("Error creando vehículo:", error);
        notifications.show({
          title: "Error",
          message:
            error.response?.data?.message || "No se pudo crear el vehículo",
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
    navigate("~/vehiculos");
  }, [navigate]);

  return (
    <PageContainer>
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>Crear vehículo</Title>
          <Text c="dimmed">Completá los datos del nuevo vehículo</Text>
        </Box>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={handleCancel}
        >
          Volver
        </Button>
      </Group>

      <VehiculoForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
        isEdit={false}
      />
    </PageContainer>
  );
};

export default CrearVehiculo;

