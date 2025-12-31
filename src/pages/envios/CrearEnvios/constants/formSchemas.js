import { z } from "zod";

export const DESTINATARIO_SCHEMA = z.object({
  nombre: z.string().trim().nonempty({ message: "El nombre es requerido" }),
  apellido: z.string().trim().nonempty({ message: "El apellido es requerido" }),
  email: z.string().email({ message: "Ingresá un email válido" }),
  prefijo_telefono: z
    .string()
    .trim()
    .nonempty({ message: "El prefijo del teléfono es requerido" }),
  telefono: z.string().trim().nonempty({ message: "El teléfono es requerido" }),
  tipo_documento: z
    .string()
    .trim()
    .nonempty({ message: "El tipo de documento es requerido" }),
  numero_documento: z
    .string()
    .trim()
    .nonempty({ message: "El número de documento es requerido" }),
});

export const DIRECCION_SCHEMA = z.object({
  direccion: z
    .string()
    .trim()
    .nonempty({ message: "La dirección es requerida" }),
  provincia: z
    .string()
    .trim()
    .nonempty({ message: "La provincia es requerida" }),
  localidad: z
    .string()
    .trim()
    .nonempty({ message: "La localidad es requerida" }),
  codigo_postal: z
    .string()
    .trim()
    .nonempty({ message: "La localidad es requerida" }),
  referencias: z.string().optional(),
});

export const PAQUETE_SCHEMA = z.object({
  paquetes: z.array(z.object({})).nonempty({}),
});
