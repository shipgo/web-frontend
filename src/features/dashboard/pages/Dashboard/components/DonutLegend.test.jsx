import { render, screen, within } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { describe, expect, it } from 'vitest';

import DonutLegend from './DonutLegend';

const DATA = [
  { name: 'Creado', value: 3, color: 'blue.5' },
  { name: 'Entregado', value: 7, color: 'teal.5' },
  { name: 'Rechazado', value: 1, color: 'red.5' },
];

const renderLegend = () =>
  render(
    <MantineProvider>
      <DonutLegend data={DATA} />
    </MantineProvider>,
  );

describe('DonutLegend', () => {
  it('muestra un swatch por porción, con etiqueta y valor', () => {
    renderLegend();

    const items = screen.getAllByTestId('donut-legend-item');
    expect(items).toHaveLength(3);
    items.forEach((item, i) => {
      expect(within(item).getByTestId('donut-legend-swatch')).toBeInTheDocument();
      expect(within(item).getByText(DATA[i].name)).toBeInTheDocument();
      expect(within(item).getByText(String(DATA[i].value))).toBeInTheDocument();
    });
  });

  it('cada swatch usa el mismo color que la porción del donut', () => {
    renderLegend();

    const swatches = screen.getAllByTestId('donut-legend-swatch');
    // `getThemeColor('blue.5')` -> `var(--mantine-color-blue-5)`, igual que el chart.
    expect(swatches[0].querySelector('.mantine-ColorSwatch-colorOverlay').getAttribute('style')).toContain('--mantine-color-blue-5');
    expect(swatches[1].querySelector('.mantine-ColorSwatch-colorOverlay').getAttribute('style')).toContain('--mantine-color-teal-5');
    expect(swatches[2].querySelector('.mantine-ColorSwatch-colorOverlay').getAttribute('style')).toContain('--mantine-color-red-5');
  });
});
