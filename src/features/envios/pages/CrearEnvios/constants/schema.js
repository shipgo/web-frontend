import { z } from 'zod';

import { TIPO_ENTREGA, TIPO_ENTREGA_DEFAULT } from '@features/envios/constants';

/**
 * Alineado a `EnvioReqDTO` (CONTRACTS.md §2 / ENDPOINTS.md Apéndice A) y a la forma
 * ya usada por `EditarEnvio`/`DetalleEnvio` (mismo repo, ya conectados a la API real):
 * `nombre`, `apellido`, `emailRemitente`, `emailReceptor`, `prefijo`, `telefono`,
 * `destino: { nombreCalle, numeroCalle, piso?, departamento?, localidad: { id }, latitud, longitud }`,
 * `detalleEnvios: [{ categoria: { id }, descripcion, peso }]`.
 *
 * `piso`/`departamento` (`SHG-BE-041`, `coordination/backend.md` 2026-09-11): `String`
 * opcionales/nullable dentro de `PuntoEntregaDTO`, sin validación de formato.
 *
 * No hay `tamano`/`largo`/`ancho`/`alto` — se descartó en CONTRACT-002.
 *
 * `tipoEntrega`/`sucursalEntregaID` (`SHG-CONTRACT-012`/`SHG-BE-061`,
 * `SHG-FE-079`): la dirección de destino (`nombreCalle`/`provinciaID`/
 * `localidadID`/`coordenadas`) sólo es obligatoria si `tipoEntrega = domicilio`
 * (default); si es `sucursal`, en cambio, se exige `sucursalEntregaID`. Los
 * campos de ambos caminos quedan `optional()` a nivel de shape y la
 * obligatoriedad condicional se resuelve en el `superRefine` de abajo (no se
 * puede modelar como discriminated union sin romper el resto del shape
 * compartido con `SeccionCarga`/`detalleEnvios`).
 */

const positiveNumberString = (requiredMsg, invalidMsg) =>
  z
    .string()
    .min(1, requiredMsg)
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, invalidMsg);

export const PAQUETE_SCHEMA = z.object({
  categoriaID: z.string().min(1, 'Seleccioná una categoría'),
  peso: positiveNumberString('El peso es requerido', 'Debe ser mayor a 0'),
  descripcion: z.string().optional(),
});

export const PAQUETE_INITIAL_VALUES = {
  categoriaID: '',
  peso: '',
  descripcion: '',
};

export const CREAR_ENVIO_SCHEMA = z
  .object({
    nombre: z.string().trim().min(1, 'El nombre es requerido'),
    apellido: z.string().trim().min(1, 'El apellido es requerido'),
    emailRemitente: z.email('Email inválido'),
    emailReceptor: z.email('Email inválido'),
    prefijo: z.string().trim().min(1, 'El prefijo es requerido'),
    telefono: z.string().trim().min(1, 'El teléfono es requerido'),
    tipoEntrega: z
      .enum([TIPO_ENTREGA.DOMICILIO, TIPO_ENTREGA.SUCURSAL])
      .default(TIPO_ENTREGA_DEFAULT),
    sucursalEntregaID: z.string().optional(),
    nombreCalle: z.string().optional(),
    numeroCalle: z.string().optional(),
    piso: z.string().optional(),
    departamento: z.string().optional(),
    provinciaID: z.string().optional(),
    localidadID: z.string().optional(),
    coordenadas: z.object({ lat: z.number(), lng: z.number() }).nullable().optional(),
    detalleEnvios: z.array(z.any()).min(1, 'Agregá al menos un paquete'),
  })
  .superRefine((values, ctx) => {
    const tipoEntrega = values.tipoEntrega ?? TIPO_ENTREGA_DEFAULT;

    if (tipoEntrega === TIPO_ENTREGA.SUCURSAL) {
      if (!values.sucursalEntregaID) {
        ctx.addIssue({
          code: 'custom',
          path: ['sucursalEntregaID'],
          message: 'Seleccioná una sucursal de retiro',
        });
      }
      return;
    }

    if (!values.nombreCalle?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['nombreCalle'],
        message: 'La calle es requerida',
      });
    }
    if (!values.provinciaID) {
      ctx.addIssue({
        code: 'custom',
        path: ['provinciaID'],
        message: 'Seleccioná una provincia',
      });
    }
    if (!values.localidadID) {
      ctx.addIssue({
        code: 'custom',
        path: ['localidadID'],
        message: 'Seleccioná una localidad',
      });
    }
    if (!values.coordenadas) {
      ctx.addIssue({
        code: 'custom',
        path: ['coordenadas'],
        message:
          'Elegí una sugerencia del buscador de direcciones para ubicar el envío en el mapa',
      });
    }
  });

export const INITIAL_VALUES = {
  nombre: '',
  apellido: '',
  emailRemitente: '',
  emailReceptor: '',
  prefijo: '',
  telefono: '',
  tipoEntrega: TIPO_ENTREGA_DEFAULT,
  sucursalEntregaID: '',
  nombreCalle: '',
  numeroCalle: '',
  piso: '',
  departamento: '',
  provinciaID: '',
  localidadID: '',
  coordenadas: null,
  detalleEnvios: [],
};
