import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import { sucursalApi } from "../../api/sucursales.api";

export const useDeleteSucursal = (onSuccess) => {
  const openDeleteModal = (sucursal) => {
    const nombre = sucursal.nombre || "Sin nombre";

    modals.openConfirmModal({
      title: "Eliminar sucursal",
      centered: true,
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar la sucursal{" "}
          <strong>{nombre}</strong>? Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: "Eliminar", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await sucursalApi.delete(sucursal.id);

          notifications.show({
            title: "Éxito",
            message: "Sucursal eliminada correctamente",
            color: "green",
            icon: <IconCheck />,
          });

          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          console.error("Error eliminando sucursal:", error);
          notifications.show({
            title: "Error",
            message:
              error.response?.data?.message ||
              "No se pudo eliminar la sucursal",
            color: "red",
            icon: <IconX />,
          });
        }
      },
    });
  };

  return { openDeleteModal };
};
