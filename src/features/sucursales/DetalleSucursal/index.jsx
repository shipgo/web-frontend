import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconEdit, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { sucursalApi } from "@api";
import { REINTENTAR_MAS_TARDE } from "@copy/common";
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
          title: "No se pudo cargar la información de la sucursal",
          message: REINTENTAR_MAS_TARDE,
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
        primaryAction={{
          label: "Editar",
          icon: <IconEdit size={18} />,
          onClick: () => navigate(`~/sucursales/${id}/editar`),
        }}
      />

      <SucursalPerfil sucursal={sucursal} />
    </PageContainer>
  );
};

export default DetalleSucursal;
