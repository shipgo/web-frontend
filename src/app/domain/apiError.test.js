import { describe, expect, it, vi } from 'vitest';

import { applyApiError, parseApiError } from './apiError';

/** Helper: arma un error tipo axios con `response.status` + `response.data`. */
const axiosError = (status, data) => ({
  isAxiosError: true,
  response: { status, data },
});

describe('parseApiError — 400 de validación de campos (ApiFieldError, body plano)', () => {
  // Ejemplo verbatim de CONTRACTS.md §5 (POST /api/envio con body {}).
  const err = axiosError(400, {
    statusCode: 400,
    message: 'Error en la validación de los campos.',
    fields: [
      { field: 'telefono', error: 'El campo telefono no puede estar vacío.' },
      {
        field: 'emailRemitente',
        error: 'El campo emailRemitente no puede estar vacío.',
      },
      { field: 'nombre', error: 'El campo nombre no puede estar vacío.' },
    ],
  });

  it('mapea cada field a su error, listo para form.setErrors', () => {
    const { fieldErrors } = parseApiError(err);
    expect(fieldErrors).toEqual({
      telefono: 'El campo telefono no puede estar vacío.',
      emailRemitente: 'El campo emailRemitente no puede estar vacío.',
      nombre: 'El campo nombre no puede estar vacío.',
    });
  });

  it('usa el message top-level para el toast', () => {
    expect(parseApiError(err).message).toBe(
      'Error en la validación de los campos.',
    );
  });
});

describe('parseApiError — body anidado (ViajeReqDTO.viaje / SucursalReqDTO.puntoEntrega)', () => {
  it('saca el prefijo explícito para que matcheen los nombres planos del form', () => {
    const err = axiosError(400, {
      statusCode: 400,
      message: 'Error en la validación de los campos.',
      fields: [
        { field: 'viaje.vehiculoID', error: 'Debe seleccionar un vehículo.' },
        { field: 'viaje.choferesID', error: 'Debe asignar al menos un chofer.' },
      ],
    });

    expect(parseApiError(err, { stripPrefix: 'viaje' }).fieldErrors).toEqual({
      vehiculoID: 'Debe seleccionar un vehículo.',
      choferesID: 'Debe asignar al menos un chofer.',
    });
  });

  it('con nombres mezclados, sólo saca el prefijo pedido y deja el resto', () => {
    const err = axiosError(400, {
      message: 'Error en la validación de los campos.',
      fields: [
        { field: 'nombre', error: 'El campo nombre no puede estar vacío.' },
        {
          field: 'puntoEntrega.numeroCalle',
          error: 'El campo numeroCalle no puede estar vacío.',
        },
      ],
    });

    expect(
      parseApiError(err, { stripPrefix: 'puntoEntrega' }).fieldErrors,
    ).toEqual({
      nombre: 'El campo nombre no puede estar vacío.',
      numeroCalle: 'El campo numeroCalle no puede estar vacío.',
    });
  });

  it('detecta un prefijo común automáticamente si no se pasa stripPrefix', () => {
    const err = axiosError(400, {
      fields: [
        { field: 'viaje.vehiculoID', error: 'Requerido.' },
        { field: 'viaje.fechaHoraInicioPlanificada', error: 'Requerido.' },
      ],
    });

    expect(parseApiError(err).fieldErrors).toEqual({
      vehiculoID: 'Requerido.',
      fechaHoraInicioPlanificada: 'Requerido.',
    });
  });

  it('acepta un array de prefijos', () => {
    const err = axiosError(400, {
      fields: [
        { field: 'viaje.vehiculoID', error: 'Requerido.' },
        { field: 'puntoEntrega.numeroCalle', error: 'Requerido.' },
      ],
    });

    expect(
      parseApiError(err, { stripPrefix: ['viaje', 'puntoEntrega'] }).fieldErrors,
    ).toEqual({ vehiculoID: 'Requerido.', numeroCalle: 'Requerido.' });
  });

  it('400 mixto: campo de raíz + destino.campo (SHG-FE-040 — CrearEnvios)', () => {
    // Caso concreto: EnvioReqDTO tiene campos planos (`nombre`, `apellido`, etc.)
    // y un objeto anidado `destino` con `numeroCalle`, `nombreCalle`, etc.
    // Un 400 de validación puede mezclar errores de ambos niveles.
    // Sin `stripPrefix`, detectCommonPrefix devuelve null (porque no todos los
    // campos comparten prefijo) y los anidados no se pelan.
    // Con `stripPrefix: "destino"`, se pelan solo los prefijados y los planos quedan igual.
    const err = axiosError(400, {
      message: 'Validación fallida',
      fields: [
        { field: 'nombre', error: 'El nombre es requerido.' },
        {
          field: 'destino.numeroCalle',
          error: 'El número de calle es requerido.',
        },
      ],
    });

    expect(
      parseApiError(err, { stripPrefix: 'destino' }).fieldErrors,
    ).toEqual({
      nombre: 'El nombre es requerido.',
      numeroCalle: 'El número de calle es requerido.',
    });
  });

  it('NO detecta prefijo en un DTO plano cuyos campos comparten un comienzo pero no un segmento con punto', () => {
    const err = axiosError(400, {
      fields: [
        { field: 'nombreCalle', error: 'Requerido.' },
        { field: 'nombreMecanico', error: 'Requerido.' },
      ],
    });

    expect(parseApiError(err).fieldErrors).toEqual({
      nombreCalle: 'Requerido.',
      nombreMecanico: 'Requerido.',
    });
  });
});

describe('parseApiError — errores sin fields (ErrorResponse simple)', () => {
  it('400 de negocio: sin fieldErrors, message puntual del backend', () => {
    const err = axiosError(400, {
      statusCode: 400,
      message: "El parámetro 'hasta' debe ser posterior a 'desde'.",
    });
    const { fieldErrors, message } = parseApiError(err);
    expect(fieldErrors).toEqual({});
    expect(message).toBe("El parámetro 'hasta' debe ser posterior a 'desde'.");
  });

  it('404: message del backend', () => {
    const err = axiosError(404, {
      statusCode: 404,
      message: 'El envío con el id 999999 no existe.',
    });
    expect(parseApiError(err).message).toBe(
      'El envío con el id 999999 no existe.',
    );
  });

  it('409: message del backend (conflicto de estado)', () => {
    const err = axiosError(409, {
      statusCode: 409,
      message:
        "No se puede eliminar el envío 18 porque está en estado 'entregado'.",
    });
    const { fieldErrors, message } = parseApiError(err);
    expect(fieldErrors).toEqual({});
    expect(message).toBe(
      "No se puede eliminar el envío 18 porque está en estado 'entregado'.",
    );
  });
});

describe('parseApiError — 403', () => {
  it('usa el texto fijo de permisos, no el del backend', () => {
    const err = axiosError(403, {
      statusCode: 403,
      message: 'No tiene permisos para acceder a este recurso',
    });
    expect(parseApiError(err).message).toBe('No tenés permisos para esta acción.');
  });
});

describe('parseApiError — 5xx', () => {
  it('500 del GlobalExceptionHandler: mensaje genérico, sin exponer el interno', () => {
    const err = axiosError(500, {
      statusCode: 500,
      message: 'La acción a realizar entregar no existe para el estado entregado',
    });
    const { message } = parseApiError(err);
    expect(message).toBe(
      'Ocurrió un error en el servidor. Intentá nuevamente en unos minutos.',
    );
  });

  it('shape default de Spring Boot (/error, sin message ni statusCode)', () => {
    const err = axiosError(500, {
      timestamp: '2026-09-06T12:00:00.000+00:00',
      status: 500,
      error: 'Internal Server Error',
      path: '/api/envio',
    });
    expect(parseApiError(err).message).toBe(
      'Ocurrió un error en el servidor. Intentá nuevamente en unos minutos.',
    );
  });
});

describe('parseApiError — sin respuesta / fallback', () => {
  it('error de red (sin err.response): status null + mensaje genérico o fallback', () => {
    const err = new Error('Network Error');
    const { fieldErrors, message, status } = parseApiError(err, {
      fallbackMessage: 'No se pudo crear el envío',
    });
    expect(fieldErrors).toEqual({});
    expect(status).toBeNull();
    expect(message).toBe('No se pudo crear el envío');
  });

  it('sin message del backend y sin fallback: mensaje genérico por defecto', () => {
    expect(parseApiError(axiosError(400, {})).message).toBe(
      'Ocurrió un error inesperado. Intentá nuevamente.',
    );
  });

  it('compat: field-errors bajo `fieldErrors` con item.message (parseo viejo de CrearEnvios)', () => {
    const err = axiosError(400, {
      mensaje: 'Error de validación',
      fieldErrors: [{ field: 'nombre', message: 'Requerido' }],
    });
    const { fieldErrors, message } = parseApiError(err);
    expect(fieldErrors).toEqual({ nombre: 'Requerido' });
    expect(message).toBe('Error de validación');
  });
});

describe('applyApiError', () => {
  it('llama form.setErrors con los fieldErrors y devuelve el message', () => {
    const form = { setErrors: vi.fn() };
    const err = axiosError(400, {
      message: 'Error en la validación de los campos.',
      fields: [{ field: 'nombre', error: 'Requerido' }],
    });

    const message = applyApiError(form, err);

    expect(form.setErrors).toHaveBeenCalledWith({ nombre: 'Requerido' });
    expect(message).toBe('Error en la validación de los campos.');
  });

  it('no llama form.setErrors si no hay fieldErrors', () => {
    const form = { setErrors: vi.fn() };
    applyApiError(form, axiosError(409, { message: 'Conflicto' }));
    expect(form.setErrors).not.toHaveBeenCalled();
  });

  it('loguea en consola ante un 5xx', () => {
    const form = { setErrors: vi.fn() };
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    applyApiError(form, axiosError(503, {}));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  it('propaga stripPrefix a parseApiError', () => {
    const form = { setErrors: vi.fn() };
    applyApiError(form, axiosError(400, {
      fields: [{ field: 'viaje.vehiculoID', error: 'Requerido' }],
    }), { stripPrefix: 'viaje' });
    expect(form.setErrors).toHaveBeenCalledWith({ vehiculoID: 'Requerido' });
  });
});
