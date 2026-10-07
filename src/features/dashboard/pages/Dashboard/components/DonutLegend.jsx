import { ColorSwatch, Group, Text, getThemeColor, useMantineTheme } from '@mantine/core';

/**
 * Leyenda de un `DonutChart` con muestra de color (`SHG-FE-113`): cada ítem
 * lleva un swatch del MISMO color que su porción (se resuelve con
 * `getThemeColor`, igual que hace el chart con `data[].color`), la etiqueta y
 * el valor. Sin el swatch no se podía asociar color con etiqueta. El color del
 * texto sale de los tokens del tema (`dimmed` / default), así que se lee en
 * claro y oscuro; el swatch tiene borde propio para no perderse sobre el fondo.
 *
 * @param {Object} props
 * @param {Array<{name: string, value: number, color: string}>} props.data
 * @param {string} [props.gap] gap horizontal entre ítems (token de spacing).
 */
const DonutLegend = ({ data, gap = 'lg' }) => {
  const theme = useMantineTheme();

  return (
    <Group
      component="ul"
      gap={gap}
      justify="center"
      wrap="wrap"
      aria-label="Referencias del gráfico"
      style={{ listStyle: 'none', margin: 0, padding: 0 }}
    >
      {data.map((item) => (
        <Group key={item.name} component="li" gap={6} wrap="nowrap" data-testid="donut-legend-item">
          <ColorSwatch
            size={12}
            color={getThemeColor(item.color, theme)}
            withShadow={false}
            style={{ border: '1px solid var(--mantine-color-default-border)' }}
            data-testid="donut-legend-swatch"
            aria-hidden
          />
          <Text size="xs" c="dimmed">
            {item.name}
          </Text>
          <Text size="sm" fw={700}>
            {item.value}
          </Text>
        </Group>
      ))}
    </Group>
  );
};

export default DonutLegend;
