import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { useForm, schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { applyApiError } from "@domain/apiError";
import { marcaApi } from "../api/catalogoVehiculos.api";
import MarcaForm from "../components/MarcaForm";
import { MARCA_SCHEMA, MARCA_INITIAL_VALUES } from "../constants/schema";

const CrearMarca = () => {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);

  const form = useForm({
    mode: "controlled",
    initialValues: MARCA_INITIAL_VALUES,
    validate: schemaResolver(MARCA_SCHEMA, { sync: true }),
  });

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        await marcaApi.save({ nombre: values.nombre });

        notifications.show({
          title: "Marca creada",
          message: "La marca se creó correctamente.",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/catalogo-vehiculos/marcas");
      } catch (error) {
        console.error("Error creando marca:", error);
        notifications.show({
          title: "No se pudo crear la marca",
          message: applyApiError(form, error, {
            fallbackMessage: "Probá de nuevo en unos minutos.",
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
    navigate("~/catalogo-vehiculos/marcas");
  }, [navigate]);

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Marcas"
        entidadHref="/marcas"
        accion="Crear marca"
        descripcion="Completá el nombre para registrar una nueva marca"
      />

      <MarcaForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
      />
    </PageContainer>
  );
};

export default CrearMarca;
