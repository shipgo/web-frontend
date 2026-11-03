import { describe, expect, it } from 'vitest';

import { MI_PERFIL_SCHEMA } from './schema';

const VALID = {
  nombre: 'Carla',
  apellido: 'Cliente',
  telefono: '3511234567',
};

describe('MI_PERFIL_SCHEMA', () => {
  it('acepta nombre/apellido/telefono válidos (CustomerMeUpdateReqDTO)', () => {
    expect(MI_PERFIL_SCHEMA.safeParse(VALID).success).toBe(true);
  });

  it('rechaza nombre / apellido / teléfono vacíos o sólo espacios', () => {
    expect(MI_PERFIL_SCHEMA.safeParse({ ...VALID, nombre: '  ' }).success).toBe(false);
    expect(MI_PERFIL_SCHEMA.safeParse({ ...VALID, apellido: '' }).success).toBe(false);
    expect(MI_PERFIL_SCHEMA.safeParse({ ...VALID, telefono: '' }).success).toBe(false);
  });

  it('no incluye email ni emailVerificado (sólo lectura, fuera de este schema)', () => {
    expect(MI_PERFIL_SCHEMA.shape.email).toBeUndefined();
    expect(MI_PERFIL_SCHEMA.shape.emailVerificado).toBeUndefined();
  });
});
