import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Box, Button, Card, Group, Text, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import { vehiculoApi } from "@api";
import VehiculoForm from "../components/VehiculoForm";

const EditarVehiculo = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);
  const [loadingVehiculo, setLoadingVehiculo] = useState(true);

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

  // Cargar datos del vehículo
  useEffect(() => {
    const loadVehiculo = async () => {
      try {
        setLoadingVehiculo(true);
        const vehiculoData = await vehiculoApi.getById(id);

        form.setValues({
          patente: vehiculoData.patente || "",
          tipoVehiculoID: vehiculoData.tipoVehiculo?.id?.toString() || null,
          marcaID: vehiculoData.modelo?.marca?.id?.toString() || null,
          modeloID: vehiculoData.modelo?.id?.toString() || null,
          combustibleID: vehiculoData.combustible?.id?.toString() || null,
          tipoRuedaID: vehiculoData.tipoRueda?.id?.toString() || null,
          anioCompra: vehiculoData.anioCompra || new Date().getFullYear(),
          kilometraje: vehiculoData.kilometraje || 0,
          cantidadRuedas: vehiculoData.cantidadRuedas || 4,
          pesoMaximo: vehiculoData.pesoMaximo || 0,
          consumoPromedio: vehiculoData.consumoPromedio || 0,
        });
      } catch (error) {
        console.error("Error cargando vehículo:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar el vehículo",
          color: "red",
          icon: <IconX />,
        });
        navigate("~/vehiculos");
      } finally {
        setLoadingVehiculo(false);
      }
    };

    if (id) {
      loadVehiculo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

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

        await vehiculoApi.update(id, vehiculoData);

        notifications.show({
          title: "Vehículo actualizado",
          message: "Los cambios se guardaron correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/vehiculos");
      } catch (error) {
        console.error("Error actualizando vehículo:", error);
        notifications.show({
          title: "Error",
          message:
            error.response?.data?.message ||
            "No se pudo actualizar el vehículo",
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
    navigate("~/vehiculos");
  }, [navigate]);

  if (loadingVehiculo) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando vehículo...</Text>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>Editar vehículo</Title>
          <Text c="dimmed">Modificá los datos del vehículo {form.values.patente}</Text>
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
        isEdit={true}
      />
    </PageContainer>
  );
};

export default EditarVehiculo;

