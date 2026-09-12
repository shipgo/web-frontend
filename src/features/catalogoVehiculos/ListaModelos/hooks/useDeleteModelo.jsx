import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import { modeloApi } from "../../api/catalogoVehiculos.api";

/**
 * Confirmación + borrado de Modelo (`DELETE /api/modelo/{id}` —
 * `ENDPOINTS.md` §12). Mismo patrón que `useDeleteMarca`/`useDeleteSucursal`.
 */
export const useDeleteModelo = (onSuccess) => {
  const openDeleteModal = (modelo) => {
    const nombre = modelo.nombre || "Sin nombre";

    modals.openConfirmModal({
      title: "Eliminar modelo",
      centered: true,
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar el modelo <strong>{nombre}</strong>?
          Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: "Eliminar", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await modeloApi.delete(modelo.id);

          notifications.show({
            title: "Éxito",
            message: "Modelo eliminado correctamente",
            color: "green",
            icon: <IconCheck />,
          });

          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          console.error("Error eliminando modelo:", error);
          notifications.show({
            title: "Error",
            message:
              error.response?.data?.message || "No se pudo eliminar el modelo",
            color: "red",
            icon: <IconX />,
          });
        }
      },
    });
  };

  return { openDeleteModal };
};
