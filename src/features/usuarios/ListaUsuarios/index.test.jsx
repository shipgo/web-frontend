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
});
