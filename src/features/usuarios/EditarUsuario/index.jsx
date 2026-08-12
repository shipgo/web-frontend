import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Box, Button, Card, Group, Text, Title } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import { usuarioApi } from "@api";
import UsuarioForm from "../components/UsuarioForm";

const EditarUsuario = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);

  const form = useForm({
    initialValues: {
      username: "",
      nombre: "",
      apellido: "",
      fechaNacimiento: null,
      prefijo: "",
      telefono: "",
      nombreCalle: "",
      numeroCalle: "",
      email: "",
      sucursalID: null,
      authorities: [],
      dni: "",
      tipoDocumentoID: null,
      sexoID: null,
      localidadID: null,
      provinciaID: null,
    },
    validate: {
      username: (value) =>
        !value ? "El campo username no puede estar vacío" : null,
      nombre: (value) =>
        !value ? "El campo nombre no puede estar vacío" : null,
      apellido: (value) =>
        !value ? "El campo apellido no puede estar vacío" : null,
      fechaNacimiento: (value) =>
        !value ? "El campo fecha de nacimiento no puede estar vacío" : null,
      prefijo: (value) =>
        !value ? "El campo prefijo no puede estar vacío" : null,
      telefono: (value) =>
        !value ? "El campo teléfono no puede estar vacío" : null,
      nombreCalle: (value) =>
        !value ? "El campo nombre de calle no puede estar vacío" : null,
      numeroCalle: (value) =>
        !value ? "El campo número de calle no puede estar vacío" : null,
      email: (value) => {
        if (!value) return "El campo email no puede estar vacío";
        if (!/^\S+@\S+\.\S+$/.test(value)) return "El email no es válido";
        return null;
      },
      authorities: (value) =>
        !value || value.length === 0
          ? "Debe seleccionar al menos un rol"
          : null,
      dni: (value) => (!value ? "El campo DNI no puede estar vacío" : null),
      tipoDocumentoID: (value) =>
        !value ? "Debe seleccionar un tipo de documento" : null,
      sexoID: (value) => (!value ? "Debe seleccionar un sexo" : null),
      localidadID: (value) =>
        !value ? "Debe seleccionar una localidad" : null,
    },
  });

  // Cargar datos del usuario
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoadingUser(true);
        const userData = await usuarioApi.getById(id);

        // Parsear fecha de nacimiento
        let fechaNacimiento = null;
        if (userData.fechaNacimiento) {
          fechaNacimiento = new Date(userData.fechaNacimiento);
        }

        // Extraer authorities como array de strings
        const authorities = (userData.authorities || []).map(
          (auth) => auth.name || auth.authority || auth
        );

        form.setValues({
          username: userData.username || "",
          nombre: userData.nombre || "",
          apellido: userData.apellido || "",
          fechaNacimiento,
          prefijo: userData.prefijo || "+54",
          telefono: userData.telefono || "",
          nombreCalle: userData.nombreCalle || "",
          numeroCalle: userData.numeroCalle || "",
          email: userData.email || "",
          sucursalID: userData.sucursal?.id?.toString() || null,
          authorities,
          dni: userData.dni || "",
          tipoDocumentoID: userData.tipoDocumento?.id?.toString() || null,
          sexoID: userData.sexo?.id?.toString() || null,
          localidadID: userData.localidad?.id?.toString() || null,
          provinciaID: userData.localidad?.provincia?.id?.toString() || null,
        });
      } catch (error) {
        console.error("Error cargando usuario:", error);
        notifications.show({
          title: "Error",
          message: "No se pudo cargar el usuario",
          color: "red",
          icon: <IconX />,
        });
        navigate("~/usuarios");
      } finally {
        setLoadingUser(false);
      }
    };

    if (id) {
      loadUser();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        // Preparar fecha de nacimiento
        let fechaNacimiento = null;
        if (values.fechaNacimiento) {
          if (values.fechaNacimiento instanceof Date) {
            fechaNacimiento = values.fechaNacimiento
              .toISOString()
              .split("T")[0];
          } else if (typeof values.fechaNacimiento === "string") {
            fechaNacimiento = values.fechaNacimiento;
          }
        }

        // Preparar datos para el backend
        const userData = {
          username: values.username,
          nombre: values.nombre,
          apellido: values.apellido,
          fechaNacimiento,
          prefijo: values.prefijo,
          telefono: values.telefono,
          nombreCalle: values.nombreCalle,
          numeroCalle: values.numeroCalle,
          email: values.email,
          sucursalID: values.sucursalID ? parseInt(values.sucursalID) : null,
          authorities: Array.isArray(values.authorities)
            ? values.authorities
            : [],
          dni: values.dni,
          tipoDocumentoID: parseInt(values.tipoDocumentoID),
          sexoID: parseInt(values.sexoID),
          localidadID: parseInt(values.localidadID),
        };

        await usuarioApi.update(id, userData);

        notifications.show({
          title: "Usuario actualizado",
          message: "Los cambios se guardaron correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/usuarios");
      } catch (error) {
        console.error("Error actualizando usuario:", error);
        notifications.show({
          title: "Error",
          message:
            error.response?.data?.message || "No se pudo actualizar el usuario",
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [id, navigate]
  );

  const handleCancel = useCallback(() => {
    navigate("~/usuarios");
  }, [navigate]);

  if (loadingUser) {
    return (
      <PageContainer>
        <Card>
          <Text>Cargando usuario...</Text>
        </Card>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>Editar usuario</Title>
          <Text c="dimmed">Modificá los datos del usuario {form.values.username}</Text>
        </Box>
        <Button
          variant="subtle"
          leftSection={<IconArrowLeft size={18} />}
          onClick={handleCancel}
        >
          Volver
        </Button>
      </Group>

      <UsuarioForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={handleCancel}
        isEdit={true}
      />
    </PageContainer>
  );
};

export default EditarUsuario;
