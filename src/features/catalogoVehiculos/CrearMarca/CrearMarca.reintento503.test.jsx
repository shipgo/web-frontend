import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppShell, MantineProvider } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { AxiosError } from 'axios';

import { restclient } from '@config/restclient';
import { MAX_503_RETRIES } from '@config/retry503';
import { BUSY_MESSAGE } from '@domain/apiError';

import CrearMarca from './index';

// SHG-FE-131: integración formulario ↔ interceptor real de `restclient` (sin
// mockear la API). `Retry-After: 0` para no depender de timers en el form; las
// esperas reales se prueban con timers falsos en `restclient.test.js`.
const originalAdapter = restclient.defaults.adapter;

const fail503 = (data) => (config) =>
  Promise.reject(
    new AxiosError('503', AxiosError.ERR_BAD_RESPONSE, config, null, {
      status: 503,
      data,
      config,
      headers: { 'retry-after': '0' },
      statusText: '',
    }),
  );

const ok = (config) =>
  Promise.resolve({ data: { id: 1 }, status: 201, statusText: 'Created', headers: {}, config });

const renderForm = () =>
  render(
    <MantineProvider>
      <AppShell footer={{ height: 60 }}>
        <CrearMarca />
      </AppShell>
    </MantineProvider>,
  );

const submit = async () => {
  const user = userEvent.setup();
  renderForm();
  await user.type(screen.getByLabelText(/^Nombre/), 'Scania');
  await user.click(screen.getByRole('button', { name: /crear marca/i }));
};

describe('CrearMarca — 503 por lock (SHG-FE-131)', () => {
  let show;

  beforeEach(() => {
    show = vi.spyOn(notifications, 'show').mockImplementation(() => 'id');
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    restclient.defaults.adapter = originalAdapter;
    vi.restoreAllMocks();
  });

  it('un 503 pasajero se reintenta solo y la marca se crea sin mostrar error', async () => {
    const calls = [];
    restclient.defaults.adapter = (config) => {
      calls.push(config.url);
      return calls.length === 1 ? fail503({})(config) : ok(config);
    };

    await submit();

    await waitFor(() =>
      expect(show).toHaveBeenCalledWith(expect.objectContaining({ color: 'green' })),
    );
    expect(calls).toHaveLength(2);
    expect(show).not.toHaveBeenCalledWith(expect.objectContaining({ color: 'red' }));
  });

  it('con 503 persistente agota los reintentos y muestra el «probá de nuevo» del backend', async () => {
    const message = 'No pudimos guardar porque el recurso está ocupado, probá de nuevo.';
    const calls = [];
    restclient.defaults.adapter = (config) => {
      calls.push(config.url);
      return fail503({ statusCode: 503, message })(config);
    };

    await submit();

    await waitFor(() =>
      expect(show).toHaveBeenCalledWith(expect.objectContaining({ color: 'red', message })),
    );
    expect(calls).toHaveLength(1 + MAX_503_RETRIES);
  });

  it('con 503 persistente sin message usa el texto propio de «sistema ocupado»', async () => {
    restclient.defaults.adapter = fail503({});

    await submit();

    await waitFor(() =>
      expect(show).toHaveBeenCalledWith(
        expect.objectContaining({ color: 'red', message: BUSY_MESSAGE }),
      ),
    );
  });
});
