import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { restclient } from './restclient';

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

describe('restclient — 401 de changePassword (SHG-FE-107)', () => {
  let calls;

  beforeEach(() => {
    calls = [];
    restclient.defaults.adapter = (config) => {
      calls.push(config.url);
      return rejectWith401(config);
    };
  });

  afterEach(() => {
    restclient.defaults.adapter = originalAdapter;
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('no dispara el refresh ni redirige a /login: rechaza el 401 original', async () => {
    setPath('/portal/perfil');
    await expect(
      restclient.post('/changePassword', { oldPassword: 'x', newPassword: 'y' }),
    ).rejects.toMatchObject({ response: { status: 401 } });
    expect(calls).toEqual(['/changePassword']);
    expect(window.location.href).toBe('/portal/perfil');
  });

  it('un 401 de otro endpoint sí intenta el refresh', async () => {
    setPath('/portal/perfil');
    await expect(restclient.get('/envios/1')).rejects.toBeTruthy();
    expect(calls).toContain('/refresh');
  });
});
