import { z } from 'zod';
import dayjs from 'dayjs';

import { nombreRequerido, textoOpcional } from '@domain/validation';

/**
 * Alineado a `MantenimientoReqDTO` (backend, `dto/request/MantenimientoReqDTO.java`):
 * `nombreMecanico` (NotEmpty), `apellidoMecanico` (NotEmpty), `descripcion` (opcional),
 * `tipoMantenimientoID` (NotNull, Min 1), `vehiculoID` (Min 1), `fechaHoraMantenimiento` e
 * `fechaHoraFin` (`java.time.LocalDateTime`, ambas obligatorias), `fechaHoraRegistro` (`LocalDateTime`, lo setea el backend
 * en el alta — no se manda desde el form de creación).
 *
 * `Mantenimiento` NO tiene estado / ciclo de vida ni costo: no hay campos de
 * "estado", "costo" ni acción de "completar" (ver bitácora de `SHG-FE-020`).
 *
 * En el form `vehiculoID` / `tipoMantenimientoID` son strings (valor de `Select`);
 * `buildMantenimientoReqDTO` los pasa a `number`.
 */
const fechaValida = (value) => value != null && dayjs(value).isValid();

/**
 * Schema del form. `fechaHoraFin` es obligatoria y posterior al inicio
 * (`SHG-BE-091`). El inicio no puede ser pasado, salvo que sea el inicio original
 * de un mantenimiento que se está editando (el backend deja conservarlo cuando el
 * mantenimiento ya está en curso): se pasa como `inicioOriginal`.
 *
 * @param {{ inicioOriginal?: Date|string|null }} [opts]
 */
export const buildMantenimientoSchema = ({ inicioOriginal = null } = {}) =>
  z
    .object({
      nombreMecanico: nombreRequerido('Ingresá el nombre del mecánico'),
      apellidoMecanico: nombreRequerido('Ingresá el apellido del mecánico'),
      vehiculoID: z.string().min(1, 'Seleccioná un vehículo'),
      tipoMantenimientoID: z.string().min(1, 'Seleccioná un tipo de mantenimiento'),
      fechaHoraMantenimiento: z
        .any()
        .refine(fechaValida, 'Seleccioná la fecha y hora de inicio'),
      fechaHoraFin: z.any().refine(fechaValida, 'Seleccioná la fecha y hora de fin'),
      descripcion: textoOpcional(255).optional(),
    })
    .superRefine((values, ctx) => {
      const inicio = fechaValida(values.fechaHoraMantenimiento)
        ? dayjs(values.fechaHoraMantenimiento)
        : null;
      const fin = fechaValida(values.fechaHoraFin) ? dayjs(values.fechaHoraFin) : null;

      if (inicio) {
        const esOriginal =
          inicioOriginal != null &&
          dayjs(inicioOriginal).isValid() &&
          inicio.isSame(dayjs(inicioOriginal), 'minute');
        if (!esOriginal && inicio.isBefore(dayjs().startOf('minute'))) {
          ctx.addIssue({
            code: 'custom',
            path: ['fechaHoraMantenimiento'],
            message: 'El inicio no puede estar en el pasado',
          });
        }
      }

      if (inicio && fin && !fin.isAfter(inicio)) {
        ctx.addIssue({
          code: 'custom',
          path: ['fechaHoraFin'],
          message: 'El fin debe ser posterior al inicio',
        });
      }
    });

export const MANTENIMIENTO_SCHEMA = buildMantenimientoSchema();

export const INITIAL_VALUES = {
  nombreMecanico: '',
  apellidoMecanico: '',
  vehiculoID: '',
  tipoMantenimientoID: '',
  fechaHoraMantenimiento: null,
  fechaHoraFin: null,
  descripcion: '',
};
