import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { REGISTRO_SCHEMA } from '@features/portal/pages/Registro/constants/schema';
import { MI_PERFIL_SCHEMA } from '@features/portal/pages/MiPerfil/constants/schema';
import { SUCURSAL_SCHEMA } from '@features/sucursales/constants/schema';
import { USUARIO_SCHEMA } from '@features/usuarios/constants/schema';
import { CREAR_ENVIO_SCHEMA } from '@features/envios/pages/CrearEnvios/constants/schema';

import {
  NOMBRE_MAX,
  PREFIJO_MAX,
  TELEFONO_MAX,
  TELEFONO_MIN,
  emailRequerido,
  prefijoRequerido,
  telefonoRequerido,
} from './validation';

const firstMessage = (schema, value) => {
  const result = schema.safeParse(value);
  return result.success ? null : result.error.issues[0].message;
};

describe('telefonoRequerido / prefijoRequerido (regla compartida SHG-FE-107)', () => {
  const tel = telefonoRequerido();
  const pref = prefijoRequerido();

  it.each([
    ['abc', 'El teléfono sólo puede tener números'],
    ['12x', 'El teléfono sólo puede tener números'],
    ['', 'El teléfono es requerido'],
    ['12345', `El teléfono debe tener al menos ${TELEFONO_MIN} dígitos`],
    ['1'.repeat(TELEFONO_MAX + 1), `El teléfono no puede tener más de ${TELEFONO_MAX} dígitos`],
  ])('teléfono %j → %s', (value, message) => {
    expect(firstMessage(tel, value)).toBe(message);
  });

  it.each(['351 ', ' 351', '35 1'])('prefijo con espacios %j se rechaza (no se normaliza al validar)', (v) => {
    expect(firstMessage(pref, v)).toBe('El prefijo sólo puede tener números');
  });

  it.each(['4111111 ', ' 4111111'])('teléfono con espacios %j se rechaza', (v) => {
    expect(firstMessage(tel, v)).toBe('El teléfono sólo puede tener números');
  });

  it.each(['1234567', '3511234567', '1'.repeat(TELEFONO_MAX)])('teléfono válido %s', (v) => {
    expect(firstMessage(tel, v)).toBeNull();
  });

  it.each([
    ['abc', 'El prefijo sólo puede tener números'],
    ['+54', 'El prefijo sólo puede tener números'],
    ['', 'El prefijo es requerido'],
    ['1', 'El prefijo debe tener al menos 2 dígitos'],
    ['1'.repeat(PREFIJO_MAX + 1), `El prefijo no puede tener más de ${PREFIJO_MAX} dígitos`],
  ])('prefijo %j → %s', (value, message) => {
    expect(firstMessage(pref, value)).toBe(message);
  });

  it.each(['11', '351', '2965'])('prefijo válido %s', (v) => {
    expect(firstMessage(pref, v)).toBeNull();
  });

  it('email vacío dice "requerido" y mal formado dice "inválido"', () => {
    const schema = z.object({ e: emailRequerido('El email es requerido') });
    expect(firstMessage(schema, { e: '' })).toBe('El email es requerido');
    expect(firstMessage(schema, { e: 'sin-arroba' })).toBe('Email inválido');
    expect(firstMessage(schema, { e: 'a@b.com' })).toBeNull();
  });
});

describe('la regla se aplica en todos los schemas', () => {
  const messageFor = (schema, base, field, value) =>
    firstMessage(schema, { ...base, [field]: value });

  const registro = { nombre: 'A', apellido: 'B', email: 'a@b.com', telefono: '3511234567', password: '12345678' };
  const perfil = { nombre: 'A', apellido: 'B', telefono: '3511234567' };
  const sucursal = {
    nombre: 'S', email: '', prefijo: '351', telefono: '4111111', nombreCalle: 'X',
    numeroCalle: '1', provinciaID: '1', localidadID: '1',
  };
  const usuario = {
    username: 'u', nombre: 'A', apellido: 'B', fechaNacimiento: '2000-01-01', prefijo: '351',
    telefono: '4111111', nombreCalle: 'X', numeroCalle: '1', email: 'a@b.com', authorities: ['ROLE_ADMIN'],
    dni: '1', tipoDocumentoID: '1', sexoID: '1', localidadID: '1',
  };
  const envio = {
    nombre: 'A', apellido: 'B', emailRemitente: 'a@b.com', emailReceptor: 'c@d.com', prefijo: '351',
    telefono: '4111111', tipoEntrega: 'sucursal', sucursalEntregaID: '1', detalleEnvios: [{}],
  };

  it.each([
    ['registro', REGISTRO_SCHEMA, registro, ['telefono']],
    ['perfil', MI_PERFIL_SCHEMA, perfil, ['telefono']],
    ['sucursal', SUCURSAL_SCHEMA, sucursal, ['prefijo', 'telefono']],
    ['usuario', USUARIO_SCHEMA, usuario, ['prefijo', 'telefono']],
    ['envío', CREAR_ENVIO_SCHEMA, envio, ['prefijo', 'telefono']],
  ])('%s: rechaza no numéricos y acepta válidos', (_n, schema, base, fields) => {
    expect(schema.safeParse(base).success).toBe(true);
    for (const field of fields) {
      expect(messageFor(schema, base, field, 'abc')).toMatch(/sólo puede tener números/);
      expect(messageFor(schema, base, field, '12x')).toMatch(/sólo puede tener números/);
    }
  });

  it.each([
    ['registro', REGISTRO_SCHEMA, registro],
    ['perfil', MI_PERFIL_SCHEMA, perfil],
    ['sucursal', SUCURSAL_SCHEMA, sucursal],
    ['usuario', USUARIO_SCHEMA, usuario],
    ['envío', CREAR_ENVIO_SCHEMA, envio],
  ])('%s: un nombre de 300 caracteres se rechaza (max %i)', (_n, schema, base) => {
    expect(messageFor(schema, base, 'nombre', 'a'.repeat(300))).toBe(
      `No puede superar los ${NOMBRE_MAX} caracteres`,
    );
  });

  it('CrearEnvios: email vacío dice "requerido", no "Email inválido"', () => {
    expect(messageFor(CREAR_ENVIO_SCHEMA, envio, 'emailRemitente', '')).toBe(
      'El email del remitente es requerido',
    );
    expect(messageFor(CREAR_ENVIO_SCHEMA, envio, 'emailReceptor', '')).toBe(
      'El email del receptor es requerido',
    );
    expect(messageFor(CREAR_ENVIO_SCHEMA, envio, 'emailReceptor', 'x')).toBe('Email inválido');
  });
});
