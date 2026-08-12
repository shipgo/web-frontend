import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Box, Button, Card, Group, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconEdit, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import { mantenimientoApi } from "@api";
import MantenimientoPerfil from "../components/MantenimientoPerfil";

const DetalleMantenimiento = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [mantenimiento, setMantenimiento] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadMantenimiento = async () => {
      try {
        setLoading(true);
        const data = await mantenimientoApi.getById(id);
        setMantenimiento(data);
      } catch (error) {
        console.error("Error cargando mantenimiento:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar la información del mantenimiento",
          color: "red",
          icon: <IconX />,
        });
        navigate("/mantenimientos");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadMantenimiento();
    }
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

  const estado = mantenimiento?.estado?.toUpperCase();
  const canEdit = estado !== "COMPLETADO" && estado !== "CANCELADO";

  return (
    <PageContainer>
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>Detalle del mantenimiento</Title>
          <Text c="dimmed">Información completa del mantenimiento</Text>
        </Box>
        <Group gap="xs">
          {canEdit && (
            <Button
              leftSection={<IconEdit size={18} />}
              onClick={() => navigate(`~/mantenimientos/${id}/editar`)}
            >
              Editar
            </Button>
          )}
          <Button
            variant="subtle"
            leftSection={<IconArrowLeft size={18} />}
            onClick={() => navigate("~/mantenimientos")}
          >
            Volver
          </Button>
        </Group>
      </Group>

      <MantenimientoPerfil mantenimiento={mantenimiento} />
    </PageContainer>
  );
};

export default DetalleMantenimiento;

