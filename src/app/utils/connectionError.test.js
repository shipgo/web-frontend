import { describe, expect, it } from 'vitest';
import { AxiosError } from 'axios';

import { classifyConnectionError } from './connectionError';

const withStatus = (status) =>
  new AxiosError('x', 'ERR_BAD_RESPONSE', {}, null, { status, data: {}, headers: {}, config: {} });

describe('classifyConnectionError', () => {
  it('timeout y error de red -> network', () => {
    expect(classifyConnectionError(new AxiosError('t', AxiosError.ECONNABORTED))).toBe('network');
    expect(classifyConnectionError(new AxiosError('n', AxiosError.ERR_NETWORK))).toBe('network');
  });
  it('5xx -> server', () => {
    expect(classifyConnectionError(withStatus(502))).toBe('server');
    expect(classifyConnectionError(withStatus(500))).toBe('server');
  });
  it('401/403/4xx -> null (flujo de sesión)', () => {
    expect(classifyConnectionError(withStatus(401))).toBeNull();
    expect(classifyConnectionError(withStatus(403))).toBeNull();
    expect(classifyConnectionError(withStatus(404))).toBeNull();
  });
  it('cancelaciones y errores no-axios -> null', () => {
    expect(classifyConnectionError(new AxiosError('c', AxiosError.ERR_CANCELED))).toBeNull();
    expect(classifyConnectionError(new TypeError('bug'))).toBeNull();
    expect(classifyConnectionError(null)).toBeNull();
  });
});
