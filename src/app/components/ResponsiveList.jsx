import { Box, Stack } from '@mantine/core';

import { useIsMobile } from '@hooks/useIsMobile';
import ScreenContainer from './ScreenContainer';

/**
 * Lista responsive: tabla en escritorio, tarjetas en mobile.
 *
 * `GridData` NO sirve para esto (es la grilla clave/valor de los detalles), por
 * eso la lógica vive acá. Envuelve a `ScreenContainer` (estados cargando / error /
 * vacío / vacío con filtros, mismas props) y no toca la tabla existente: la pantalla
 * pasa su tabla como `children` y, opcionalmente, `renderCard`.
 *
 * - Sin `renderCard`: se renderiza `children` igual que hoy, dentro de un contenedor
 *   con `overflow-x: auto` (el scroll horizontal queda en la tabla, no en el body).
 * - Con `renderCard` y mobile: se dibuja una tarjeta por fila (gap xs) en vez de la tabla.
 *
 * La selección múltiple la maneja la pantalla (`selectedIds` con `.has`, `onToggle(id)`),
 * igual que con la tabla. No hay virtualización: la paginación es del servidor.
 *
 * @example
 * <ResponsiveList
 *   items={data.results}
 *   selectedIds={selectedIds}
 *   onToggle={onToggle}
 *   getActions={(envio) => <RowActionsMenu actions={...} />}
 *   renderCard={(envio, { selected, onToggle, actions }) => (
 *     <ListCard title={envio.codigoSeguimiento} mono selected={selected}
 *       onToggle={onToggle} actions={actions} badge={estadoBadge('envio', envio.estado)} />
 *   )}
 *   onLoading={...} onError={...} onEmptyData={...} onEmptyFiltersData={...}
 * >
 *   <ListaEnviosTabla ... />
 * </ResponsiveList>
 *
 * @param {Object} props
 * @param {Array} [props.items]
 * @param {(row: any) => string | number} [props.getRowId] default `row.id`.
 * @param {{has: (id: any) => boolean}} [props.selectedIds] Set con los ids seleccionados.
 * @param {(id: any) => void} [props.onToggle]
 * @param {(row: any) => import('react').ReactNode} [props.getActions] Menú de acciones de la fila.
 * @param {(row: any, ctx: {selected: boolean | undefined, onToggle: () => void,
 *   actions: import('react').ReactNode}) => import('react').ReactNode} [props.renderCard]
 * @param {import('react').ReactNode} props.children Tabla de escritorio.
 * @param {Object} [props.onLoading] Props de `ScreenContainer`.
 * @param {Object} [props.onError]
 * @param {Object} [props.onEmptyData]
 * @param {Object} [props.onEmptyFiltersData]
 * @param {import('react').ReactNode} [props.footer] Contador/paginación debajo (ej. `ResultsCounter`).
 */
const ResponsiveList = ({
  items = [],
  getRowId = (row) => row.id,
  selectedIds,
  onToggle,
  getActions,
  renderCard,
  children,
  onLoading,
  onError,
  onNotFound,
  onEmptyData,
  onEmptyFiltersData,
  footer,
}) => {
  const isMobile = useIsMobile();
  const showCards = isMobile && typeof renderCard === 'function';

  return (
    <>
      <ScreenContainer
        onLoading={onLoading}
        onError={onError}
        onNotFound={onNotFound}
        onEmptyData={onEmptyData}
        onEmptyFiltersData={onEmptyFiltersData}
      >
        {showCards ? (
          <Stack gap="xs" data-testid="responsive-list-cards">
            {items.map((row) => {
              const id = getRowId(row);
              return (
                <Box key={id}>
                  {renderCard(row, {
                    selected: selectedIds ? selectedIds.has(id) : undefined,
                    onToggle: () => onToggle?.(id),
                    actions: getActions?.(row),
                  })}
                </Box>
              );
            })}
          </Stack>
        ) : (
          <Box style={{ overflowX: 'auto', maxWidth: '100%' }}>{children}</Box>
        )}
      </ScreenContainer>
      {footer}
    </>
  );
};

export default ResponsiveList;
