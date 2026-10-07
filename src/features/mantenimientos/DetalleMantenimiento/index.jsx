import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button, Card, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import RecursoNoEncontrado from "@components/RecursoNoEncontrado";
import { isNotFoundError } from "@utils/httpErrors";
import { mantenimientoApi } from "../api/mantenimientos.api";

import MantenimientoPerfil from "../components/MantenimientoPerfil";

const DetalleMantenimiento = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [mantenimiento, setMantenimiento] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    mantenimientoApi
      .getById(id)
      .then((data) => {
        if (!cancelled) setMantenimiento(data);
      })
      .catch((error) => {
        if (isNotFoundError(error)) {
          if (!cancelled) setNotFound(true);
          return;
        }
        console.error("Error cargando mantenimiento:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar la información del mantenimiento",
          color: "red",
          icon: <IconX />,
        });
        navigate("~/mantenimientos");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  if (notFound) {
    return (
      <PageContainer>
        <PageBreadcrumbsHeader entidad="Mantenimientos" accion="Detalle de mantenimiento" />
        <RecursoNoEncontrado recurso="Mantenimiento" listaHref="~/mantenimientos" listaLabel="Volver a mantenimientos" />
      </PageContainer>
    );
  }

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando mantenimiento...</Text>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Mantenimientos"
        accion="Detalle de mantenimiento"
        descripcion={`Información completa del mantenimiento #${id}`}
      >
        <Button
          leftSection={<IconEdit size={18} />}
          onClick={() => navigate(`~/mantenimientos/${id}/editar`)}
        >
          Editar
        </Button>
      </PageBreadcrumbsHeader>

      <MantenimientoPerfil mantenimiento={mantenimiento} />
    </PageContainer>
  );
};

export default DetalleMantenimiento;
