import { modals } from "@mantine/modals";
import { Text } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconAlertTriangle, IconCheck, IconX } from "@tabler/icons-react";

import { mantenimientoApi } from "../../api/mantenimientos.api";

/**
 * Baja de mantenimiento con confirmación (`DELETE /api/mantenimiento/{id}` —
 * soft-delete, `@SQLDelete` en la entidad).
 * - `200` → éxito, dispara `onSuccess` (refetch de la lista).
 * - `404` → ya no existe → toast de error.
 * - `409` → conflicto de negocio → toast de warning con el `message` del backend.
 */
export const useDeleteMantenimiento = (onSuccess) => {
  const confirmDelete = (mantenimiento) => {
    const patente = mantenimiento.vehiculo?.patente;
    const tipo = mantenimiento.tipoMantenimiento?.nombre;
    const identificador =
      [tipo, patente].filter(Boolean).join(" · ") ||
      `mantenimiento #${mantenimiento.id}`;

    modals.openConfirmModal({
      title: "Eliminar mantenimiento",
      centered: true,
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar el mantenimiento{" "}
          <strong>{identificador}</strong>? Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: "Eliminar", cancel: "Cancelar" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await mantenimientoApi.delete(mantenimiento.id);

          notifications.show({
            title: "Mantenimiento eliminado",
            message: `El mantenimiento ${identificador} fue eliminado correctamente`,
            color: "green",
            icon: <IconCheck />,
          });

          onSuccess?.();
        } catch (error) {
          const status = error.response?.status;
          const backendMessage = error.response?.data?.message;

          if (status === 409) {
            notifications.show({
              title: "No se puede eliminar",
              message:
                backendMessage ||
                `El mantenimiento ${identificador} no se puede eliminar en este momento`,
              color: "yellow",
              icon: <IconAlertTriangle />,
            });
            return;
          }

          if (status === 404) {
            notifications.show({
              title: "Mantenimiento no encontrado",
              message: backendMessage || `El mantenimiento ${identificador} ya no existe`,
              color: "red",
              icon: <IconX />,
            });
            return;
          }

          console.error("Error eliminando mantenimiento:", error);
          notifications.show({
            title: "Error",
            message: backendMessage || "No se pudo eliminar el mantenimiento",
            color: "red",
            icon: <IconX />,
          });
        }
      },
    });
  };

  return { confirmDelete };
};
