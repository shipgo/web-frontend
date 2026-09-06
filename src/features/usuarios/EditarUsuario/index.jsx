import { useCallback, useEffect, useState } from "react";
import { useLocation, useParams } from "wouter";
import { Card, Text } from "@mantine/core";
import { useForm, schemaResolver } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { usuarioApi } from "@api";
import { useAuthStore } from "@stores/auth.store";
import UsuarioForm from "../components/UsuarioForm";
import FotoPerfilUpload from "../components/FotoPerfilUpload";
import { USUARIO_INITIAL_VALUES, USUARIO_SCHEMA } from "../constants/schema";
import { toBackendDate } from "../utils";

const EditarUsuario = () => {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const currentUser = useAuthStore((state) => state.user);
  const setAuthUser = useAuthStore((state) => state.setUser);

  const [loading, setLoading] = useState(false);
  const [loadingUser, setLoadingUser] = useState(true);
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");

  // La subida de foto (`POST /api/files`) siempre asocia la imagen al usuario
  // LOGUEADO (ver JSDoc de `FotoPerfilUpload`) — no hay endpoint para que un
  // SU/AD suba la foto de otro empleado. Sólo tiene sentido mostrar el control
  // cuando quien edita es el dueño de este perfil.
  const isSelf = Boolean(currentUser?.id) && String(currentUser.id) === id;

  const form = useForm({
    initialValues: USUARIO_INITIAL_VALUES,
    validate: schemaResolver(USUARIO_SCHEMA, { sync: true }),
  });

  // Cargar datos del usuario
  useEffect(() => {
    const loadUser = async () => {
      try {
        setLoadingUser(true);
        const userData = await usuarioApi.getById(id);

        // `fechaNacimiento` llega del backend como `LocalDate` (`YYYY-MM-DD`), que
        // es exactamente el formato de valor que espera el `DateInput` de Mantine
        // v9 — se pasa tal cual, sin convertir a `Date` (que introducía un desfase
        // de zona horaria al re-serializar). `toBackendDate` lo tolera igual.
        const fechaNacimiento = userData.fechaNacimiento || null;

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

        setProfile(userData.profile || null);
        setFullName(
          userData.nombre && userData.apellido
            ? `${userData.nombre} ${userData.apellido}`
            : userData.username || ""
        );
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
          message: responseData?.message || "No se pudo actualizar el usuario",
          color: "red",
          icon: <IconX />,
        });
      } finally {
        setLoading(false);
      }
    },
    [id, navigate, form]
  );

  const handleCancel = useCallback(() => {
    navigate("~/usuarios");
  }, [navigate]);

  const handleFotoUploaded = useCallback(
    (usuarioActualizado) => {
      setProfile(usuarioActualizado?.profile || null);
      // El usuario logueado es siempre el dueño de la foto (ver FotoPerfilUpload) —
      // actualizamos el store para que el avatar del header se refresque también.
      setAuthUser(usuarioActualizado);
    },
    [setAuthUser]
  );

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
      <PageBreadcrumbsHeader
        entidad="Usuarios"
        accion="Editar usuario"
        descripcion={
          form.values.username
            ? `Modificá los datos del usuario ${form.values.username}`
            : "Modificá los datos del usuario"
        }
      />

      {isSelf && (
        <FotoPerfilUpload
          profile={profile}
          fullName={fullName}
          onUploaded={handleFotoUploaded}
        />
      )}

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
