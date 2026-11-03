import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import { sucursalApi } from "../../api/sucursales.api";
import { REINTENTAR_MAS_TARDE } from "@copy/common";

export const useDeleteSucursal = (onSuccess) => {
  const openDeleteModal = (sucursal) => {
    const nombre = sucursal.nombre || "Sin nombre";

    const modalId = modals.openConfirmModal({
      title: "Eliminar sucursal",
      centered: true,
      children: (
        <Text size="sm">
          ¿Estás seguro de que querés eliminar la sucursal{" "}
          <strong>{nombre}</strong>? Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: "Eliminar", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      closeOnConfirm: false,
      onConfirm: async () => {
        modals.updateModal({
          modalId,
          confirmProps: { color: "red", loading: true },
        });

        try {
          await sucursalApi.delete(sucursal.id);

          notifications.show({
            title: "Sucursal eliminada",
            message: "La sucursal se eliminó correctamente.",
            color: "green",
            icon: <IconCheck />,
          });

          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          console.error("Error eliminando sucursal:", error);
          notifications.show({
            title: "No se pudo eliminar la sucursal",
            message:
              error.response?.data?.message ||
              REINTENTAR_MAS_TARDE,
            color: "red",
            icon: <IconX />,
          });
        } finally {
          modals.close(modalId);
        }
      },
    });
  };

  return { openDeleteModal };
};
