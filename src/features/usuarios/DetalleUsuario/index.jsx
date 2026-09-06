import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button, Card, Text } from "@mantine/core";
import { IconEdit, IconKey } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { usuarioApi } from "@api";
import UsuarioPerfil from "../components/UsuarioPerfil";
import { usePasswordReset } from "../hooks/usePasswordReset";

const DetalleUsuario = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const { confirmReset } = usePasswordReset();

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

  if (loading) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando usuario...</Text>
        </Card>
      </PageContainer>
    );
  }

  const nombreCompleto =
    usuario?.nombre && usuario?.apellido
      ? `${usuario.nombre} ${usuario.apellido}`
      : usuario?.username
        ? `@${usuario.username}`
        : undefined;

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Usuarios"
        accion="Detalle de usuario"
        descripcion={nombreCompleto}
      >
        <Button
          variant="light"
          color="orange"
          leftSection={<IconKey size={18} />}
          onClick={() => confirmReset(usuario)}
        >
          Resetear contraseña
        </Button>
        <Button leftSection={<IconEdit size={18} />} onClick={handleEdit}>
          Editar
        </Button>
      </PageBreadcrumbsHeader>

      <UsuarioPerfil usuario={usuario} showAllInfo={true} />
    </PageContainer>
  );
};

export default DetalleUsuario;

