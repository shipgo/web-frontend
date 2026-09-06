import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button, Card, Text } from "@mantine/core";
import { IconEdit } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { vehiculoApi } from "@api";

import VehiculoPerfil from "../components/VehiculoPerfil";

const DetalleVehiculo = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [vehiculo, setVehiculo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVehiculo = async () => {
      try {
        setLoading(true);
        const data = await vehiculoApi.getById(id);
        setVehiculo(data);
      } catch (error) {
        console.error("Error cargando vehículo:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar la información del vehículo",
          color: "red",
        });
        navigate("~/vehiculos");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadVehiculo();
    }
  }, [id, navigate]);

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Vehículos"
        accion="Detalle de vehículo"
        descripcion={vehiculo ? `Patente ${vehiculo.patente}` : undefined}
      >
        <Button
          leftSection={<IconEdit size={18} />}
          onClick={() => navigate(`~/vehiculos/${id}/editar`)}
        >
          Editar
        </Button>
      </PageBreadcrumbsHeader>

      {loading ? (
        <Card>
          <Text c="dimmed">Cargando vehículo...</Text>
        </Card>
      ) : (
        <VehiculoPerfil vehiculo={vehiculo} showAllInfo={true} />
      )}
    </PageContainer>
  );
};

export default DetalleVehiculo;
