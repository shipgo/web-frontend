import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Box, Button, Card, Group, Stack, Text, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconEdit, IconX } from "@tabler/icons-react";

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
      <Stack m="auto" maw="1200" gap="lg" p="lg">
        <Card>
          <Text>Cargando mantenimiento...</Text>
        </Card>
      </Stack>
    );
  }

  const estado = mantenimiento?.estado?.toUpperCase();
  const canEdit = estado !== "COMPLETADO" && estado !== "CANCELADO";

  return (
    <Stack m="auto" maw="1200" gap="lg" p="lg">
      <Card>
        <Group justify="space-between">
          <Box>
            <Title order={2}>Detalle del Mantenimiento</Title>
            <Text size="sm" c="dimmed" mt="xs">
              Información completa del mantenimiento #{id}
            </Text>
          </Box>
          <Group>
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
      </Card>

      <MantenimientoPerfil mantenimiento={mantenimiento} />
    </Stack>
  );
};

export default DetalleMantenimiento;

