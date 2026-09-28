import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { notifications } from '@mantine/notifications';

import { renderWithProviders } from '../../../test/renderWithProviders';

// `useGetUsuarios.js` importa `usuarioApi` vía el wrapper de feature
// (`../../api/usuarios.api` → `@api/usuario.api`), no desde `@api` bare —
// hay que mockear ese submódulo puntual (mismo patrón que
// `ListaVehiculos`/`ListaMantenimientos`), no el índice agregador.
vi.mock('@api/usuario.api', () => ({
  usuarioApi: { get: vi.fn(), delete: vi.fn() },
  authorityApi: { getAll: vi.fn().mockResolvedValue([]) },
}));

import { usuarioApi } from '@api/usuario.api';
import { useAuthStore } from '@stores/auth.store';
import ListaUsuarios from './index';

const SELF = {
  id: 1,
  nombre: 'Yo',
  apellido: 'Mismo',
  username: 'yo',
  email: 'yo@shipgo.com',
  authorities: ['ROLE_ADMIN'],
};

const OTRO = {
  id: 2,
  nombre: 'Otra',
  apellido: 'Persona',
  username: 'otra',
  email: 'otra@shipgo.com',
  authorities: ['ROLE_ADMIN'],
};

describe('ListaUsuarios — la selección masiva nunca incluye al propio usuario (SHG-FE-095)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    notifications.clean();
    useAuthStore.setState({ user: { id: 1, username: 'yo' } });
  });

  it('"Seleccionar todos" tilda a los demás pero nunca a la propia fila (disabled)', async () => {
    usuarioApi.get.mockResolvedValue({ content: [SELF, OTRO], totalElements: 2, totalPages: 1 });

    const user = userEvent.setup();
    renderWithProviders(<ListaUsuarios />);

    await screen.findByText('Otra Persona');

    const selfCheckbox = screen.getByRole('checkbox', { name: 'No podés seleccionar tu propio usuario' });
    expect(selfCheckbox).toBeDisabled();
    expect(selfCheckbox).not.toBeChecked();

    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar todos los usuarios' }));

    // De los 2 usuarios de la página, sólo se seleccionó 1 (el otro).
    expect(await screen.findByText('1 usuario seleccionado')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Seleccionar usuario otra' })).toBeChecked();
    expect(selfCheckbox).not.toBeChecked();
  });

  it('"Eliminar seleccionados" nunca llama a delete con el id del propio usuario', async () => {
    usuarioApi.get.mockResolvedValue({ content: [SELF, OTRO], totalElements: 2, totalPages: 1 });
    usuarioApi.delete.mockResolvedValue({});

    const user = userEvent.setup();
    renderWithProviders(<ListaUsuarios />);

    await screen.findByText('Otra Persona');
    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar todos los usuarios' }));
    expect(await screen.findByText('1 usuario seleccionado')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar seleccionados' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/eliminar 1 usuario/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(usuarioApi.delete).toHaveBeenCalledWith(2));
    expect(usuarioApi.delete).not.toHaveBeenCalledWith(1);
    expect(usuarioApi.delete).toHaveBeenCalledTimes(1);
  });

  it('si el único usuario listado es el propio, no se puede borrar (ni por fila ni por selección masiva)', async () => {
    usuarioApi.get.mockResolvedValue({ content: [SELF], totalElements: 1, totalPages: 1 });

    const user = userEvent.setup();
    renderWithProviders(<ListaUsuarios />);

    await screen.findByText('Yo Mismo');

    // Acción de fila ausente: el menú de la única fila no ofrece "Eliminar".
    await user.click(screen.getByLabelText('Acciones de Yo Mismo'));
    expect(screen.queryByText('Eliminar')).not.toBeInTheDocument();
    await user.keyboard('{Escape}');

    // Checkbox de la fila deshabilitado y sin tildar.
    const selfCheckbox = screen.getByRole('checkbox', { name: 'No podés seleccionar tu propio usuario' });
    expect(selfCheckbox).toBeDisabled();
    expect(selfCheckbox).not.toBeChecked();

    // "Seleccionar todos" con la propia fila como único registro no
    // selecciona nada: el banner de selección masiva nunca llega a mostrarse.
    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar todos los usuarios' }));
    expect(screen.queryByText(/usuario seleccionado/)).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Acciones' })).not.toBeInTheDocument();
  });

  it('el filtro de confirmación (no sólo el de selección) descarta al usuario propio antes de pegarle al endpoint', async () => {
    const OTRO2 = {
      id: 3,
      nombre: 'Otra',
      apellido: 'Mas',
      username: 'otra2',
      email: 'otra2@shipgo.com',
      authorities: ['ROLE_ADMIN'],
    };
    usuarioApi.get.mockResolvedValue({ content: [OTRO, OTRO2], totalElements: 2, totalPages: 1 });
    usuarioApi.delete.mockResolvedValue({});

    // Al momento de seleccionar, el usuario logueado es un tercero: ninguna
    // fila está deshabilitada por `isSelf` y "Seleccionar todos" tilda tanto
    // a OTRO (id 2) como a OTRO2 (id 3).
    useAuthStore.setState({ user: { id: 99, username: 'admin-temporal' } });

    const user = userEvent.setup();
    renderWithProviders(<ListaUsuarios />);

    await screen.findByText('Otra Persona');
    await user.click(screen.getByRole('checkbox', { name: 'Seleccionar todos los usuarios' }));
    expect(await screen.findByText('2 usuarios seleccionados')).toBeInTheDocument();

    // El usuario logueado "pasa a ser" uno de los ya seleccionados (ej.
    // refresh de sesión): el filtro de la selección ya corrió y no vuelve a
    // correr, pero el segundo filtro —el que actúa recién al confirmar el
    // borrado masivo, antes de llamar a `deleteFn`— tiene que sacarlo igual.
    useAuthStore.setState({ user: { id: 2, username: 'otra' } });

    await user.click(screen.getByRole('button', { name: 'Acciones' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Eliminar seleccionados' }));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/eliminar 1 usuario/)).toBeInTheDocument();
    await user.click(within(dialog).getByRole('button', { name: 'Eliminar' }));

    await waitFor(() => expect(usuarioApi.delete).toHaveBeenCalledWith(3));
    expect(usuarioApi.delete).not.toHaveBeenCalledWith(2);
    expect(usuarioApi.delete).toHaveBeenCalledTimes(1);
  });
});
