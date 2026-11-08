import { useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Button, Card, Text } from "@mantine/core";
import { IconEdit, IconKey } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import StickyActionBar from "@components/StickyActionBar";
import { useIsMobile } from "@hooks/useIsMobile";
import { usuarioApi } from "@api";
import { useAuthStore } from "@stores/auth.store";
import { canManageUsuario } from "../utils";
import { nombreCompleto } from "@domain/usuario";
import { REINTENTAR_MAS_TARDE } from "@copy/common";
import UsuarioPerfil from "../components/UsuarioPerfil";
import { usePasswordReset } from "../hooks/usePasswordReset";

const DetalleUsuario = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const isMobile = useIsMobile();
  const { confirmReset } = usePasswordReset();
  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    const loadUsuario = async () => {
      try {
        setLoading(true);
        const data = await usuarioApi.getById(id);
        setUsuario(data);
      } catch (error) {
        console.error("Error cargando usuario:", error);
        notifications.show({
          title: "No se pudo cargar la información del usuario",
          message: REINTENTAR_MAS_TARDE,
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

  const puedeGestionar = canManageUsuario(currentUser, usuario);

  const descripcion =
    usuario?.nombre || usuario?.apellido
      ? nombreCompleto(usuario)
      : usuario?.username
        ? `@${usuario.username}`
        : undefined;

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Usuarios"
        accion="Detalle de usuario"
        descripcion={descripcion}
      >
        {!isMobile && puedeGestionar && (
          <Button
            variant="light"
            color="orange"
            leftSection={<IconKey size={18} />}
            onClick={() => confirmReset(usuario)}
          >
            Restablecer contraseña
          </Button>
        )}
        {!isMobile && puedeGestionar && (
          <Button leftSection={<IconEdit size={18} />} onClick={handleEdit}>
            Editar
          </Button>
        )}
      </PageBreadcrumbsHeader>

      <UsuarioPerfil usuario={usuario} showAllInfo={true} />

      {isMobile && puedeGestionar && (
        <StickyActionBar
          label="Editar"
          icon={<IconEdit size={18} />}
          onClick={handleEdit}
          actions={[
            {
              label: "Restablecer contraseña",
              icon: <IconKey size={18} />,
              color: "orange",
              onClick: () => confirmReset(usuario),
            },
          ]}
        />
      )}
    </PageContainer>
  );
};

export default DetalleUsuario;

