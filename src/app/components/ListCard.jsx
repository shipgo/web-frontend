import { Badge, Checkbox, Group, Paper, Stack, Text } from '@mantine/core';

/**
 * Tarjeta de fila para listados en mobile (borde, radio md, padding md, gap xs).
 *
 * @param {Object} props
 * @param {import('react').ReactNode} props.title Título; con `mono` va en monoespaciado (códigos).
 * @param {boolean} [props.mono] Título monoespaciado.
 * @param {{label: string, color?: string, textColor?: string}} [props.badge] Estado (ver `estadoBadge`).
 * @param {Array<import('react').ReactNode | {label?: string, value: import('react').ReactNode}>} [props.lines]
 *   Líneas secundarias; `{label, value}` renderiza "label: value".
 * @param {import('react').ReactNode} [props.footer] Pie (ej. fecha relativa).
 * @param {import('react').ReactNode} [props.actions] Menú de acciones (`RowActionsMenu`).
 * @param {boolean} [props.selected] Si no es `undefined` se muestra el checkbox de selección.
 * @param {() => void} [props.onToggle] Handler del checkbox.
 * @param {string} [props.selectLabel] aria-label del checkbox.
 * @param {() => void} [props.onClick] Click en la tarjeta (navegar al detalle).
 */
const ListCard = ({
  title,
  mono = false,
  badge,
  lines = [],
  footer,
  actions,
  selected,
  onToggle,
  selectLabel = 'Seleccionar',
  onClick,
}) => (
  <Paper
    withBorder
    radius="md"
    p="md"
    data-testid="list-card"
    bg={selected ? 'var(--mantine-color-blue-light)' : undefined}
    style={onClick ? { cursor: 'pointer' } : undefined}
    onClick={onClick}
  >
    <Stack gap="xs">
      <Group gap="xs" wrap="nowrap" align="center">
        {selected !== undefined && (
          <Checkbox
            size="md"
            aria-label={selectLabel}
            checked={selected}
            onChange={() => onToggle?.()}
            onClick={(e) => e.stopPropagation()}
          />
        )}
        <Text fw={600} ff={mono ? 'monospace' : undefined} truncate flex={1} miw={0}>
          {title}
        </Text>
        {badge && (
          <Badge color={badge.color} c={badge.textColor} variant="light" radius="md">
            {badge.label}
          </Badge>
        )}
        {actions && <div onClick={(e) => e.stopPropagation()}>{actions}</div>}
      </Group>

      {lines.map((line, i) =>
        line && typeof line === 'object' && 'value' in line ? (
          <Text key={i} size="sm">
            {line.label && <Text span c="dimmed">{line.label}: </Text>}
            {line.value}
          </Text>
        ) : (
          <Text key={i} size="sm">{line}</Text>
        ),
      )}

      {footer && <Text size="xs" c="dimmed">{footer}</Text>}
    </Stack>
  </Paper>
);

export default ListCard;
