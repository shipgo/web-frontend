import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { AxiosError } from 'axios';
import { MantineProvider } from '@mantine/core';

import { restclient } from '@config/restclient';
import { BOOTSTRAP_TIMEOUT_MS } from '@constants/timeouts';
import { useAuthStore } from '@stores/auth.store';

const mockSetLocation = vi.fn();
vi.mock('wouter', () => ({
  useLocation: () => ['/', mockSetLocation],
}));

import AuthProvider from './AuthProvider';

const originalAdapter = restclient.defaults.adapter;
const TITULO = 'No pudimos conectar con el servidor';

// Adapter que simula a axios con la API colgada: nunca responde, pero respeta
// `config.timeout` rechazando con ECONNABORTED como lo hace el adapter real.
const hangingAdapter = (config) =>
  new Promise((_, reject) => {
    if (config.timeout) {
      setTimeout(
        () => reject(new AxiosError('timeout', AxiosError.ECONNABORTED, config)),
        config.timeout,
      );
    }
  });

const ok = (config, data) =>
  Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });

const failWith = (status) => (config) =>
  Promise.reject(
    new AxiosError('err', AxiosError.ERR_BAD_RESPONSE, config, null, {
      status,
      data: {},
      config,
      headers: {},
      statusText: '',
    }),
  );

const USER = {
  id: 1,
  username: 'admin',
  nombre: 'A',
  apellido: 'B',
  authorities: [{ name: 'ROLE_ADMIN' }],
};

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

describe('AuthProvider — API caída en el bootstrap (SHG-FE-110)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockSetLocation.mockReset();
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      connectionError: null,
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restclient.defaults.adapter = originalAdapter;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('con la API colgada muestra el loader y a los ~10 s la pantalla de conexión', async () => {
    restclient.defaults.adapter = hangingAdapter;
    renderAt('/envios');

    await act(() => vi.advanceTimersByTimeAsync(BOOTSTRAP_TIMEOUT_MS - 1000));
    expect(screen.queryByText(TITULO)).not.toBeInTheDocument();
    expect(screen.queryByText('contenido')).not.toBeInTheDocument();

    await act(() => vi.advanceTimersByTimeAsync(1500));
    expect(screen.getByText(TITULO)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();
    expect(mockSetLocation).not.toHaveBeenCalled();
  });

  it('Reintentar vuelve a intentar y entra si la API responde', async () => {
    restclient.defaults.adapter = hangingAdapter;
    renderAt('/envios');
    await act(() => vi.advanceTimersByTimeAsync(BOOTSTRAP_TIMEOUT_MS + 500));
    expect(screen.getByRole('button', { name: 'Reintentar' })).toBeInTheDocument();

    restclient.defaults.adapter = (config) =>
      config.url === '/refresh' ? ok(config, { access_token: 't' }) : ok(config, USER);
    fireEvent.click(screen.getByRole('button', { name: 'Reintentar' }));
    await act(() => vi.advanceTimersByTimeAsync(0));

    expect(screen.getByText('contenido')).toBeInTheDocument();
    expect(screen.queryByText(TITULO)).not.toBeInTheDocument();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
  });

  it('un 5xx en el bootstrap también muestra la pantalla (no manda a /login)', async () => {
    restclient.defaults.adapter = failWith(503);
    renderAt('/viajes');
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.getByText(TITULO)).toBeInTheDocument();
    expect(mockSetLocation).not.toHaveBeenCalled();
  });

  it('un 401 en el bootstrap sigue el flujo de sesión: /login en ruta protegida', async () => {
    restclient.defaults.adapter = failWith(401);
    renderAt('/envios');
    await act(() => vi.advanceTimersByTimeAsync(0));
    expect(screen.queryByText(TITULO)).not.toBeInTheDocument();
    expect(mockSetLocation).toHaveBeenCalledWith('/login');
  });

  it('en una ruta pública con la API caída NO bloquea: renderiza el contenido', async () => {
    restclient.defaults.adapter = hangingAdapter;
    renderAt('/tracking/ABC');
    await act(() => vi.advanceTimersByTimeAsync(BOOTSTRAP_TIMEOUT_MS + 500));
    expect(screen.getByText('contenido')).toBeInTheDocument();
    expect(screen.queryByText(TITULO)).not.toBeInTheDocument();
    expect(mockSetLocation).not.toHaveBeenCalled();
  });
});
