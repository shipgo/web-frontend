import { z } from 'zod';

/**
 * Alineado a `EnvioReqDTO` (CONTRACTS.md §2 / ENDPOINTS.md Apéndice A) y a la forma
 * ya usada por `EditarEnvio`/`DetalleEnvio` (mismo repo, ya conectados a la API real):
 * `nombre`, `apellido`, `emailRemitente`, `emailReceptor`, `prefijo`, `telefono`,
 * `destino: { nombreCalle, numeroCalle, localidad: { id }, latitud, longitud }`,
 * `detalleEnvios: [{ categoria: { id }, descripcion, peso }]`.
 *
 * No hay `tamano`/`largo`/`ancho`/`alto` — se descartó en CONTRACT-002.
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

export const CREAR_ENVIO_SCHEMA = z.object({
  nombre: z.string().trim().min(1, 'El nombre es requerido'),
  apellido: z.string().trim().min(1, 'El apellido es requerido'),
  emailRemitente: z.email('Email inválido'),
  emailReceptor: z.email('Email inválido'),
  prefijo: z.string().trim().min(1, 'El prefijo es requerido'),
  telefono: z.string().trim().min(1, 'El teléfono es requerido'),
  nombreCalle: z.string().trim().min(1, 'La calle es requerida'),
  numeroCalle: z.string().optional(),
  provinciaID: z.string().min(1, 'Seleccioná una provincia'),
  localidadID: z.string().min(1, 'Seleccioná una localidad'),
  coordenadas: z
    .object({ lat: z.number(), lng: z.number() })
    .nullable()
    .refine(
      (val) => val !== null,
      'Elegí una sugerencia del buscador de direcciones para ubicar el envío en el mapa',
    ),
  detalleEnvios: z.array(z.any()).min(1, 'Agregá al menos un paquete'),
});

export const INITIAL_VALUES = {
  nombre: '',
  apellido: '',
  emailRemitente: '',
  emailReceptor: '',
  prefijo: '',
  telefono: '',
  nombreCalle: '',
  numeroCalle: '',
  provinciaID: '',
  localidadID: '',
  coordenadas: null,
  detalleEnvios: [],
};
