import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button, Card, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { sucursalApi } from "@api";
import SucursalPerfil from "../components/SucursalPerfil";

const DetalleSucursal = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [sucursal, setSucursal] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadSucursal = async () => {
      try {
        setLoading(true);
        const data = await sucursalApi.getById(id);
        setSucursal(data);
      } catch (error) {
        console.error("Error cargando sucursal:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar la información de la sucursal",
          color: "red",
          icon: <IconX />,
        });
        navigate("~/sucursales");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadSucursal();
    }
  }, [id, navigate]);

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando sucursal...</Text>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Sucursales"
        accion="Detalle de sucursal"
        descripcion={sucursal?.nombre || "Información completa de la sucursal"}
      >
        <Button
          leftSection={<IconEdit size={18} />}
          onClick={() => navigate(`~/sucursales/${id}/editar`)}
        >
          Editar
        </Button>
      </PageBreadcrumbsHeader>

      <SucursalPerfil sucursal={sucursal} />
    </PageContainer>
  );
};

export default DetalleSucursal;
