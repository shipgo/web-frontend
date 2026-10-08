import { modals } from '@mantine/modals';
import { Button, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { parseApiError } from '@domain/apiError';
import { IconAlertTriangle, IconCheck, IconX } from '@tabler/icons-react';

/**
 * Describe por qué falló un DELETE individual dentro de un borrado masivo,
 * con el mismo criterio que los hooks `useDelete<Entidad>` existentes
 * (ej. `useDeleteEnvio`, `useDeleteMantenimiento`): 409 = estado no
 * borrable (esperable, no es un error real), 404 = ya no existe.
 */
const describeFailure = (error) => {
  const status = error?.response?.status;
  const fallbackMessage =
    status === 409
      ? 'no está en un estado que permite eliminarlo'
      : status === 404
        ? 'ya no existe'
        : 'no se pudo eliminar';

  // `parseApiError` (@domain/apiError) unifica el parseo; el 403 de negocio
  // (ej. rol no permitido) conserva el mensaje del backend.
  return parseApiError(error, { backendForbiddenMessage: true, fallbackMessage }).message;
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
 * `excluded` (segundo argumento de `confirmBulkDelete`) permite marcar de
 * antemano ítems que NO deben llegar al backend (ej. un viaje en un estado no
 * cancelable — el `DELETE` real no valida esto, así que el guard tiene que
 * vivir acá, no confiar en que el backend responda 409). Cada uno se reporta
 * junto con los fallos reales, con el motivo indicado, sin invocar `deleteFn`.
 *
 * @param {Object} opts
 * @param {(id: any) => Promise<void>} opts.deleteFn
 * @param {string} opts.singular  Ej: 'envío'.
 * @param {string} opts.plural    Ej: 'envíos'.
 * @param {(item: any) => string} [opts.getLabel]  Identificador legible por ítem (default `#id`).
 * @param {() => void} [opts.onSettled]  Refetch de la lista + limpiar selección. Se llama siempre.
 * @returns {{ confirmBulkDelete: (items: any[], excluded?: { item: any, reason: string }[]) => void }}
 */
export const useBulkDelete = ({ deleteFn, singular, plural, getLabel, onSettled }) => {
  const labelOf = (item) => (getLabel ? getLabel(item) : `#${item?.id ?? item}`);

  const confirmBulkDelete = (items = [], excluded = []) => {
    const count = items.length + excluded.length;
    if (count === 0) return;

    const nounOf = (n) => (n === 1 ? singular : plural);
    let isRunning = false;

    // Texto independiente del género del sustantivo (sin artículos ni
    // adjetivos concordados): lo usan envíos, sucursales, vehículos, etc.
    const motivos = [...new Set(excluded.map(({ reason }) => reason))];
    const detalleExcluidos =
      motivos.length === 1
        ? `${excluded.map(({ item }) => labelOf(item)).join(', ')}: ${motivos[0]}`
        : excluded.map(({ item, reason }) => `${labelOf(item)} (${reason})`).join('; ');

    // Si no queda nada eliminable, no hay nada que confirmar: se informa y listo.
    if (items.length === 0) {
      modals.open({
        title: 'No se puede eliminar',
        centered: true,
        children: (
          <Stack gap="sm">
            <Text size="sm">
              No se puede eliminar nada de lo seleccionado ({excluded.length} {nounOf(excluded.length)}).{' '}
              {detalleExcluidos}.
            </Text>
            <Group justify="flex-end">
              <Button variant="default" onClick={() => modals.closeAll()}>
                Entendido
              </Button>
            </Group>
          </Stack>
        ),
      });
      return;
    }

    const modalId = modals.openConfirmModal({
      title: 'Eliminar seleccionados',
      centered: true,
      children: (
        <Stack gap="xs">
          <Text size="sm">
            {excluded.length === 0
              ? `¿Estás seguro de que querés eliminar ${items.length} ${nounOf(items.length)}? Esta acción no se puede deshacer.`
              : `Se eliminarán ${items.length} ${nounOf(items.length)}. Quedan afuera ${excluded.length} ${nounOf(excluded.length)} (${detalleExcluidos}). Esta acción no se puede deshacer.`}
          </Text>
        </Stack>
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

          // Los excluidos de antemano nunca llamaron a `deleteFn`: se agregan
          // directo a `fallidos`, con el `reason` sintetizado en la misma
          // forma que un error de axios (`describeFailure` ya sabe leerla).
          excluded.forEach(({ item, reason }) => {
            fallidos.push({ item, reason: { response: { data: { message: reason } } } });
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
