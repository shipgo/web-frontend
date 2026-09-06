import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, Text } from "@mantine/core";
import { schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { vehiculoApi } from "@api";

import VehiculoForm from "../components/VehiculoForm";
import Footer from "../components/Footer";
import {
  VehiculoFormProvider,
  useVehiculoForm,
} from "../context/VehiculoFormContext";
import { VEHICULO_INITIAL_VALUES, VEHICULO_SCHEMA } from "../constants/schema";

const EditarVehiculo = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);
  const [loadingVehiculo, setLoadingVehiculo] = useState(true);

  const form = useVehiculoForm({
    mode: "controlled",
    initialValues: VEHICULO_INITIAL_VALUES,
    validate: schemaResolver(VEHICULO_SCHEMA, { sync: true }),
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
        form.resetDirty();
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

  const handleSubmit = form.onSubmit(async (values) => {
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
          error.response?.data?.message || "No se pudo actualizar el vehículo",
        color: "red",
        icon: <IconX />,
      });
    } finally {
      setLoading(false);
    }
  });

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Vehículos"
        accion="Editar vehículo"
        descripcion={
          form.values.patente
            ? `Modificá los datos del vehículo ${form.values.patente}`
            : "Modificá los datos del vehículo"
        }
      />

      {loadingVehiculo ? (
        <Card>
          <Text c="dimmed">Cargando vehículo...</Text>
        </Card>
      ) : (
        <VehiculoFormProvider form={form}>
          <VehiculoForm />
          <Footer
            onSubmit={handleSubmit}
            isSubmitting={loading}
            submitLabel="Guardar cambios"
          />
        </VehiculoFormProvider>
      )}
    </PageContainer>
  );
};

export default EditarVehiculo;
