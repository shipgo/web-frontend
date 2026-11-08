import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { renderWithProviders } from '../../../test/renderWithProviders';

vi.mock('@hooks/useIsMobile', () => ({ useIsMobile: () => true, MOBILE_QUERY: '' }));

vi.mock('@api/usuario.api', () => ({
  usuarioApi: { get: vi.fn(), delete: vi.fn() },
  authorityApi: { getAll: vi.fn().mockResolvedValue([]) },
}));

import { usuarioApi } from '@api/usuario.api';
import { useAuthStore } from '@stores/auth.store';
import ListaUsuarios from './index';

const OTRO = {
  id: 2,
  nombre: 'Otra',
  apellido: 'Persona',
  username: 'otra',
  email: 'otra@shipgo.com',
  authorities: ['ROLE_CHOFER'],
  sucursal: { nombre: 'Centro' },
};

describe('ListaUsuarios en mobile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAuthStore.setState({ user: { id: 1, username: 'yo', authorities: ['ROLE_SUPERUSER'] } });
    usuarioApi.get.mockResolvedValue({ content: [OTRO], totalElements: 1, totalPages: 1 });
  });

  it('muestra tarjetas en vez de tabla y el botón de filtros', async () => {
    renderWithProviders(<ListaUsuarios />);

    expect(await screen.findByText('Otra Persona')).toBeInTheDocument();
    expect(screen.getAllByTestId('list-card')).toHaveLength(1);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
    expect(screen.getByText('Centro')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Filtros/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Crear usuario' })).toBeInTheDocument();
  });

  it('la selección por tarjeta habilita el banner de selección', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ListaUsuarios />);

    await user.click(await screen.findByRole('checkbox', { name: 'Seleccionar usuario otra' }));
    expect(await screen.findByText('1 usuario seleccionado')).toBeInTheDocument();
  });

  it('abre la hoja de filtros con los campos secundarios', async () => {
    const user = userEvent.setup();
    renderWithProviders(<ListaUsuarios />);

    await user.click(await screen.findByRole('button', { name: /Filtros/ }));
    expect(await screen.findByText('Localidad')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Limpiar' })).toBeInTheDocument();
  });
});
