import { useCallback } from "react";
import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import { usuarioApi } from "@api";

/**
 * Hook para manejar la eliminación de usuarios con confirmación
 */
export const useDeleteUsuario = (onSuccess) => {
  const confirmDelete = useCallback(
    (usuario) => {
      const fullName =
        usuario.nombre && usuario.apellido
          ? `${usuario.nombre} ${usuario.apellido}`
          : usuario.username;

      modals.openConfirmModal({
        title: "Eliminar Usuario",
        centered: true,
        children: (
          <Text size="sm">
            ¿Está seguro que desea eliminar al usuario{" "}
            <strong>{fullName}</strong>?
            <br />
            Esta acción no se puede deshacer.
          </Text>
        ),
        labels: { confirm: "Eliminar", cancel: "Cancelar" },
        confirmProps: { color: "red" },
        onConfirm: async () => {
          try {
            await usuarioApi.delete(usuario.id);

            notifications.show({
              title: "Usuario eliminado",
              message: `El usuario ${fullName} fue eliminado correctamente`,
              color: "green",
              icon: <IconCheck />,
            });

            if (onSuccess) {
              onSuccess();
            }
          } catch (error) {
            console.error("Error eliminando usuario:", error);
            notifications.show({
              title: "Error",
              message:
                error.response?.data?.message ||
                "No se pudo eliminar el usuario",
              color: "red",
              icon: <IconX />,
            });
          }
        },
      });
    },
    [onSuccess]
  );

  return { confirmDelete };
};
