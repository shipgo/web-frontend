import { z } from 'zod';

const positiveNumberString = (requiredMsg, invalidMsg) =>
  z
    .string()
    .min(1, requiredMsg)
    .refine((val) => !isNaN(Number(val)) && Number(val) > 0, invalidMsg);

export const PAQUETE_SCHEMA = z
  .object({
    tamano: z.string().min(1, 'Seleccioná un tamaño'),
    categoria: z.string().min(1, 'Seleccioná una categoría'),
    peso: positiveNumberString('El peso es requerido', 'Debe ser mayor a 0'),
    largo: z.string(),
    ancho: z.string(),
    alto: z.string(),
  })
  .superRefine((data, ctx) => {
    if (data.tamano === 'personalizado') {
      if (!data.largo || Number(data.largo) <= 0) {
        ctx.addIssue({ code: 'custom', path: ['largo'], message: 'El largo es requerido' });
      }
      if (!data.ancho || Number(data.ancho) <= 0) {
        ctx.addIssue({ code: 'custom', path: ['ancho'], message: 'El ancho es requerido' });
      }
      if (!data.alto || Number(data.alto) <= 0) {
        ctx.addIssue({ code: 'custom', path: ['alto'], message: 'El alto es requerido' });
      }
    }
  });

export const PAQUETE_INITIAL_VALUES = {
  tamano: '',
  categoria: '',
  peso: '',
  largo: '',
  ancho: '',
  alto: '',
};

export const CREAR_ENVIO_SCHEMA = z.object({
  nombreDestinatario: z.string().trim().min(1, 'El nombre es requerido'),
  telefonoDestinatario: z.string().trim().min(1, 'El teléfono es requerido'),
  direccionDestino: z.string().trim().min(1, 'La dirección es requerida'),
  coordenadas: z.object({ lat: z.number(), lng: z.number() }).nullable().optional(),
  observacionesDireccion: z.string().optional(),
  paquetes: z.array(z.any()).min(1, 'Agregá al menos un bulto'),
});

export const INITIAL_VALUES = {
  nombreDestinatario: '',
  telefonoDestinatario: '',
  direccionDestino: '',
  coordenadas: null,
  observacionesDireccion: '',
  paquetes: [],
};
