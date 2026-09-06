import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button, Card, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { mantenimientoApi } from "../api/mantenimientos.api";

import MantenimientoPerfil from "../components/MantenimientoPerfil";

const DetalleMantenimiento = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [mantenimiento, setMantenimiento] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;
    setLoading(true);

    mantenimientoApi
      .getById(id)
      .then((data) => {
        if (!cancelled) setMantenimiento(data);
      })
      .catch((error) => {
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
