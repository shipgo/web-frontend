import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@mantine/core';
import { notifications } from '@mantine/notifications';

import { renderWithProviders } from '../../test/renderWithProviders';
import { useBulkDelete } from './useBulkDelete';

const ITEMS = [
  { id: 1, nombre: 'Uno' },
  { id: 2, nombre: 'Dos' },
];

const TestComponent = ({ deleteFn, onSettled, items = ITEMS, excluded = [] }) => {
  const { confirmBulkDelete } = useBulkDelete({
    deleteFn,
    singular: 'elemento',
    plural: 'elementos',
    getLabel: (item) => item.nombre,
    onSettled,
  });

  return <Button onClick={() => confirmBulkDelete(items, excluded)}>Eliminar seleccionados</Button>;
};

describe('useBulkDelete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // El store de `@mantine/notifications` es un singleton fuera del árbol de
    // React: sobrevive al `cleanup` automático entre tests, así que un toast
    // de un test anterior puede seguir montado y romper un `findByText` (ej.
    // "multiple elements found") en el siguiente.
    notifications.clean();
  });

  it('pide confirmación con la cantidad y, al confirmar, borra cada ítem (éxito total)', async () => {
    const deleteFn = vi.fn().mockResolvedValue({});
    const onSettled = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<TestComponent deleteFn={deleteFn} onSettled={onSettled} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar seleccionados' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/eliminar 2 elementos/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(deleteFn).toHaveBeenCalledTimes(2));
    expect(deleteFn).toHaveBeenCalledWith(1);
    expect(deleteFn).toHaveBeenCalledWith(2);

    expect(await screen.findByText('Eliminados')).toBeInTheDocument();
    expect(screen.getByText('Se eliminaron 2 elementos.')).toBeInTheDocument();
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
  });

  it('no pide confirmación si no hay ítems seleccionados', async () => {
    const deleteFn = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<TestComponent deleteFn={deleteFn} items={[]} />);
    await user.click(screen.getByRole('button', { name: 'Eliminar seleccionados' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(deleteFn).not.toHaveBeenCalled();
  });

  it('reporta fallos parciales (409 en uno) sin abortar el resto, y limpia/refresca al final', async () => {
    const deleteFn = vi.fn((id) =>
      id === 1
        ? Promise.reject({ response: { status: 409, data: { message: 'No se puede eliminar Uno' } } })
        : Promise.resolve({}),
    );
    const onSettled = vi.fn();
    const user = userEvent.setup();

    renderWithProviders(<TestComponent deleteFn={deleteFn} onSettled={onSettled} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar seleccionados' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(deleteFn).toHaveBeenCalledTimes(2));

    expect(await screen.findByText('Eliminación parcial')).toBeInTheDocument();
    expect(screen.getByText(/Se eliminaron 1 de 2 elementos/)).toBeInTheDocument();
    expect(screen.getByText(/No se puede eliminar Uno/)).toBeInTheDocument();

    // Siempre limpia selección + refresca, haya o no fallos parciales.
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
  });

  it('reporta fallo total (todos 404) con un toast distinto al de éxito parcial', async () => {
    const deleteFn = vi.fn().mockRejectedValue({ response: { status: 404 } });
    const user = userEvent.setup();

    renderWithProviders(<TestComponent deleteFn={deleteFn} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar seleccionados' }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(deleteFn).toHaveBeenCalledTimes(2));

    expect(await screen.findByText('No se pudo eliminar')).toBeInTheDocument();
    expect(screen.getByText(/No se pudo eliminar ningún elemento/)).toBeInTheDocument();
    expect(screen.queryByText('Eliminación parcial')).not.toBeInTheDocument();
  });

  it('los ítems excluidos de antemano nunca llaman a deleteFn y se reportan junto a los fallos reales', async () => {
    const deleteFn = vi.fn().mockResolvedValue({});
    const onSettled = vi.fn();
    const user = userEvent.setup();
    const excluido = { id: 99, nombre: 'Tres' };

    renderWithProviders(
      <TestComponent
        deleteFn={deleteFn}
        onSettled={onSettled}
        excluded={[{ item: excluido, reason: 'no se puede eliminar en su estado actual' }]}
      />,
    );

    await user.click(screen.getByRole('button', { name: 'Eliminar seleccionados' }));

    const dialog = await screen.findByRole('dialog');
    // La cantidad del modal cuenta también los excluidos (3 = 2 + 1).
    expect(within(dialog).getByText(/eliminar 3 elementos/i)).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(deleteFn).toHaveBeenCalledTimes(2));
    expect(deleteFn).not.toHaveBeenCalledWith(99);

    expect(await screen.findByText('Eliminación parcial')).toBeInTheDocument();
    expect(screen.getByText(/Se eliminaron 2 de 3 elementos/)).toBeInTheDocument();
    expect(screen.getByText(/Tres \(no se puede eliminar en su estado actual\)/)).toBeInTheDocument();
    await waitFor(() => expect(onSettled).toHaveBeenCalledTimes(1));
  });

  it('un doble click en "Eliminar" mientras el borrado está pendiente no duplica los DELETE', async () => {
    const resolvers = [];
    const deleteFn = vi.fn(() => new Promise((resolve) => resolvers.push(resolve)));
    const user = userEvent.setup();

    renderWithProviders(<TestComponent deleteFn={deleteFn} />);

    await user.click(screen.getByRole('button', { name: 'Eliminar seleccionados' }));
    const dialog = await screen.findByRole('dialog');
    const confirmBtn = within(dialog).getByRole('button', { name: 'Eliminar' });

    // Doble click "de verdad": dos eventos síncronos, sin esperar entre medio
    // a que React re-renderice el botón como `loading` (recién ahí quedaría
    // disabled) — el guard interno de `useBulkDelete` es lo que tiene que
    // frenar la segunda invocación, no el atributo `disabled` del botón.
    fireEvent.click(confirmBtn);
    fireEvent.click(confirmBtn);

    expect(deleteFn).toHaveBeenCalledTimes(ITEMS.length);

    resolvers.forEach((resolve) => resolve({}));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(await screen.findByText('Eliminados')).toBeInTheDocument();
  });
});
