import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { useForm, schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { applyApiError } from "@domain/apiError";
import { modeloApi } from "../api/catalogoVehiculos.api";
import ModeloForm from "../components/ModeloForm";
import { MODELO_SCHEMA, MODELO_INITIAL_VALUES } from "../constants/schema";

const CrearModelo = () => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: "controlled",
    initialValues: MODELO_INITIAL_VALUES,
    validate: schemaResolver(MODELO_SCHEMA, { sync: true }),
  });

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        // `ModeloReqDTO { nombre, marcaID, anio }` — `marcaID` viene del
        // `Select` como string, `anio` del `NumberInput` como number.
        const payload = {
          nombre: values.nombre,
          marcaID: parseInt(values.marcaID),
          anio: values.anio,
        };

        await modeloApi.save(payload);

        notifications.show({
          title: "Éxito",
          message: "Modelo creado correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/catalogo-vehiculos/modelos");
      } catch (error) {
        console.error("Error creando modelo:", error);
        notifications.show({
          title: "Error",
          message: applyApiError(form, error, {
            fallbackMessage: "No se pudo crear el modelo",
          }),
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [navigate, form]
  );

  const handleCancel = useCallback(() => {
    navigate("~/catalogo-vehiculos/modelos");
  }, [navigate]);

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Modelos"
        entidadHref="/modelos"
        accion="Crear modelo"
        descripcion="Completá los datos para registrar un nuevo modelo"
      />

      <ModeloForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
      />
    </PageContainer>
  );
};

export default CrearModelo;
