import { modals } from '@mantine/modals';
import { Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';

/**
 * Describe por qué falló un DELETE individual dentro de un borrado masivo,
 * con el mismo criterio que los hooks `useDelete<Entidad>` existentes
 * (ej. `useDeleteEnvio`, `useDeleteMantenimiento`): 409 = estado no
 * borrable (esperable, no es un error real), 404 = ya no existe.
 */
const describeFailure = (error) => {
  const status = error?.response?.status;
  const backendMessage = error?.response?.data?.message;

  if (status === 409) return backendMessage || 'no está en un estado que permite eliminarlo';
  if (status === 404) return backendMessage || 'ya no existe';
  return backendMessage || 'no se pudo eliminar';
};

/**
 * Hook genérico para "Eliminar seleccionados" (`SelectionBanner`, SHG-FE-095).
 *
 * No existe (ni está en alcance crear) un endpoint de borrado masivo en el
 * backend: se dispara un `DELETE` por ítem seleccionado, en paralelo
 * (`Promise.allSettled`) para que un 404/409 puntual no aborte el resto —
 * mismas reglas de estado que el borrado individual de cada entidad, el
 * backend las sigue aplicando por fila.
 *
 * - Confirmación con la cantidad seleccionada + loading real durante el
 *   borrado. `modals.openConfirmModal` toma un snapshot de las props al
 *   abrir, así que el loading se actualiza aparte con `modals.updateModal`
 *   (un solo argumento objeto) — mismo patrón que `useDeleteSucursal`.
 * - Guard contra doble click: si el usuario clickea "Eliminar" dos veces
 *   rápido, el segundo click puede llegar antes de que React re-renderice el
 *   botón como `loading` (que lo dejaría disabled). `isRunning` cierra sobre
 *   esta invocación puntual del modal (no es estado de React) y descarta
 *   cualquier `onConfirm` repetido mientras el primero sigue en vuelo.
 * - Reporta éxitos/fallos por separado (identificador legible por ítem vía
 *   `getLabel` + motivo del fallo) y siempre limpia la selección + refresca
 *   el listado al terminar (`onSettled`), sea éxito total, parcial o fallo
 *   total.
 *
 * @param {Object} opts
 * @param {(id: any) => Promise<void>} opts.deleteFn
 * @param {string} opts.singular  Ej: 'envío'.
 * @param {string} opts.plural    Ej: 'envíos'.
 * @param {(item: any) => string} [opts.getLabel]  Identificador legible por ítem (default `#id`).
 * @param {() => void} [opts.onSettled]  Refetch de la lista + limpiar selección. Se llama siempre.
 * @returns {{ confirmBulkDelete: (items: any[]) => void }}
 */
export const useBulkDelete = ({ deleteFn, singular, plural, getLabel, onSettled }) => {
  const labelOf = (item) => (getLabel ? getLabel(item) : `#${item?.id ?? item}`);

  const confirmBulkDelete = (items = []) => {
    const count = items.length;
    if (count === 0) return;

    const noun = count === 1 ? singular : plural;
    let isRunning = false;

    const modalId = modals.openConfirmModal({
      title: 'Eliminar seleccionados',
      centered: true,
      children: (
        <Text size="sm">
          ¿Estás seguro de que deseas eliminar {count} {noun}? Esta acción no se puede deshacer.
        </Text>
      ),
      labels: { confirm: 'Eliminar', cancel: 'Cancelar' },
      confirmProps: { color: 'red' },
      closeOnConfirm: false,
      onConfirm: async () => {
        if (isRunning) return;
        isRunning = true;

        modals.updateModal({ modalId, confirmProps: { color: 'red', loading: true } });

        try {
          const results = await Promise.allSettled(items.map((item) => deleteFn(item.id)));

          const exitosos = [];
          const fallidos = [];
          results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
              exitosos.push(items[index]);
            } else {
              fallidos.push({ item: items[index], reason: result.reason });
            }
          });

          if (fallidos.length === 0) {
            notifications.show({
              title: 'Eliminados',
              message: `Se eliminaron ${exitosos.length} ${exitosos.length === 1 ? singular : plural}.`,
              color: 'green',
              icon: <IconCheck />,
            });
          } else {
            const detalle = fallidos
              .map(({ item, reason }) => `${labelOf(item)} (${describeFailure(reason)})`)
              .join('; ');

            if (exitosos.length === 0) {
              notifications.show({
                title: 'No se pudo eliminar',
                message: `No se pudo eliminar ningún ${singular}. ${detalle}`,
                color: 'red',
                icon: <IconX />,
                autoClose: 10000,
              });
            } else {
              notifications.show({
                title: 'Eliminación parcial',
                message: `Se eliminaron ${exitosos.length} de ${count} ${plural}. No se pudieron eliminar: ${detalle}`,
                color: 'yellow',
                icon: <IconAlertTriangle />,
                autoClose: 10000,
              });
            }
          }
        } finally {
          modals.close(modalId);
          onSettled?.();
        }
      },
    });
  };

  return { confirmBulkDelete };
};
