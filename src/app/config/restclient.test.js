import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { AxiosError } from 'axios';

import { CSV_MAX_ROWS } from '@utils/csv';
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
