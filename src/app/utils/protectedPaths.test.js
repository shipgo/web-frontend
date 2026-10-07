import { describe, expect, it } from 'vitest';

import { PORTAL_BASE_PATH } from '@domain/roles';
import { isProtectedPath, PROTECTED_PATH_PREFIXES, SECTION_PATHS } from './protectedPaths';

describe('PROTECTED_PATH_PREFIXES', () => {
  it('se deriva de SECTION_PATHS (fuente única de routes/index.jsx) + el portal', () => {
    expect(PROTECTED_PATH_PREFIXES).toEqual([...Object.values(SECTION_PATHS), PORTAL_BASE_PATH]);
  });
});

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
