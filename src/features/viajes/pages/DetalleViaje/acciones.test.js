import { describe, expect, it } from 'vitest';

import { ESTADOS_CANCELABLES, ESTADOS_ELIMINABLES, puedeCancelar } from './acciones';

const admin = { authorities: ['ROLE_ADMIN'] };
const superuser = { authorities: ['ROLE_SUPERUSER'] };
const chofer = { authorities: ['ROLE_CHOFER'] };

describe('acciones de viaje — cancelar vs. eliminar (SHG-BE-113)', () => {
  it('con_problemas es cancelable pero no eliminable', () => {
    expect(ESTADOS_CANCELABLES).toContain('con_problemas');
    expect(ESTADOS_ELIMINABLES).not.toContain('con_problemas');
  });

  it('los eliminables son el resto de los cancelables', () => {
    expect(ESTADOS_CANCELABLES.filter((e) => e !== 'con_problemas')).toEqual(ESTADOS_ELIMINABLES);
  });

  it.each([admin, superuser])('ADMIN/SUPERUSER pueden cancelar un viaje con_problemas', (user) => {
    expect(puedeCancelar(user, 'con_problemas')).toBe(true);
  });

  it('un chofer no cancela, y en_camino no es cancelable', () => {
    expect(puedeCancelar(chofer, 'con_problemas')).toBe(false);
    expect(puedeCancelar(admin, 'en_camino')).toBe(false);
  });
});
