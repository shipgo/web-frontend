import { z } from 'zod';

import {
  emailRequerido,
  nombreRequerido,
  prefijoRequerido,
  telefonoRequerido,
  textoOpcional,
} from '@domain/validation';
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
  categoriaID: z.string().min(1, 'Elegí una categoría.'),
  peso: positiveNumberString('Ingresá el peso.', 'El peso tiene que ser mayor a 0.'),
  descripcion: z.string().optional(),
});

export const PAQUETE_INITIAL_VALUES = {
  categoriaID: '',
  peso: '',
  descripcion: '',
};

export const CREAR_ENVIO_SCHEMA = z
  .object({
    nombre: nombreRequerido('Ingresá el nombre.'),
    apellido: nombreRequerido('Ingresá el apellido.'),
    emailRemitente: emailRequerido('Ingresá el email del remitente.'),
    emailReceptor: emailRequerido('Ingresá el email del destinatario.'),
    prefijo: prefijoRequerido(),
    telefono: telefonoRequerido(),
    tipoEntrega: z
      .enum([TIPO_ENTREGA.DOMICILIO, TIPO_ENTREGA.SUCURSAL])
      .default(TIPO_ENTREGA_DEFAULT),
    sucursalEntregaID: z.string().optional(),
    nombreCalle: textoOpcional().optional(),
    numeroCalle: textoOpcional().optional(),
    piso: textoOpcional().optional(),
    departamento: textoOpcional().optional(),
    provinciaID: z.string().optional(),
    localidadID: z.string().optional(),
    coordenadas: z.object({ lat: z.number(), lng: z.number() }).nullable().optional(),
    // `SHG-CONTRACT-025`: sólo se usa en el alta (default `true`); `EditarEnvio`
    // reusa este schema pero sus values no lo traen, de ahí el `optional()`.
    generarPalabraEntrega: z.boolean().optional(),
    detalleEnvios: z.array(z.any()).min(1, 'Agregá al menos un paquete.'),
  })
  .superRefine((values, ctx) => {
    const tipoEntrega = values.tipoEntrega ?? TIPO_ENTREGA_DEFAULT;

    if (tipoEntrega === TIPO_ENTREGA.SUCURSAL) {
      if (!values.sucursalEntregaID) {
        ctx.addIssue({
          code: 'custom',
          path: ['sucursalEntregaID'],
          message: 'Elegí una sucursal de retiro.',
        });
      }
      return;
    }

    if (!values.nombreCalle?.trim()) {
      ctx.addIssue({
        code: 'custom',
        path: ['nombreCalle'],
        message: 'Ingresá la calle.',
      });
    }
    if (!values.provinciaID) {
      ctx.addIssue({
        code: 'custom',
        path: ['provinciaID'],
        message: 'Elegí una provincia.',
      });
    }
    if (!values.localidadID) {
      ctx.addIssue({
        code: 'custom',
        path: ['localidadID'],
        message: 'Elegí una localidad.',
      });
    }
    if (!values.coordenadas) {
      ctx.addIssue({
        code: 'custom',
        path: ['coordenadas'],
        message:
          'Elegí una sugerencia del buscador de direcciones para ubicar el envío en el mapa.',
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
  generarPalabraEntrega: true,
  detalleEnvios: [],
};
