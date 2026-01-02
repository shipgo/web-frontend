import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button, Card, Group, Stack, Text } from "@mantine/core";
import { IconArrowLeft, IconEdit, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import { usuarioApi } from "@api";
import UsuarioPerfil from "../components/UsuarioPerfil";

const DetalleUsuario = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUsuario = async () => {
      try {
        setLoading(true);
        const data = await usuarioApi.getById(id);
        setUsuario(data);
      } catch (error) {
        console.error("Error cargando usuario:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar la información del usuario",
          color: "red",
        });
        navigate("~/usuarios");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      loadUsuario();
    }
  }, [id, navigate]);

  const handleEdit = () => {
    navigate(`~/usuarios/${id}/editar`);
  };

  const handleBack = () => {
    navigate("~/usuarios");
  };

  if (loading) {
    return (
      <Stack m="auto" maw="1400" gap="xl" p={{ base: "md", sm: "lg" }}>
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Text>Cargando información del usuario...</Text>
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

      {/* Perfil del usuario */}
      <UsuarioPerfil usuario={usuario} showAllInfo={true} />
    </Stack>
  );
};

export default DetalleUsuario;

