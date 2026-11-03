import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, Text } from "@mantine/core";
import { useForm, schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { applyApiError } from "@domain/apiError";
import { REINTENTAR_MAS_TARDE } from "@copy/common";
import { modeloApi } from "../api/catalogoVehiculos.api";
import ModeloForm from "../components/ModeloForm";
import { MODELO_SCHEMA, MODELO_INITIAL_VALUES } from "../constants/schema";

const EditarModelo = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);
  const [loadingModelo, setLoadingModelo] = useState(true);

  const form = useForm({
    mode: "controlled",
    initialValues: MODELO_INITIAL_VALUES,
    validate: schemaResolver(MODELO_SCHEMA, { sync: true }),
  });

  useEffect(() => {
    const loadModelo = async () => {
      try {
        setLoadingModelo(true);
        const modelo = await modeloApi.getById(id);

        form.setValues({
          nombre: modelo.nombre || "",
          marcaID: modelo.marca?.id?.toString() || null,
          anio: modelo.anio ?? MODELO_INITIAL_VALUES.anio,
        });
        form.resetDirty();
      } catch (error) {
        console.error("Error cargando modelo:", error);
        notifications.show({
          title: "No se pudo cargar el modelo",
          message: REINTENTAR_MAS_TARDE,
          color: "red",
          icon: <IconX />,
        });
        navigate("~/catalogo-vehiculos/modelos");
      } finally {
        setLoadingModelo(false);
      }
    };

    if (id) {
      loadModelo();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        const payload = {
          nombre: values.nombre,
          marcaID: parseInt(values.marcaID),
          anio: values.anio,
        };

        await modeloApi.update(id, payload);

        notifications.show({
          title: "Modelo actualizado",
          message: "El modelo se actualizó correctamente.",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/catalogo-vehiculos/modelos");
      } catch (error) {
        console.error("Error actualizando modelo:", error);
        notifications.show({
          title: "No se pudo actualizar el modelo",
          message: applyApiError(form, error, {
            fallbackMessage: REINTENTAR_MAS_TARDE,
          }),
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [id, navigate, form]
  );

  const handleCancel = useCallback(() => {
    navigate("~/catalogo-vehiculos/modelos");
  }, [navigate]);

  if (loadingModelo) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando modelo...</Text>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Modelos"
        entidadHref="/modelos"
        accion="Editar modelo"
        descripcion="Modificá los datos del modelo"
      />

      <ModeloForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
        isEdit
      />
    </PageContainer>
  );
};

export default EditarModelo;
