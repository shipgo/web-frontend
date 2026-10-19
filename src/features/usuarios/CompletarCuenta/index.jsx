import { useCallback, useRef, useState } from "react";
import { useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import PageContainer from "@components/PageContainer";
import PageBreadcrumbsHeader from "@components/PageBreadcrumbsHeader";
import { applyApiError } from "@domain/apiError";
import { ROLE_SUPERUSER, hasRole, rolesDe } from "@domain/roles";
import { usuarioApi } from "@api";
import { useAuthStore } from "@stores/auth.store";
import UsuarioForm from "../components/UsuarioForm";
import { USUARIO_INITIAL_VALUES, buildUsuarioValidate } from "../constants/schema";
import { toBackendDate } from "../utils";

/**
 * "Completá tu cuenta" (SHG-FE-133, `SHG-BE-154`, `CONTRACTS.md §16.1`).
 *
 * El primer SUPERUSER nace sólo con email (sin datos personales). Una vez que
 * creó su empresa (onboarding) y mientras no tenga `nombre`, `ProtectedRoutes`
 * muestra esta pantalla en lugar del resto de la app. Guarda con
 * `PUT /api/user/{id}` sobre sí mismo (`UserReqDTO` completo: su `sucursalID` y
 * sus `authorities` actuales). Si cambia el `username` el backend invalida la
 * sesión: se manda a `/login` con un aviso. Si no, se refresca la sesión
 * (`whoami`) y se entra a la app.
 */
const CompletarCuenta = () => {
  const [, navigate] = useLocation();
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const getUserInfo = useAuthStore((state) => state.getUserInfo);
  const clearSession = useAuthStore((state) => state.clearSession);
  const [loading, setLoading] = useState(false);
  // Guarda contra doble submit (el estado `loading` se aplica en el próximo render).
  const submittingRef = useRef(false);

  const form = useForm({
    initialValues: {
      ...USUARIO_INITIAL_VALUES,
      username: user?.username || "",
      email: user?.email || "",
      sucursalID: user?.sucursal?.id != null ? String(user.sucursal.id) : null,
      authorities: rolesDe(user),
    },
    validate: buildUsuarioValidate(hasRole(user, ROLE_SUPERUSER)),
  });

  const handleSubmit = useCallback(
    async (values) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setLoading(true);

      try {
        const dto = {
          username: values.username.trim(),
          nombre: values.nombre,
          apellido: values.apellido,
          // `LocalDate`: `YYYY-MM-DD`, nunca `toISOString()`.
          fechaNacimiento: toBackendDate(values.fechaNacimiento),
          prefijo: values.prefijo,
          telefono: values.telefono,
          nombreCalle: values.nombreCalle,
          numeroCalle: values.numeroCalle,
          email: values.email,
          sucursalID: values.sucursalID ? parseInt(values.sucursalID) : null,
          authorities: Array.isArray(values.authorities) ? values.authorities : [],
          dni: values.dni,
          tipoDocumentoID: parseInt(values.tipoDocumentoID),
          sexoID: parseInt(values.sexoID),
          localidadID: parseInt(values.localidadID),
        };

        await usuarioApi.update(user.id, dto);

        // Cambiar el `username` invalida la sesión en el backend.
        if (dto.username !== user.username) {
          queryClient.clear();
          clearSession();
          notifications.show({
            title: "Cuenta completada",
            message:
              "Cambiaste tu usuario, así que tenés que volver a iniciar sesión con el nuevo.",
            color: "green",
            icon: <IconCheck />,
          });
          navigate("/login", { replace: true });
          return;
        }

        try {
          await getUserInfo();
        } catch (refreshError) {
          // El PUT ya se aplicó: no es un error de guardado. Se vuelve a
          // iniciar sesión para recargar los datos.
          console.error("Error refrescando la sesión:", refreshError);
          queryClient.clear();
          clearSession();
          notifications.show({
            title: "Cuenta completada",
            message:
              "Tus datos se guardaron, pero no pudimos recargar tu sesión. Iniciá sesión de nuevo.",
            color: "green",
            icon: <IconCheck />,
          });
          navigate("/login", { replace: true });
          return;
        }
        notifications.show({
          title: "Cuenta completada",
          message: "Tus datos se guardaron correctamente",
          color: "green",
          icon: <IconCheck />,
        });
        navigate("/", { replace: true });
      } catch (error) {
        console.error("Error completando la cuenta:", error);
        const message = applyApiError(form, error, {
          backendForbiddenMessage: true,
          fallbackMessage: "No se pudieron guardar tus datos",
        });
        notifications.show({
          title: "Error",
          message,
          color: "red",
          icon: <IconX />,
        });
      } finally {
        submittingRef.current = false;
        setLoading(false);
      }
    },
    [form, user, queryClient, clearSession, getUserInfo, navigate],
  );

  return (
    <PageContainer>
      <PageBreadcrumbsHeader
        entidad="Cuenta"
        accion="Completá tu cuenta"
        descripcion="Cargá tus datos personales para empezar a operar"
      />

      <UsuarioForm
        form={form}
        onSubmit={handleSubmit}
        loading={loading}
        onCancel={() => {}}
        isEdit
        usernameEditable
        hideCancel
        lockRolesAndSucursal
        submitLabel="Guardar y continuar"
      />
    </PageContainer>
  );
};

export default CompletarCuenta;
