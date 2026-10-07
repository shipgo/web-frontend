import { z } from 'zod';

import {
  PASSWORD_MIN,
  emailRequerido,
  nombreRequerido,
  telefonoRequerido,
} from '@domain/validation';

/**
 * Validación del registro público de CUSTOMER, alineada a `RegisterReqDTO` del
 * backend (`SHG-BE-002`): `email`, `password` (min 8), `nombre`, `apellido`,
 * `telefono`. Se consume con `schemaResolver(SCHEMA, { sync: true })` — el
 * resolver nativo de `@mantine/form`, mismo patrón que `CREAR_ENVIO_SCHEMA`.
 *
 * El backend igual revalida y puede devolver un `400` (p. ej. email ya
 * registrado) que se mapea a error de campo con `applyApiError`.
 */

export { PASSWORD_MIN };

export const REGISTRO_SCHEMA = z.object({
  nombre: nombreRequerido('El nombre es requerido'),
  apellido: nombreRequerido('El apellido es requerido'),
  email: emailRequerido(),
  telefono: telefonoRequerido(),
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
