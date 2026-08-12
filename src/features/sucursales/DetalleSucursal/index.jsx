import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Box, Button, Card, Group, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconEdit, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
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
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>{sucursal?.nombre || "Detalle de la sucursal"}</Title>
          <Text c="dimmed">Información completa de la sucursal</Text>
        </Box>
        <Group gap="xs">
          <Button
            leftSection={<IconEdit size={18} />}
            onClick={() => navigate(`~/sucursales/${id}/editar`)}
          >
            Editar
          </Button>
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => navigate("~/sucursales")}
          >
            Volver
          </Button>
        </Group>
      </Group>

      <SucursalPerfil sucursal={sucursal} />
    </PageContainer>
  );
};

export default DetalleSucursal;
