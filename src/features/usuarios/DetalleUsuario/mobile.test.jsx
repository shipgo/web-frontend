import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Route, Router } from 'wouter';
import { memoryLocation } from 'wouter/memory-location';

vi.mock('@hooks/useIsMobile', () => ({ useIsMobile: () => true, MOBILE_QUERY: '' }));

vi.mock('@api', () => ({
  usuarioApi: { getById: vi.fn(), requestPasswordReset: vi.fn() },
}));

import { usuarioApi } from '@api';
import { useAuthStore } from '@stores/auth.store';
import DetalleUsuario from './index';

describe('DetalleUsuario en mobile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('la acción principal va en la barra fija y las secciones son un acordeón', async () => {
    useAuthStore.setState({ user: { id: 9, username: 'su', authorities: ['ROLE_SUPERUSER'] } });
    usuarioApi.getById.mockResolvedValue({
      id: 4,
      nombre: 'Nom',
      apellido: 'Ape',
      username: 'u4',
      email: 'u4@shipgo.com',
      authorities: ['ROLE_CHOFER'],
    });
    const { hook } = memoryLocation({ path: '/usuarios/4', static: true });
    render(
      <MantineProvider>
        <ModalsProvider>
          <Router hook={hook}>
            <Route path="/usuarios/:id" component={DetalleUsuario} />
          </Router>
        </ModalsProvider>
      </MantineProvider>,
    );

    const bar = await screen.findByTestId('sticky-action-bar', {}, { timeout: 5000 });
    expect(bar).toHaveTextContent('Editar');
    expect(screen.getByRole('button', { name: /Información personal/ })).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('button', { name: /Información laboral/ })).toHaveAttribute('aria-expanded', 'false');
  });
});
