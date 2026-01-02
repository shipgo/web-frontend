import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { IconArrowLeft, IconEdit } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

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
      <Stack m="auto" maw="1400" gap="xl" p={{ base: "md", sm: "lg" }}>
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Text>Cargando información del vehículo...</Text>
        </Card>
      </Stack>
    );
  }

  return (
    <Stack m="auto" maw="1400" gap="xl" p={{ base: "md", sm: "lg" }}>
      {/* Header con acciones */}
      <Card shadow="sm" p="lg" radius="md" withBorder>
        <Group justify="space-between" wrap="wrap">
          <Button
            variant="light"
            leftSection={<IconArrowLeft size={18} />}
            onClick={handleBack}
          >
            Volver al listado
          </Button>

          <Group gap="sm">
            <Button
              variant="light"
              color="blue"
              leftSection={<IconEdit size={18} />}
              onClick={handleEdit}
            >
              Editar
            </Button>
          </Group>
        </Group>
      </Card>

      {/* Perfil del vehículo */}
      <VehiculoPerfil vehiculo={vehiculo} showAllInfo={true} />
    </Stack>
  );
};

export default DetalleVehiculo;

