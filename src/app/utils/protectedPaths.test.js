import { describe, expect, it } from 'vitest';

import { isProtectedPath } from './protectedPaths';

describe('isProtectedPath', () => {
  it.each(['/mapa', '/envios', '/envios/12/editar', '/portal', '/portal/envios'])(
    '%s requiere sesión',
    (path) => {
      expect(isProtectedPath(path)).toBe(true);
    },
  );

  it.each([
    '/',
    '/login',
    '/tracking/ABC',
    '/registro',
    '/recuperar-cuenta/tok',
    '/portal/ingresar',
    '/cualquier-cosa',
    '/enviosx',
    '/opciones',
  ])('%s no requiere sesión (pública o desconocida → 404)', (path) => {
    expect(isProtectedPath(path)).toBe(false);
  });
});
