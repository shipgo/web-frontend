import { z } from 'zod';
import dayjs from 'dayjs';

/**
 * Alineado a `MantenimientoReqDTO` (backend, `dto/request/MantenimientoReqDTO.java`):
 * `nombreMecanico` (NotEmpty), `apellidoMecanico` (NotEmpty), `descripcion` (opcional),
 * `tipoMantenimientoID` (NotNull, Min 1), `vehiculoID` (Min 1), `fechaHoraMantenimiento`
 * (`java.time.LocalDateTime`), `fechaHoraRegistro` (`LocalDateTime`, lo setea el backend
 * en el alta — no se manda desde el form de creación).
 *
 * `Mantenimiento` NO tiene estado / ciclo de vida ni costo: no hay campos de
 * "estado", "costo" ni acción de "completar" (ver bitácora de `SHG-FE-020`).
 *
 * En el form `vehiculoID` / `tipoMantenimientoID` son strings (valor de `Select`);
 * `buildMantenimientoReqDTO` los pasa a `number`.
 */
export const MANTENIMIENTO_SCHEMA = z.object({
  nombreMecanico: z.string().trim().min(1, 'Ingresá el nombre del mecánico'),
  apellidoMecanico: z.string().trim().min(1, 'Ingresá el apellido del mecánico'),
  vehiculoID: z.string().min(1, 'Seleccioná un vehículo'),
  tipoMantenimientoID: z.string().min(1, 'Seleccioná un tipo de mantenimiento'),
  fechaHoraMantenimiento: z
    .any()
    .refine(
      (value) => value != null && dayjs(value).isValid(),
      'Seleccioná una fecha y hora válida',
    ),
  descripcion: z.string().optional(),
});

export const INITIAL_VALUES = {
  nombreMecanico: '',
  apellidoMecanico: '',
  vehiculoID: '',
  tipoMantenimientoID: '',
  fechaHoraMantenimiento: null,
  descripcion: '',
};
