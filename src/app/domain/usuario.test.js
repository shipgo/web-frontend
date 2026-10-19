import { describe, expect, it } from 'vitest';

import {
  iniciales,
  necesitaCompletarCuenta,
  nombreCompleto,
  tieneNombre,
} from './usuario';
import { Usuario } from '@stores/auth.store';

describe('nombreCompleto', () => {
  it('une nombre y apellido', () => {
    expect(nombreCompleto({ nombre: 'Ana', apellido: 'Gómez' })).toBe('Ana Gómez');
  });

  it('con sólo uno de los dos usa el que exista, sin "undefined"', () => {
    expect(nombreCompleto({ nombre: 'Ana' })).toBe('Ana');
    expect(nombreCompleto({ apellido: 'Gómez', username: 'x' })).toBe('Gómez');
  });

  it('sin datos personales cae a username, luego email, luego fallback', () => {
    expect(nombreCompleto({ username: 'a@b.com', email: 'a@b.com' })).toBe('a@b.com');
    expect(nombreCompleto({ email: 'a@b.com' })).toBe('a@b.com');
    expect(nombreCompleto({}, 'Sin nombre')).toBe('Sin nombre');
    expect(nombreCompleto(null)).toBe('');
  });

  it('ignora strings vacíos', () => {
    expect(nombreCompleto({ nombre: ' ', apellido: '', username: 'u' })).toBe('u');
  });
});

describe('iniciales', () => {
  it('toma nombre y apellido', () => {
    expect(iniciales({ nombre: 'ana', apellido: 'gómez' })).toBe('AG');
  });

  it('sin datos personales usa la primera letra de username/email', () => {
    expect(iniciales({ username: 'nico@x.com' })).toBe('N');
    expect(iniciales({ email: 'zeta@x.com' })).toBe('Z');
    expect(iniciales({})).toBe('');
  });
});

describe('tieneNombre / necesitaCompletarCuenta', () => {
  const sucursal = { id: 1 };

  it('requiere sucursal y ausencia de nombre', () => {
    expect(necesitaCompletarCuenta({ sucursal })).toBe(true);
    expect(necesitaCompletarCuenta({ sucursal, nombre: '  ' })).toBe(true);
    expect(necesitaCompletarCuenta({ sucursal, nombre: 'Ana' })).toBe(false);
  });

  it('sin sucursal (antes del onboarding) o sin usuario es false', () => {
    expect(necesitaCompletarCuenta({ nombre: undefined, sucursal: null })).toBe(false);
    expect(necesitaCompletarCuenta(null)).toBe(false);
    expect(tieneNombre(null)).toBe(false);
  });
});

describe('Usuario sin datos personales (SHG-BE-154)', () => {
  const u = new Usuario({
    id: 1,
    username: 'nico@x.com',
    email: 'nico@x.com',
    authorities: [{ name: 'ROLE_SUPERUSER' }],
  });

  it('getFullName / getInitials / getPhoneNumber / getAddress no devuelven "undefined"', () => {
    expect(u.getFullName()).toBe('nico@x.com');
    expect(u.getInitials()).toBe('N');
    expect(u.getPhoneNumber()).not.toMatch(/undefined/);
    expect(u.getAddress()).not.toMatch(/undefined/);
    expect(u.getLocation()).toBe('—');
    expect(new Usuario({ localidad: { nombre: 'Rosario' } }).getLocation()).toBe('Rosario');
  });
});
