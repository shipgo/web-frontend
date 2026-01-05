import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import { mantenimientoApi } from "../../api/mantenimientos.api";

export const useDeleteMantenimiento = (onSuccess) => {
  const openDeleteModal = (mantenimiento) => {
    const vehiculo = mantenimiento.vehiculo;
    const patente = vehiculo?.patente || "Sin patente";
    const tipoMantenimiento =
      mantenimiento.tipoMantenimiento?.nombre ||
      mantenimiento.tipo?.nombre ||
      "Sin tipo";

    modals.openConfirmModal({
      title: "Eliminar mantenimiento",
      centered: true,
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar el mantenimiento de{" "}
          <strong>{tipoMantenimiento}</strong> para el vehículo{" "}
          <strong>{patente}</strong>? Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: "Eliminar", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await mantenimientoApi.delete(mantenimiento.id);

          notifications.show({
            title: "Éxito",
            message: "Mantenimiento eliminado correctamente",
            color: "green",
            icon: <IconCheck />,
          });

          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          console.error("Error eliminando mantenimiento:", error);
          notifications.show({
            title: "Error",
            message:
              error.response?.data?.message ||
              "No se pudo eliminar el mantenimiento",
            color: "red",
            icon: <IconX />,
          });
        }
      },
    });
  };

  return { openDeleteModal };
};

