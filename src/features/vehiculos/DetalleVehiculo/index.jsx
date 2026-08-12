import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button, Card, Group, Text } from "@mantine/core";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import PageContainer from "@components/PageContainer";
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

  const handleEdit = () => {
    navigate(`~/vehiculos/${id}/editar`);
  };

  const handleBack = () => {
    navigate("~/vehiculos");
  };

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando vehículo...</Text>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Group justify="space-between" align="flex-end">
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={handleBack}
        >
          Volver
        </Button>

        <Button leftSection={<IconEdit size={18} />} onClick={handleEdit}>
          Editar
        </Button>
      </Group>

      <VehiculoPerfil vehiculo={vehiculo} showAllInfo={true} />
    </PageContainer>
  );
};

export default DetalleVehiculo;

