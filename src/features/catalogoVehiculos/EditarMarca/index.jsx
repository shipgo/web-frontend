import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, Text } from "@mantine/core";
import { useForm, schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { applyApiError } from "@domain/apiError";
import { marcaApi } from "../api/catalogoVehiculos.api";
import MarcaForm from "../components/MarcaForm";
import { MARCA_SCHEMA, MARCA_INITIAL_VALUES } from "../constants/schema";

const EditarMarca = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);
  const [loadingMarca, setLoadingMarca] = useState(true);

  const form = useForm({
    mode: "controlled",
    initialValues: MARCA_INITIAL_VALUES,
    validate: schemaResolver(MARCA_SCHEMA, { sync: true }),
  });

  useEffect(() => {
    const loadMarca = async () => {
      try {
        setLoadingMarca(true);
        const marca = await marcaApi.getById(id);

        form.setValues({ nombre: marca.nombre || "" });
        form.resetDirty();
      } catch (error) {
        console.error("Error cargando marca:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar la marca",
          color: "red",
          icon: <IconX />,
        });
        navigate("~/catalogo-vehiculos/marcas");
      } finally {
        setLoadingMarca(false);
      }
    };

    if (id) {
      loadMarca();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, navigate]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        await marcaApi.update(id, { nombre: values.nombre });

        notifications.show({
          title: "Éxito",
          message: "Marca actualizada correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/catalogo-vehiculos/marcas");
      } catch (error) {
        console.error("Error actualizando marca:", error);
        notifications.show({
          title: "Error",
          message: applyApiError(form, error, {
            fallbackMessage: "No se pudo actualizar la marca",
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
    navigate("~/catalogo-vehiculos/marcas");
  }, [navigate]);

  if (loadingMarca) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando marca...</Text>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Marcas"
        entidadHref="/marcas"
        accion="Editar marca"
        descripcion="Modificá el nombre de la marca"
      />

      <MarcaForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
        isEdit
      />
    </PageContainer>
  );
};

export default EditarMarca;
