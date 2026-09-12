import { useState } from 'react';

import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

import { envioApi } from '@api';
import { applyApiError } from '@domain/apiError';

/** `DeliveryWordMismatchErrorResponse.code` (`SHG-BE-042`, mismo patrón aditivo que `captcha_invalid`). */
const DELIVERY_WORD_MISMATCH_CODE = 'delivery_word_mismatch';

/**
 * Contenido del modal de "Entregar envío" (`SHG-FE-058`, fix de la regresión P1
 * de `SHG-BE-042`: el body de `PUT /api/envio/{id}/entregar` pasó a ser
 * obligatorio — `EntregaEnvioReqDTO { dniReceptor (@NotEmpty), palabraEntregaIngresada? }`).
 *
 * - `dniReceptor`: obligatorio, texto libre (el backend no valida formato,
 *   sólo que no esté vacío).
 * - `palabraEntregaIngresada`: opcional — el operador la pide de palabra al
 *   destinatario si la tiene a mano. Nunca sabe de antemano si el envío la
 *   requiere: `palabraEntrega` no está en `EnvioDTO`, nunca se expone al staff.
 *
 * La llamada a la API vive ACÁ (no en el hook) a propósito: si el backend
 * responde `delivery_word_mismatch` o un `ApiFieldError` de `dniReceptor`, el
 * modal tiene que quedar abierto y mantener lo ya tipeado para que el
 * operador pueda reintentar — por eso no se cierra el modal antes de tener el
 * resultado de la request (a diferencia de `ejecutarFalloEntrega`).
 *
 * `delivery_word_mismatch` se muestra como error del campo
 * `palabraEntregaIngresada` (mismo mecanismo que `applyApiError` usa para
 * `ApiFieldError` — el mensaje del backend ya es claro por sí mismo).
 */
const EntregarModalBody = ({ id, onEntregado, onErrorInesperado, onVolver }) => {
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: { dniReceptor: '', palabraEntregaIngresada: '' },
    validate: {
      dniReceptor: (value) => (value.trim() ? null : 'El DNI de quien recibe es obligatorio'),
    },
  });

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const body = { dniReceptor: values.dniReceptor.trim() };
      if (values.palabraEntregaIngresada.trim()) {
        body.palabraEntregaIngresada = values.palabraEntregaIngresada.trim();
      }
      await envioApi.entregar(id, body);
      onEntregado();
    } catch (error) {
      if (error?.response?.data?.code === DELIVERY_WORD_MISMATCH_CODE) {
        const message =
          error.response.data.message || 'La palabra de entrega ingresada no coincide.';
        form.setFieldError('palabraEntregaIngresada', message);
        return;
      }

      const message = applyApiError(form, error, {
        fallbackMessage: 'No se pudo marcar el envío como entregado.',
      });
      // `applyApiError` ya marca los campos con `ApiFieldError` (ej. `dniReceptor`
      // faltante); los errores sin campo asociado (403/409/5xx/red) se avisan
      // igual que el resto de las acciones de este panel (`handleAccionError`).
      onErrorInesperado?.(message, error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <Stack gap="sm">
        <Text size="sm">
          ¿Confirmás que el envío <strong>#{id}</strong> fue entregado? El estado pasará a
          "Entregado".
        </Text>
        <TextInput
          label="DNI de quien recibe"
          placeholder="Ej: 30111222"
          required
          {...form.getInputProps('dniReceptor')}
        />
        <TextInput
          label="Palabra de entrega"
          description="Opcional — pedísela de palabra al destinatario si la tiene a mano."
          placeholder="Ej: AB23K9"
          {...form.getInputProps('palabraEntregaIngresada')}
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onVolver} disabled={submitting}>
            Volver
          </Button>
          <Button type="submit" color="green" loading={submitting}>
            Sí, entregar
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default EntregarModalBody;
