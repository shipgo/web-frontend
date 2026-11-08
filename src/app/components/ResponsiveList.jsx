import { Box, Group, Loader, Paper, Stack, Text } from '@mantine/core';

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
 * Recarga en mobile (cambio de página, filtro, "Actualizar"): si ya hay tarjetas, NO se
 * reemplazan por la tarjeta de carga (eso achicaba la página a ~17 rem y el scroll saltaba
 * arriba). Se quedan atenuadas e inertes, con un indicador "Cargando…" fijo a la vista.
 * La tarjeta de carga completa queda para la primera carga, cuando no hay nada que mostrar.
 * Para que haya tarjetas durante la recarga, el hook de datos tiene que conservar la página
 * anterior (`placeholderData: keepPreviousData`).
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
  const refreshing = showCards && Boolean(onLoading?.show) && items.length > 0;

  return (
    <>
      <ScreenContainer
        onLoading={refreshing ? undefined : onLoading}
        onError={onError}
        onNotFound={onNotFound}
        onEmptyData={onEmptyData}
        onEmptyFiltersData={onEmptyFiltersData}
      >
        {showCards ? (
          // Con selección activa el `SelectionBanner` queda fijo abajo: dejar aire
          // para que no tape la última tarjeta.
          <Box aria-busy={refreshing || undefined}>
            {refreshing && (
              // Alto 0 + sticky: el indicador queda a la vista aunque la lista sea larga.
              <Box
                pos="sticky"
                h={0}
                style={{
                  top: 'calc(var(--app-shell-header-offset, 0px) + var(--mantine-spacing-sm))',
                  zIndex: 5,
                  display: 'flex',
                  justifyContent: 'center',
                  overflow: 'visible',
                }}
              >
                <Paper
                  withBorder
                  shadow="md"
                  radius="xl"
                  px="md"
                  py={6}
                  role="status"
                  data-testid="responsive-list-refreshing"
                  style={{ alignSelf: 'flex-start' }}
                >
                  <Group gap="xs" wrap="nowrap">
                    <Loader size="xs" />
                    <Text size="sm">{onLoading?.description ?? 'Cargando...'}</Text>
                  </Group>
                </Paper>
              </Box>
            )}
            <Stack
              gap="xs"
              data-testid="responsive-list-cards"
              inert={refreshing || undefined}
              style={{
                paddingBottom: selectedIds?.size > 0 ? 88 : 0,
                opacity: refreshing ? 0.45 : 1,
                transition: 'opacity 150ms ease',
              }}
            >
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
          </Box>
        ) : (
          <Box style={{ overflowX: 'auto', maxWidth: '100%' }}>{children}</Box>
        )}
      </ScreenContainer>
      {footer}
    </>
  );
};

export default ResponsiveList;
