import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

import { marcaApi } from "../../api/catalogoVehiculos.api";
import { REINTENTAR_MAS_TARDE } from "@copy/common";

/**
 * Confirmación + borrado de Marca (`DELETE /api/marca/{id}` — `ENDPOINTS.md`
 * §11). Mismo patrón que `sucursales/.../useDeleteSucursal.jsx`. Si el
 * backend rechaza el borrado (ej. marca en uso por un modelo/vehículo), el
 * mensaje de negocio viaja en `error.response.data.message` (CONTRACTS.md §5)
 * y se muestra tal cual en el toast.
 */
export const useDeleteMarca = (onSuccess) => {
  const openDeleteModal = (marca) => {
    const nombre = marca.nombre || "Sin nombre";

    modals.openConfirmModal({
      title: "Eliminar marca",
      centered: true,
      children: (
        <Text size="sm">
          ¿Estás seguro de que querés eliminar la marca <strong>{nombre}</strong>?
          Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: "Eliminar", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await marcaApi.delete(marca.id);

          notifications.show({
            title: "Marca eliminada",
            message: "La marca se eliminó correctamente.",
            color: "green",
            icon: <IconCheck />,
          });

          if (onSuccess) {
            onSuccess();
          }
        } catch (error) {
          console.error("Error eliminando marca:", error);
          notifications.show({
            title: "No se pudo eliminar la marca",
            message:
              error.response?.data?.message || REINTENTAR_MAS_TARDE,
            color: "red",
            icon: <IconX />,
          });
        }
      },
    });
  };

  return { openDeleteModal };
};
