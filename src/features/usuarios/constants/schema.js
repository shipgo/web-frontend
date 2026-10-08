import { z } from 'zod';
import { schemaResolver } from '@mantine/form';

import {
  TEXTO_MAX,
  nombreRequerido,
  prefijoRequerido,
  telefonoRequerido,
  textoRequerido,
} from '@domain/validation';

/**
 * Validación de `CrearUsuario` / `EditarUsuario`, alineada a `UserReqDTO`
 * (`backend/.../dto/request/UserReqDTO.java`) y a los mismos mensajes que usaba
 * el `validate: {...}` manual que reemplaza (SHG-FE-033). Se consume con
 * `schemaResolver(USUARIO_SCHEMA, { sync: true })` — el resolver nativo de
 * `@mantine/form`, mismo patrón que `CrearEnvios` (`CREAR_ENVIO_SCHEMA`).
 *
 * `fechaNacimiento` es `LocalDate` en el backend: se serializa aparte como
 * `YYYY-MM-DD` con `toBackendDate` (`../utils`) — acá sólo se valida presencia.
 * `provinciaID` y `sucursalID` no viajan como tales en `UserReqDTO`
 * (`localidadID` ya implica provincia; la sucursal la fuerza el form para un
 * ADMIN) y no se validan, igual que en el `validate` original.
 */

const EMAIL_RE = /^\S+@\S+\.\S+$/;

// Selects nullables (valor `string` id o `null` inicial) y el `DateInput`
// (`string` `YYYY-MM-DD` en Mantine v9, o `Date`/`null`): sólo nos importa que
// haya un valor elegido.
const valorRequerido = (mensaje) =>
  z.any().refine((v) => v !== null && v !== undefined && v !== '', mensaje);

export const USUARIO_SCHEMA = z.object({
  username: textoRequerido('El campo username no puede estar vacío'),
  nombre: nombreRequerido('El campo nombre no puede estar vacío'),
  apellido: nombreRequerido('El campo apellido no puede estar vacío'),
  fechaNacimiento: valorRequerido(
    'El campo fecha de nacimiento no puede estar vacío',
  ),
  prefijo: prefijoRequerido('El campo prefijo no puede estar vacío'),
  telefono: telefonoRequerido('El campo teléfono no puede estar vacío'),
  nombreCalle: textoRequerido('El campo nombre de calle no puede estar vacío'),
  numeroCalle: textoRequerido('El campo número de calle no puede estar vacío'),
  email: z
    .string()
    .trim()
    .min(1, 'El campo email no puede estar vacío')
    .max(TEXTO_MAX, `No puede superar los ${TEXTO_MAX} caracteres`)
    .refine((v) => EMAIL_RE.test(v), 'El email no es válido'),
  authorities: z.array(z.string()).min(1, 'Debe seleccionar al menos un rol'),
  dni: textoRequerido('El campo DNI no puede estar vacío'),
  tipoDocumentoID: valorRequerido('Debe seleccionar un tipo de documento'),
  sexoID: valorRequerido('Debe seleccionar un sexo'),
  localidadID: valorRequerido('Debe seleccionar una localidad'),
  provinciaID: z.any().optional(),
  sucursalID: z.any().optional(),
});

export const USUARIO_INITIAL_VALUES = {
  username: '',
  nombre: '',
  apellido: '',
  fechaNacimiento: null,
  prefijo: '',
  telefono: '',
  nombreCalle: '',
  numeroCalle: '',
  email: '',
  sucursalID: null,
  authorities: [],
  dni: '',
  tipoDocumentoID: null,
  sexoID: null,
  localidadID: null,
  provinciaID: null,
};

/**
 * `validate` del form de Crear/Editar usuario (SHG-FE-116): el esquema de arriba
 * más "sucursal obligatoria" cuando quien guarda es SUPERUSER (`POST`/`PUT
 * /api/user` exigen `sucursalID`). Un ADMIN no elige: el form la fuerza a la suya.
 */
export const buildUsuarioValidate = (isSuper) => {
  const base = schemaResolver(USUARIO_SCHEMA, { sync: true });
  return (values) => {
    const errors = base(values);
    if (isSuper && !values.sucursalID) {
      return { ...errors, sucursalID: 'Debes seleccionar una sucursal' };
    }
    return errors;
  };
};
