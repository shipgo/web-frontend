import { useCallback } from "react";
import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import { usuarioApi } from "@api";

/**
 * Reset de contraseña (SU/AD) para un empleado desde el panel.
 *
 * El backend no expone un endpoint de admin para fijar la contraseña de otro
 * usuario directamente (ver JSDoc de `usuarioApi.requestPasswordReset` y la
 * bitácora de SHG-FE-017 en `planning/coordination/frontend.md`): la única acción
 * posible es reenviar el mail público de recuperación (`POST /api/user/resetPassword
 * { userEmail }`), que le llega un link con token al propio usuario para que la
 * cambie él mismo.
 */
export const usePasswordReset = () => {
  const confirmReset = useCallback((usuario) => {
    if (!usuario?.email) {
      notifications.show({
        title: "Error",
        message: "El usuario no tiene un email cargado",
        color: "red",
        icon: <IconX />,
      });
      return;
    }

    const fullName =
      usuario.nombre && usuario.apellido
        ? `${usuario.nombre} ${usuario.apellido}`
        : usuario.username;

    modals.openConfirmModal({
      title: "Resetear contraseña",
      centered: true,
      children: (
        <Text size="sm">
          Se enviará un email a <strong>{usuario.email}</strong> con un enlace
          para que <strong>{fullName}</strong> restablezca su contraseña.
          ¿Confirmás el envío?
        </Text>
      ),
      labels: { confirm: "Enviar email", cancel: "Cancelar" },
      confirmProps: { color: "orange" },
      onConfirm: async () => {
        try {
          await usuarioApi.requestPasswordReset(usuario.email);

          notifications.show({
            title: "Email enviado",
            message: `Se envió el email de restablecimiento a ${usuario.email}`,
            color: "green",
            icon: <IconCheck />,
          });
        } catch (error) {
          console.error("Error solicitando reset de contraseña:", error);
          notifications.show({
            title: "Error",
            message:
              error.response?.data?.message ||
              "No se pudo enviar el email de restablecimiento",
            color: "red",
            icon: <IconX />,
          });
        }
      },
    });
  }, []);

  return { confirmReset };
};
