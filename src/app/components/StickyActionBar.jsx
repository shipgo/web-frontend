import { Box, Button, Group } from '@mantine/core';

import ActionMenu from './ActionMenu';

/** Alto aproximado de la barra (44 px de botón + padding); usar como `pb` del contenido. */
export const STICKY_ACTION_BAR_HEIGHT = 76;

/**
 * Barra de acciones fija al borde inferior del contenido (formularios y detalle
 * en mobile). Acción primaria a ancho completo + `ActionMenu` opcional (tres
 * puntos) para acciones secundarias/destructivas.
 *
 * Es `position: sticky; bottom: 0` DENTRO del contenido (no usa el slot de footer
 * del AppShell) con `z-index: 100` y `padding-bottom: env(safe-area-inset-bottom)`.
 * Como es sticky ocupa lugar en el flujo, así que no tapa nada si va como último
 * hijo del contenedor de la pantalla. Si en cambio la ponés con `fixed`, agregá
 * `pb={STICKY_ACTION_BAR_HEIGHT}` al contenido.
 *
 * @param {Object} props
 * @param {string} props.label Texto de la acción primaria.
 * @param {() => void} [props.onClick] Handler de la acción primaria.
 * @param {import('react').ReactNode} [props.icon] Ícono a la izquierda del texto.
 * @param {string} [props.color] Color de Mantine del botón primario (ej. `red` si la única acción es destructiva).
 * @param {boolean} [props.loading]
 * @param {boolean} [props.disabled]
 * @param {'button' | 'submit'} [props.type] Usar `submit` + `form` para formularios.
 * @param {string} [props.form] id del `<form>` asociado (botón fuera del form).
 * @param {Array} [props.actions] Acciones del `ActionMenu` (ver `ActionMenu`).
 * @param {boolean} [props.fixed] `position: fixed` en vez de sticky (requiere padding inferior en el contenido).
 * @param {import('react').ReactNode} [props.children] Contenido extra a la izquierda (ej. total).
 */
const StickyActionBar = ({
  label,
  onClick,
  icon,
  color,
  loading,
  disabled,
  type = 'button',
  form,
  actions = [],
  fixed = false,
  children,
}) => (
  <Box
    role="region"
    aria-label="Acciones"
    data-testid="sticky-action-bar"
    bg="var(--mantine-color-body)"
    px="md"
    pt="xs"
    style={{
      position: fixed ? 'fixed' : 'sticky',
      bottom: 0,
      left: fixed ? 0 : undefined,
      right: fixed ? 0 : undefined,
      zIndex: 100,
      paddingBottom: 'calc(var(--mantine-spacing-xs) + env(safe-area-inset-bottom))',
      borderTop: '1px solid var(--mantine-color-default-border)',
    }}
  >
    <Group gap="xs" wrap="nowrap">
      {children}
      <Button
        flex={1}
        size="md"
        mih={44}
        type={type}
        form={form}
        color={color}
        leftSection={icon}
        onClick={onClick}
        loading={loading}
        disabled={disabled}
      >
        {label}
      </Button>
      {actions.length > 0 && <ActionMenu actions={actions} />}
    </Group>
  </Box>
);

export default StickyActionBar;
