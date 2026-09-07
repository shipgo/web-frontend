import { z } from 'zod';

/**
 * Validación del registro público de CUSTOMER, alineada a `RegisterReqDTO` del
 * backend (`SHG-BE-002`): `email`, `password` (min 8), `nombre`, `apellido`,
 * `telefono`. Se consume con `schemaResolver(SCHEMA, { sync: true })` — el
 * resolver nativo de `@mantine/form`, mismo patrón que `CREAR_ENVIO_SCHEMA`.
 *
 * El backend igual revalida y puede devolver un `400` (p. ej. email ya
 * registrado) que se mapea a error de campo con `applyApiError`.
 */

export const PASSWORD_MIN = 8;

export const REGISTRO_SCHEMA = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  apellido: z.string().trim().min(1, 'El apellido es requerido'),
  email: z.email('Email inválido'),
  telefono: z.string().trim().min(1, 'El teléfono es requerido'),
  password: z
    .string()
    .min(PASSWORD_MIN, `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`),
});

export const REGISTRO_INITIAL_VALUES = {
  nombre: '',
  apellido: '',
  email: '',
  telefono: '',
  password: '',
};
