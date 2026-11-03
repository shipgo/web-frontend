import { describe, expect, it } from 'vitest';

import {
  buildLoginRedirectTo,
  resolvePostLoginRedirect,
  sanitizeRedirect,
} from './redirect';

describe('sanitizeRedirect (SHG-FE-054 — anti open-redirect)', () => {
  it('acepta una ruta interna simple', () => {
    expect(sanitizeRedirect('/viajes/12')).toBe('/viajes/12');
  });

  it('preserva query string y hash de la ruta interna', () => {
    expect(sanitizeRedirect('/envios?estado=en_camino#detalle')).toBe(
      '/envios?estado=en_camino#detalle',
    );
  });

  it.each([null, undefined, '', 42, {}])(
    'rechaza valores no-string / vacíos (%s)',
    (value) => {
      expect(sanitizeRedirect(value)).toBeNull();
    },
  );

  it('rechaza una ruta relativa sin "/" inicial', () => {
    expect(sanitizeRedirect('viajes/12')).toBeNull();
  });

  it('rechaza "//evil.com" (protocol-relative → navega a otro host)', () => {
    expect(sanitizeRedirect('//evil.com')).toBeNull();
  });

  it('rechaza "/\\evil.com" (browsers lo tratan como protocol-relative)', () => {
    expect(sanitizeRedirect('/\\evil.com')).toBeNull();
  });

  it.each([
    'https://evil.com',
    'http://evil.com/phishing',
    '  https://evil.com',
    'javascript:alert(1)',
  ])('rechaza una URL externa/con esquema (%s)', (value) => {
    expect(sanitizeRedirect(value)).toBeNull();
  });
});

describe('buildLoginRedirectTo', () => {
  it('arma /login?redirect=<destino> para una ruta interna válida', () => {
    expect(buildLoginRedirectTo('/viajes/12')).toBe(
      '~/login?redirect=%2Fviajes%2F12',
    );
  });

  it('cae a /login a secas si el destino no sanea (URL externa)', () => {
    expect(buildLoginRedirectTo('https://evil.com')).toBe('~/login');
  });

  it('cae a /login a secas si el destino ya es /login (evita loop)', () => {
    expect(buildLoginRedirectTo('/login')).toBe('~/login');
    expect(buildLoginRedirectTo('/login?redirect=%2Fviajes%2F12')).toBe(
      '~/login',
    );
  });
});

describe('resolvePostLoginRedirect', () => {
  const fallback = '/portal/envios';

  it('devuelve el redirect saneado cuando es una ruta interna válida', () => {
    expect(resolvePostLoginRedirect('/viajes/12', fallback)).toBe(
      '/viajes/12',
    );
  });

  it('cae al fallback (home por rol) sin redirect', () => {
    expect(resolvePostLoginRedirect(null, fallback)).toBe(fallback);
    expect(resolvePostLoginRedirect('', fallback)).toBe(fallback);
  });

  it('cae al fallback si el redirect es una URL externa (anti open-redirect)', () => {
    expect(resolvePostLoginRedirect('https://evil.com', fallback)).toBe(
      fallback,
    );
    expect(resolvePostLoginRedirect('//evil.com', fallback)).toBe(fallback);
  });

  it('cae al fallback si el redirect es /login (evita loop)', () => {
    expect(resolvePostLoginRedirect('/login', fallback)).toBe(fallback);
  });
});
