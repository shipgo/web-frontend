import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AxiosError } from 'axios';

import { CSV_MAX_ROWS } from '@utils/csv';
import { usuarioApi } from '@api/usuario.api';
import {
  DEFAULT_TIMEOUT_MS,
  EXPORT_TIMEOUT_MS,
  UPLOAD_TIMEOUT_MS,
  restclient,
} from './restclient';

const originalAdapter = restclient.defaults.adapter;
const originalLocation = window.location;

const rejectWith401 = (config) =>
  Promise.reject(
    Object.assign(new Error('401'), { config, response: { status: 401, data: {}, config } }),
  );

const setPath = (pathname) => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { pathname, href: pathname, search: '' },
  });
};

describe('restclient — 401 con refresh fallido (SHG-FE-104)', () => {
  beforeEach(() => {
    // Toda request (incluido el /refresh) responde 401.
    restclient.defaults.adapter = rejectWith401;
  });

  afterEach(() => {
    restclient.defaults.adapter = originalAdapter;
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('en una ruta desconocida NO redirige a /login (queda la 404 pública)', async () => {
    setPath('/cualquier-cosa');
    await expect(restclient.get('/envios/1')).rejects.toBeTruthy();
    expect(window.location.href).toBe('/cualquier-cosa');
  });

  it('en una ruta pública NO redirige a /login', async () => {
    setPath('/tracking/ABC');
    await expect(restclient.get('/envios/1')).rejects.toBeTruthy();
    expect(window.location.href).toBe('/tracking/ABC');
  });

  it('en una ruta protegida real sí redirige a /login', async () => {
    setPath('/envios/1');
    await expect(restclient.get('/envios/1')).rejects.toBeTruthy();
    expect(window.location.href).toBe('/login');
  });
});

describe('restclient — timeouts y errores de conexión (SHG-FE-110)', () => {
  afterEach(() => {
    restclient.defaults.adapter = originalAdapter;
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  const okResponse = (config) =>
    Promise.resolve({ data: {}, status: 200, statusText: 'OK', headers: {}, config });

  const captureTimeout = () => {
    const seen = [];
    restclient.defaults.adapter = (config) => {
      seen.push(config.timeout);
      return okResponse(config);
    };
    return seen;
  };

  const httpError = (status) => (config) =>
    Promise.reject(
      new AxiosError('err', AxiosError.ERR_BAD_RESPONSE, config, null, {
        status,
        data: {},
        config,
        headers: {},
        statusText: '',
      }),
    );

  // La request original da 401; el refresh falla con `refreshFailure`.
  const withRefreshFailure = (refreshFailure) => {
    restclient.defaults.adapter = (config) =>
      config.url.includes('/refresh') ? refreshFailure(config) : rejectWith401(config);
  };

  it('una request normal usa el timeout por defecto', async () => {
    const seen = captureTimeout();
    await restclient.get('/envios');
    expect(seen).toEqual([DEFAULT_TIMEOUT_MS]);
  });

  it('params.size >= CSV_MAX_ROWS usa el timeout de export (60 s)', async () => {
    const seen = captureTimeout();
    await restclient.get('/envios', { params: { size: CSV_MAX_ROWS } });
    await restclient.get('/envios', { params: { size: CSV_MAX_ROWS - 1 } });
    expect(seen).toEqual([EXPORT_TIMEOUT_MS, DEFAULT_TIMEOUT_MS]);
  });

  it('un timeout explícito de la request se respeta', async () => {
    const seen = captureTimeout();
    await restclient.get('/envios', { timeout: 0 });
    await restclient.get('/envios', { timeout: 5000, params: { size: CSV_MAX_ROWS } });
    expect(seen).toEqual([0, 5000]);
  });

  it('el upload de foto de perfil usa UPLOAD_TIMEOUT_MS', async () => {
    const seen = captureTimeout();
    await usuarioApi.uploadProfileFile(new File(['x'], 'foto.png', { type: 'image/png' }));
    expect(seen).toEqual([UPLOAD_TIMEOUT_MS]);
  });

  it.each([
    ['timeout', (config) => Promise.reject(new AxiosError('t', AxiosError.ECONNABORTED, config))],
    ['error de red', (config) => Promise.reject(new AxiosError('n', AxiosError.ERR_NETWORK, config))],
    ['5xx', httpError(503)],
  ])('401 con refresh que falla por %s en ruta protegida: NO redirige a /login y rechaza', async (_, failure) => {
    setPath('/envios/1');
    withRefreshFailure(failure);
    await expect(restclient.get('/envios/1')).rejects.toBeTruthy();
    expect(window.location.href).toBe('/envios/1');
  });

  it.each([401, 403])(
    '401 con refresh que responde %i en ruta protegida: sí redirige a /login',
    async (status) => {
      setPath('/envios/1');
      withRefreshFailure(httpError(status));
      await expect(restclient.get('/envios/1')).rejects.toBeTruthy();
      expect(window.location.href).toBe('/login');
    },
  );
});
