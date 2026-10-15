import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AxiosError, AxiosHeaders } from 'axios';

import { CSV_MAX_ROWS } from '@utils/csv';
import { EMPRESA_REQUERIDA_EVENT } from '@domain/empresa';
import { usuarioApi } from '@api/usuario.api';
import { classifyConnectionError } from '@utils/connectionError';
import {
  DEFAULT_503_WAIT_MS,
  MAX_503_RETRIES,
  MAX_503_TOTAL_WAIT_MS,
  parseRetryAfterMs,
} from './retry503';
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
    ['5xx', httpError(502)],
  ])('401 con refresh que falla por %s en ruta protegida: NO redirige a /login y rechaza', async (_, failure) => {
    setPath('/envios/1');
    withRefreshFailure(failure);
    await expect(restclient.get('/envios/1')).rejects.toBeTruthy();
    expect(window.location.href).toBe('/envios/1');
  });

  it('changePassword con contraseña incorrecta (401 de hoy): un refresh OK, UN reintento y termina rechazando el 401 sin loop ni redirect (SHG-FE-107)', async () => {
    setPath('/portal/perfil');
    const calls = [];
    restclient.defaults.adapter = (config) => {
      calls.push(config.url);
      return config.url.includes('/refresh') ? okResponse(config) : rejectWith401(config);
    };
    await expect(
      restclient.post('/changePassword', { oldPassword: 'x', newPassword: 'y' }),
    ).rejects.toMatchObject({ response: { status: 401 } });
    expect(calls).toEqual(['/changePassword', '/refresh', '/changePassword']);
    expect(window.location.href).toBe('/portal/perfil');
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

describe('restclient — 409 empresa_requerida (SHG-FE-116)', () => {
  const conflict = (code) => (config) =>
    Promise.reject(
      new AxiosError('409', AxiosError.ERR_BAD_REQUEST, config, null, {
        status: 409,
        data: { statusCode: 409, message: 'Primero tenés que crear tu empresa', code },
        config,
        headers: {},
        statusText: '',
      }),
    );

  afterEach(() => {
    restclient.defaults.adapter = originalAdapter;
  });

  it('emite el evento una sola vez y la promesa igual rechaza con el 409', async () => {
    restclient.defaults.adapter = conflict('empresa_requerida');
    const listener = vi.fn();
    window.addEventListener(EMPRESA_REQUERIDA_EVENT, listener);
    try {
      await expect(restclient.post('/user', {})).rejects.toMatchObject({
        response: { status: 409, data: { code: 'empresa_requerida' } },
      });
      expect(listener).toHaveBeenCalledTimes(1);
    } finally {
      window.removeEventListener(EMPRESA_REQUERIDA_EVENT, listener);
    }
  });

  it('un 409 con otro code no emite el evento', async () => {
    restclient.defaults.adapter = conflict('otro_conflicto');
    const listener = vi.fn();
    window.addEventListener(EMPRESA_REQUERIDA_EVENT, listener);
    try {
      await expect(restclient.post('/user', {})).rejects.toMatchObject({
        response: { status: 409 },
      });
      expect(listener).not.toHaveBeenCalled();
    } finally {
      window.removeEventListener(EMPRESA_REQUERIDA_EVENT, listener);
    }
  });
});

describe('restclient — reintento ante 503 con Retry-After (SHG-FE-131)', () => {
  const ok = (config, data = {}) =>
    Promise.resolve({ data, status: 200, statusText: 'OK', headers: {}, config });

  const fail = (status, { retryAfter, data = {} } = {}) => (config) =>
    Promise.reject(
      new AxiosError('err', AxiosError.ERR_BAD_RESPONSE, config, null, {
        status,
        data,
        config,
        headers: retryAfter === undefined ? {} : { 'retry-after': retryAfter },
        statusText: '',
      }),
    );

  /** Adapter que responde en orden la lista de `responders`; el último se repite. */
  const sequence = (...responders) => {
    const calls = [];
    restclient.defaults.adapter = (config) => {
      calls.push({ url: config.url, timeout: config.timeout });
      const responder = responders[Math.min(calls.length - 1, responders.length - 1)];
      return responder(config);
    };
    return calls;
  };

  /** Deja la promesa observada (sin unhandled rejection) para avanzar timers. */
  const settle = (promise) => {
    const state = { done: false };
    promise.then(
      (value) => Object.assign(state, { done: true, value }),
      (error) => Object.assign(state, { done: true, error }),
    );
    return state;
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    restclient.defaults.adapter = originalAdapter;
    Object.defineProperty(window, 'location', { configurable: true, value: originalLocation });
  });

  it('503 con Retry-After: 1 y después 200: espera 1 s, reintenta y termina bien', async () => {
    const calls = sequence(fail(503, { retryAfter: '1' }), (config) => ok(config, { id: 7 }));
    const result = settle(restclient.post('/envio', { a: 1 }));

    await vi.advanceTimersByTimeAsync(999);
    expect(calls).toHaveLength(1);
    expect(result.done).toBe(false);

    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2);
    expect(result.error).toBeUndefined();
    expect(result.value.data).toEqual({ id: 7 });
  });

  it('503 persistente sin Retry-After: sólo los reintentos del tope, con la espera fija, y rechaza el 503', async () => {
    const message = 'No pudimos completar la operación, probá de nuevo.';
    const calls = sequence(fail(503, { data: { statusCode: 503, message } }));
    const result = settle(restclient.get('/viajes/1'));

    await vi.advanceTimersByTimeAsync(DEFAULT_503_WAIT_MS * MAX_503_RETRIES + 5_000);
    expect(calls).toHaveLength(1 + MAX_503_RETRIES);
    expect(MAX_503_RETRIES).toBe(2);
    expect(result.error).toMatchObject({ response: { status: 503, data: { message } } });
    // El 503 final sigue clasificándose como antes (pantalla de conexión donde ya se usaba).
    expect(classifyConnectionError(result.error)).toBe('server');
  });

  it('respeta la espera de cada intento (1 s entre intentos sin header)', async () => {
    const calls = sequence(fail(503));
    const result = settle(restclient.get('/viajes/1'));

    await vi.advanceTimersByTimeAsync(DEFAULT_503_WAIT_MS - 1);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(DEFAULT_503_WAIT_MS);
    expect(calls).toHaveLength(3);
    expect(result.done).toBe(true);
  });

  it('un Retry-After más largo que el tope se recorta y no se pasa de la espera total', async () => {
    const calls = sequence(fail(503, { retryAfter: '30' }));
    const result = settle(restclient.get('/viajes/1'));

    await vi.advanceTimersByTimeAsync(MAX_503_TOTAL_WAIT_MS - 1);
    expect(calls).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(calls).toHaveLength(2);
    // Presupuesto agotado: no hay segundo reintento.
    await vi.advanceTimersByTimeAsync(60_000);
    expect(calls).toHaveLength(2);
    expect(result.error).toMatchObject({ response: { status: 503 } });
  });

  it.each([500, 502, 504, 409, 400])('un %i no se reintenta', async (status) => {
    const calls = sequence(fail(status, { retryAfter: '1' }));
    const result = settle(restclient.post('/envio', {}));
    await vi.advanceTimersByTimeAsync(20_000);
    expect(calls).toHaveLength(1);
    expect(result.error).toMatchObject({ response: { status } });
  });

  it('si la request se cancela durante la espera, corta con ERR_CANCELED y no reintenta', async () => {
    const calls = sequence(fail(503, { retryAfter: '5' }));
    const controller = new AbortController();
    const result = settle(restclient.get('/envios', { signal: controller.signal }));

    await vi.advanceTimersByTimeAsync(1_000);
    controller.abort();
    await vi.advanceTimersByTimeAsync(0);
    expect(result.error?.code).toBe('ERR_CANCELED');
    expect(classifyConnectionError(result.error)).toBeNull();

    await vi.advanceTimersByTimeAsync(20_000);
    expect(calls).toHaveLength(1);
  });

  it('una request ya cancelada no se reintenta', async () => {
    const controller = new AbortController();
    const calls = sequence((config) => {
      controller.abort();
      return fail(503)(config);
    });
    const result = settle(restclient.get('/envios', { signal: controller.signal }));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(calls).toHaveLength(1);
    expect(result.error).toBeTruthy();
  });

  it('503 y después 401: el reintento sigue el refresh de siempre y termina bien', async () => {
    setPath('/envios');
    const urls = [];
    let envioCalls = 0;
    restclient.defaults.adapter = (config) => {
      urls.push(config.url);
      if (config.url.includes('/refresh')) return ok(config);
      envioCalls += 1;
      if (envioCalls === 1) return fail(503, { retryAfter: '1' })(config);
      if (envioCalls === 2) return rejectWith401(config);
      return ok(config, { ok: true });
    };
    const result = settle(restclient.get('/envios/1'));
    await vi.advanceTimersByTimeAsync(1_000);
    expect(urls).toEqual(['/envios/1', '/envios/1', '/refresh', '/envios/1']);
    expect(result.value.data).toEqual({ ok: true });
    expect(window.location.href).toBe('/envios');
  });

  it('401 con refresh en 503 persistente: reintenta el refresh y, si sigue, NO manda a /login', async () => {
    setPath('/envios/1');
    const urls = [];
    restclient.defaults.adapter = (config) => {
      urls.push(config.url);
      return config.url.includes('/refresh') ? fail(503)(config) : rejectWith401(config);
    };
    const result = settle(restclient.get('/envios/1'));
    await vi.advanceTimersByTimeAsync(10_000);
    expect(urls).toEqual(['/envios/1', '/refresh', '/refresh', '/refresh']);
    expect(result.error).toMatchObject({ response: { status: 503 } });
    expect(window.location.href).toBe('/envios/1');
  });

  it('el reintento de un export conserva el timeout largo', async () => {
    const calls = sequence(fail(503, { retryAfter: '1' }), (config) => ok(config));
    const result = settle(restclient.get('/envios', { params: { size: CSV_MAX_ROWS } }));
    await vi.advanceTimersByTimeAsync(1_000);
    expect(result.error).toBeUndefined();
    expect(calls.map((c) => c.timeout)).toEqual([EXPORT_TIMEOUT_MS, EXPORT_TIMEOUT_MS]);
  });
});

describe('parseRetryAfterMs (SHG-FE-131)', () => {
  it('segundos', () => {
    expect(parseRetryAfterMs({ 'retry-after': '1' })).toBe(1000);
    expect(parseRetryAfterMs({ 'retry-after': 3 })).toBe(3000);
    expect(parseRetryAfterMs(new AxiosHeaders({ 'Retry-After': '2' }))).toBe(2000);
  });

  it('fecha HTTP', () => {
    const now = Date.parse('2026-10-15T12:00:00Z');
    expect(
      parseRetryAfterMs({ 'retry-after': 'Thu, 15 Oct 2026 12:00:04 GMT' }, now),
    ).toBe(4000);
  });

  it('ausente o inválido → null', () => {
    expect(parseRetryAfterMs({})).toBeNull();
    expect(parseRetryAfterMs(undefined)).toBeNull();
    expect(parseRetryAfterMs({ 'retry-after': '' })).toBeNull();
    expect(parseRetryAfterMs({ 'retry-after': 'pronto' })).toBeNull();
  });
});
