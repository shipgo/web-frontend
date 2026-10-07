import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AxiosError } from 'axios';

import { restclient } from '@config/restclient';
import { useAuthStore } from '@stores/auth.store';
import AuthProvider from '@providers/AuthProvider';

import { renderWithProviders } from '../../test/renderWithProviders';
import LoginPage from './index';

/**
 * SHG-FE-107 — `login()` ya no prende `isLoading`, así que el redirect post-login
 * de `handleFormSubmit` (`?redirect=`) compite con el efecto de `AuthProvider`
 * (autenticado en `/login` → home por rol). Se prueba con el store, el
 * `AuthProvider` y el router REALES; sólo el transporte (axios adapter) es falso.
 */
const originalAdapter = restclient.defaults.adapter;

const ok = (config, data = {}) =>
  Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });

const fail = (config, status) =>
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

describe('Login + AuthProvider — redirect post-login (SHG-FE-107)', () => {
  beforeEach(() => {
    window.localStorage.clear();
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
    vi.restoreAllMocks();
  });

  const renderLogin = () =>
    renderWithProviders(
      <AuthProvider>
        <LoginPage />
      </AuthProvider>,
      { route: '/login?redirect=%2Fenvios' },
    );

  const typeCredentials = async (user, password) => {
    await user.type(await screen.findByLabelText('Usuario'), 'admin');
    await user.type(screen.getByLabelText('Contraseña'), password);
    await user.click(screen.getByRole('button', { name: 'Iniciar sesión' }));
  };

  it('con ?redirect=/envios, un login exitoso termina en /envios (no en el home por rol)', async () => {
    restclient.defaults.adapter = (config) => {
      if (config.url.includes('/refresh')) return fail(config, 401);
      if (config.url.includes('/login')) return ok(config);
      if (config.url.includes('/whoami')) return ok(config, USER);
      return fail(config, 404);
    };
    const user = userEvent.setup();
    renderLogin();
    await typeCredentials(user, 'Shipgo123!');

    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
    await waitFor(() => expect(window.location.pathname).toBe('/envios'));
    // Se queda ahí: ningún otro redirect lo pisa después.
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(window.location.pathname).toBe('/envios');
  });

  it('login fallido: /login sigue montado y conserva el usuario tipeado', async () => {
    restclient.defaults.adapter = (config) => {
      if (config.url.includes('/refresh')) return fail(config, 401);
      if (config.url.includes('/login')) return fail(config, 401);
      return fail(config, 404);
    };
    const user = userEvent.setup();
    renderLogin();
    await typeCredentials(user, 'mala');

    expect(await screen.findByText(/usuario y\/o contraseña incorrectos/i)).toBeInTheDocument();
    expect(screen.getByLabelText('Usuario')).toHaveValue('admin');
  });
});
