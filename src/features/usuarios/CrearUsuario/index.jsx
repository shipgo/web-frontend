import { useCallback, useState } from "react";
import { useLocation } from "wouter";
import { useForm, schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { usuarioApi } from "@api";
import UsuarioForm from "../components/UsuarioForm";
import { USUARIO_INITIAL_VALUES, USUARIO_SCHEMA } from "../constants/schema";
import { toBackendDate } from "../utils";

const CrearUsuario = () => {
  const [, navigate] = useLocation();

  const [loading, setLoading] = useState(false);

  const form = useForm({
    initialValues: USUARIO_INITIAL_VALUES,
    validate: schemaResolver(USUARIO_SCHEMA, { sync: true }),
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
      <PageBreadcrumbsHeader
        entidad="Usuarios"
        accion="Crear usuario"
        descripcion="Completá los datos del nuevo usuario"
      />

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
