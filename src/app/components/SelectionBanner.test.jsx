import { describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../test/renderWithProviders';
import SelectionBanner from './SelectionBanner';

const baseProps = {
  singular: 'ítem seleccionado',
  plural: 'ítems seleccionados',
  onClear: () => {},
};

describe('SelectionBanner', () => {
  it('no renderiza nada cuando count es 0', () => {
    renderWithProviders(<SelectionBanner {...baseProps} count={0} />);
    // `MantineProvider` inyecta sus propios `<style>` en el árbol, así que no
    // alcanza con `toBeEmptyDOMElement()` sobre el container — se verifica
    // en cambio que el banner (su botón "Deseleccionar") no está.
    expect(screen.queryByRole('button', { name: 'Deseleccionar' })).not.toBeInTheDocument();
  });

  it('muestra la cantidad seleccionada (singular/plural)', () => {
    renderWithProviders(<SelectionBanner {...baseProps} count={1} />);
    expect(screen.getByText('1 ítem seleccionado')).toBeInTheDocument();
  });

  it('muestra el plural cuando hay más de un elemento seleccionado', () => {
    renderWithProviders(<SelectionBanner {...baseProps} count={3} />);
    expect(screen.getByText('3 ítems seleccionados')).toBeInTheDocument();
  });

  it('"Deseleccionar" llama a onClear', async () => {
    const onClear = vi.fn();
    const user = userEvent.setup();
    renderWithProviders(<SelectionBanner {...baseProps} count={2} onClear={onClear} />);

    await user.click(screen.getByRole('button', { name: 'Deseleccionar' }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('sin onExport ni onDelete no muestra el botón "Acciones"', () => {
    renderWithProviders(<SelectionBanner {...baseProps} count={2} />);
    expect(screen.queryByRole('button', { name: 'Acciones' })).not.toBeInTheDocument();
  });

  it('con sólo onExport, el menú muestra "Exportar seleccionados" pero no "Eliminar seleccionados" ni "Editar seleccionados"', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SelectionBanner {...baseProps} count={2} onExport={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    expect(await screen.findByRole('menuitem', { name: 'Exportar seleccionados' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Eliminar seleccionados' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Editar seleccionados' })).not.toBeInTheDocument();
  });

  it('con sólo onDelete, el menú muestra "Eliminar seleccionados" pero no "Exportar seleccionados" ni "Editar seleccionados"', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SelectionBanner {...baseProps} count={2} onDelete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    expect(await screen.findByRole('menuitem', { name: 'Eliminar seleccionados' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Exportar seleccionados' })).not.toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Editar seleccionados' })).not.toBeInTheDocument();
  });

  it('con ambos handlers, el menú muestra los dos ítems y nunca "Editar seleccionados"', async () => {
    const user = userEvent.setup();
    renderWithProviders(<SelectionBanner {...baseProps} count={2} onExport={vi.fn()} onDelete={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Acciones' }));

    // `hidden: true`: Mantine anima la apertura del `Menu` (floating-ui
    // recalcula posición) con estados intermedios donde el motor de
    // accesibilidad de testing-library puede reportar momentáneamente el
    // ítem como "hidden" en jsdom (sin layout real) — comparar dos ítems
    // presentes a la vez con la visibilidad default es flaky (ver nota de
    // `ListaViajes/index.test.jsx`, SHG-FE-096, sobre pedir el mismo rol dos
    // veces seguidas ni bien abre el menú). Acá sólo importa que ambos ítems
    // estén montados con el texto correcto, no el estado visual exacto.
    const items = await screen.findAllByRole('menuitem', { hidden: true });
    const labels = items.map((item) => item.textContent);
    expect(labels).toContain('Exportar seleccionados');
    expect(labels).toContain('Eliminar seleccionados');
    expect(labels).not.toContain('Editar seleccionados');
  });

  it('clickear "Exportar seleccionados" llama a onExport (y no a onDelete)', async () => {
    const onExport = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<SelectionBanner {...baseProps} count={3} onExport={onExport} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Exportar seleccionados' }));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onDelete).not.toHaveBeenCalled();
  });

  it('clickear "Eliminar seleccionados" llama a onDelete (y no a onExport)', async () => {
    const onExport = vi.fn();
    const onDelete = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<SelectionBanner {...baseProps} count={3} onExport={onExport} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar seleccionados' }));

    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(onExport).not.toHaveBeenCalled();
  });
});
