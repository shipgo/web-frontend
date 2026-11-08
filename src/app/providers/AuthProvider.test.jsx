import { afterEach, describe, expect, it, vi, beforeEach } from 'vitest';
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

// El splash de marca (verde) es SOLO de la web instalada en el celular; en el navegador se ve el
// loader de siempre mientras se resuelve la sesión.
describe('AuthProvider — pantalla de carga de la sesión', () => {
  const originalMatchMedia = window.matchMedia;

  const simular = ({ standalone, movil }) => {
    window.matchMedia = vi.fn().mockImplementation((query) => ({
      matches: query.includes('display-mode') ? standalone : movil,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  };

  beforeEach(() => {
    mockSetLocation.mockReset();
    // La sesión nunca se resuelve: queda en la pantalla de carga.
    mockState.initUser = vi.fn(() => new Promise(() => {}));
  });

  afterEach(() => {
    window.matchMedia = originalMatchMedia;
    mockState.initUser = vi.fn().mockResolvedValue(false);
  });

  it('en el navegador (pestaña) muestra el loader, no el splash verde', () => {
    simular({ standalone: false, movil: true });
    const { container } = renderAt('/');

    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
    expect(container.querySelector('.mantine-Loader-root')).not.toBeNull();
  });

  it('instalada en escritorio tampoco muestra el splash', () => {
    simular({ standalone: true, movil: false });
    renderAt('/');

    expect(screen.queryByTestId('splash-screen')).not.toBeInTheDocument();
  });

  it('instalada en el celular muestra el splash de marca', () => {
    simular({ standalone: true, movil: true });
    renderAt('/');

    expect(screen.getByTestId('splash-screen')).toBeInTheDocument();
  });
});
