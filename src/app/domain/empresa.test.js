import { describe, expect, it } from 'vitest';

import { esEmpresaRequerida, necesitaOnboardingEmpresa } from './empresa';

const user = (role, sucursal) => ({
  authorities: [{ name: role }],
  ...(sucursal !== undefined ? { sucursal } : {}),
});

describe('necesitaOnboardingEmpresa', () => {
  it('SUPERUSER sin sucursal → true', () => {
    expect(necesitaOnboardingEmpresa(user('ROLE_SUPERUSER', null))).toBe(true);
    expect(necesitaOnboardingEmpresa(user('ROLE_SUPERUSER'))).toBe(true);
  });

  it('SUPERUSER con sucursal (empresa) → false', () => {
    expect(necesitaOnboardingEmpresa(user('ROLE_SUPERUSER', { id: 1 }))).toBe(false);
  });

  it.each(['ROLE_ADMIN', 'ROLE_CHOFER', 'ROLE_CARGA', 'ROLE_CUSTOMER'])(
    '%s nunca necesita onboarding, aunque no tenga sucursal',
    (role) => {
      expect(necesitaOnboardingEmpresa(user(role, null))).toBe(false);
    },
  );

  it('sin usuario → false (no se decide con datos que no están)', () => {
    expect(necesitaOnboardingEmpresa(null)).toBe(false);
    expect(necesitaOnboardingEmpresa(undefined)).toBe(false);
  });
});

describe('esEmpresaRequerida', () => {
  it('detecta 409 con code empresa_requerida', () => {
    expect(
      esEmpresaRequerida({
        response: { status: 409, data: { code: 'empresa_requerida' } },
      }),
    ).toBe(true);
  });

  it('no confunde otros 409 ni otros códigos', () => {
    expect(esEmpresaRequerida({ response: { status: 409, data: { code: 'otro' } } })).toBe(false);
    expect(
      esEmpresaRequerida({ response: { status: 400, data: { code: 'empresa_requerida' } } }),
    ).toBe(false);
    expect(esEmpresaRequerida(new Error('red'))).toBe(false);
    expect(esEmpresaRequerida(null)).toBe(false);
  });
});
