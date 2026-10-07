import { z } from 'zod';

import { nombreRequerido, telefonoRequerido } from '@domain/validation';

/**
 * Validación del form de edición de "Mi perfil" (`PUT /api/customer/me`,
 * `SHG-BE-074`). Mismas reglas que `RegisterReqDTO` para estos tres campos
 * (`ENDPOINTS.md`, tabla `/api/customer`): los tres son obligatorios
 * (`@NotEmpty` server-side, que hace `trim()`). `email`/`emailVerificado` son
 * de sólo lectura y no forman parte de este schema.
 *
 * Se consume con `schemaResolver(MI_PERFIL_SCHEMA, { sync: true })`, mismo
 * patrón que `REGISTRO_SCHEMA`.
 */
export const MI_PERFIL_SCHEMA = z.object({
  nombre: nombreRequerido('El nombre es requerido'),
  apellido: nombreRequerido('El apellido es requerido'),
  telefono: telefonoRequerido(),
});

export const MI_PERFIL_INITIAL_VALUES = {
  nombre: '',
  apellido: '',
  telefono: '',
};
