import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { Box, Group, Text, Title, Button } from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconArrowLeft, IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import { usuarioApi } from "@api";
import UsuarioForm from "../components/UsuarioForm";
import { toBackendDate } from "../utils";

const CrearUsuario = () => {
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);

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

  const handleSubmit = useCallback(
    async (values) => {
      try {
        setLoading(true);

        // `fechaNacimiento` es `LocalDate` en el backend (`UserReqDTO`): va como
        // `YYYY-MM-DD`, sin hora ni offset (no usar `.toISOString()`, ver bitácora
        // SHG-FE-008/SHG-FE-016 en planning/coordination/frontend.md).
        const fechaNacimiento = toBackendDate(values.fechaNacimiento);

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

        await usuarioApi.save(userData);

        notifications.show({
          title: "Usuario creado",
          message: "El usuario se creó correctamente",
          color: "green",
          icon: <IconCheck />,
        });

        navigate("~/usuarios");
      } catch (error) {
        console.error("Error creando usuario:", error);

        // 400 de validación de campos (`ApiFieldError`, CONTRACTS.md §5): manejo
        // básico por campo hasta que exista el helper global de SHG-FE-021.
        const responseData = error?.response?.data;
        if (Array.isArray(responseData?.fields) && responseData.fields.length > 0) {
          form.setErrors(
            Object.fromEntries(
              responseData.fields.map(({ field, error: fieldError }) => [
                field,
                fieldError,
              ])
            )
          );
        }

        notifications.show({
          title: "Error",
          message: responseData?.message || "No se pudo crear el usuario",
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [navigate, form]
  );

  const handleCancel = useCallback(() => {
    navigate("~/usuarios");
  }, [navigate]);

  return (
    <PageContainer>
      <Group justify="space-between" align="flex-end">
        <Box>
          <Title order={2}>Crear usuario</Title>
          <Text c="dimmed">Completá los datos del nuevo usuario</Text>
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
        isEdit={false}
      />
    </PageContainer>
  );
};

export default CrearUsuario;
