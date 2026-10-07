import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MantineProvider } from '@mantine/core';

const mockState = {
  user: null,
  isLoading: false,
  isAuthenticated: false,
  initUser: vi.fn().mockResolvedValue(false),
};
vi.mock('@stores/auth.store', () => ({
  useAuthStore: () => mockState,
}));

const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/', mockSetLocation],
}));

import AuthProvider from './AuthProvider';

const renderAt = (path) => {
  window.history.pushState({}, '', path);
  return render(
    <MantineProvider>
      <AuthProvider>
        <div>contenido</div>
      </AuthProvider>
    </MantineProvider>,
  );
};

describe('AuthProvider — redirección a /login sin sesión (SHG-FE-104)', () => {
  beforeEach(() => {
    mockSetLocation.mockReset();
  });

  it('una ruta desconocida sin sesión NO redirige a /login (se ve la 404 pública)', async () => {
    renderAt('/cualquier-cosa');
    expect(await screen.findByText('contenido')).toBeInTheDocument();
    expect(mockSetLocation).not.toHaveBeenCalled();
  });

  it('una ruta protegida real sin sesión sí redirige a /login', async () => {
    renderAt('/envios/12');
    await waitFor(() => expect(mockSetLocation).toHaveBeenCalledWith('/login'));
  });

  it('una ruta pública sin sesión no redirige', async () => {
    renderAt('/tracking/ABC');
    expect(await screen.findByText('contenido')).toBeInTheDocument();
    expect(mockSetLocation).not.toHaveBeenCalled();
  });
});
