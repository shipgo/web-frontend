import { describe, expect, it, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@mantine/core';

vi.mock('@utils/csv', () => ({
  toCsv: vi.fn(),
  csvFilename: (entidad) => `${entidad}_2026-01-01.csv`,
}));

import { notifications } from '@mantine/notifications';
import { toCsv } from '@utils/csv';
import { renderWithProviders } from '../../test/renderWithProviders';
import { useExportSelectedCsv } from './useExportSelectedCsv';

const COLUMNS = [{ header: 'Nombre', key: 'nombre' }];

const ROWS = [
  { id: 1, nombre: 'Uno' },
  { id: 2, nombre: 'Dos' },
  { id: 3, nombre: 'Tres' },
];

const TestComponent = ({ selectedIds, rows = ROWS }) => {
  const { exportarSeleccionados } = useExportSelectedCsv({
    columns: COLUMNS,
    entidad: 'items-seleccionados',
    entidadLabel: 'ítems',
  });

  return (
    <Button onClick={() => exportarSeleccionados(rows, selectedIds)}>Exportar seleccionados</Button>
  );
};

describe('useExportSelectedCsv', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
  });

  it('exporta sólo las filas cuyo id está en selectedIds, no todo el dataset', async () => {
    const selectedIds = new Set([1, 3]);
    const user = userEvent.setup();

    renderWithProviders(<TestComponent selectedIds={selectedIds} />);
    await user.click(screen.getByRole('button', { name: 'Exportar seleccionados' }));

    expect(toCsv).toHaveBeenCalledTimes(1);
    const [filas, columnas, filename] = toCsv.mock.calls[0];
    expect(filas).toEqual([ROWS[0], ROWS[2]]);
    expect(columnas).toBe(COLUMNS);
    expect(filename).toBe('items-seleccionados_2026-01-01.csv');

    expect(await screen.findByText('CSV generado')).toBeInTheDocument();
    expect(screen.getByText('Se exportaron 2 ítems.')).toBeInTheDocument();
  });

  it('avisa y no genera el CSV si no hay filas seleccionadas', async () => {
    const user = userEvent.setup();
    renderWithProviders(<TestComponent selectedIds={new Set()} />);

    await user.click(screen.getByRole('button', { name: 'Exportar seleccionados' }));

    expect(await screen.findByText('Sin datos para exportar')).toBeInTheDocument();
    expect(toCsv).not.toHaveBeenCalled();
  });
});
