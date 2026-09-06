import { useState } from "react";
import { useLocation } from "wouter";
import { schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { applyApiError } from "@domain/apiError";
import { vehiculoApi } from "@api";

import VehiculoForm from "../components/VehiculoForm";
import Footer from "../components/Footer";
import {
  VehiculoFormProvider,
  useVehiculoForm,
} from "../context/VehiculoFormContext";
import { VEHICULO_INITIAL_VALUES, VEHICULO_SCHEMA } from "../constants/schema";

const CrearVehiculo = () => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const form = useVehiculoForm({
    mode: "controlled",
    initialValues: VEHICULO_INITIAL_VALUES,
    validate: schemaResolver(VEHICULO_SCHEMA, { sync: true }),
  });

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
        message: applyApiError(form, error, {
          fallbackMessage: "No se pudo crear el vehículo",
        }),
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
        accion="Crear vehículo"
        descripcion="Completá los datos del nuevo vehículo"
      />

      <VehiculoFormProvider form={form}>
        <VehiculoForm />
        <Footer
          onSubmit={handleSubmit}
          isSubmitting={loading}
          submitLabel="Crear vehículo"
        />
      </VehiculoFormProvider>
    </PageContainer>
  );
};

export default CrearVehiculo;
