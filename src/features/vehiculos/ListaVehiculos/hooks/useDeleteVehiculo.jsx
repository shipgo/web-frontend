import { useCallback } from "react";
import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import { vehiculoApi } from "@api";
import { REINTENTAR_MAS_TARDE } from "@copy/common";

/**
 * Hook para manejar la eliminación de vehículos con confirmación
 */
export const useDeleteVehiculo = (onSuccess) => {
  const confirmDelete = useCallback(
    (vehiculo) => {
      const identificador =
        vehiculo.patente ||
        `${vehiculo.modelo?.marca?.nombre || ""} ${
          vehiculo.modelo?.nombre || ""
        }`.trim() ||
        "este vehículo";

      modals.openConfirmModal({
        title: "Eliminar vehículo",
        centered: true,
        children: (
          <Text size="sm">
            ¿Estás seguro de que querés eliminar el vehículo{" "}
            <strong>{identificador}</strong>?
            <br />
            Esta acción no se puede deshacer.
          </Text>
        ),
        labels: { confirm: "Eliminar", cancel: "Cancelar" },
        confirmProps: { color: "red" },
        onConfirm: async () => {
          try {
            await vehiculoApi.delete(vehiculo.id);

            notifications.show({
              title: "Vehículo eliminado",
              message: `El vehículo ${identificador} fue eliminado correctamente`,
              color: "green",
              icon: <IconCheck />,
            });

            if (onSuccess) {
              onSuccess();
            }
          } catch (error) {
            console.error("Error eliminando vehículo:", error);
            notifications.show({
              title: "No se pudo eliminar el vehículo",
              message:
                error.response?.data?.message ||
                REINTENTAR_MAS_TARDE,
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

