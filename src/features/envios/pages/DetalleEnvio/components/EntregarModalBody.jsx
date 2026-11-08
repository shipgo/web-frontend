import { useState } from 'react';

import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

import { useFieldSize } from '@components/useFieldSize';
import { useIsMobile } from '@hooks/useIsMobile';
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
 *   destinatario si la tiene a mano. `palabraEntrega` no está en `EnvioDTO`
 *   (nunca se expone al staff); sólo se sabe si el envío tiene palabra
 *   gracias a `tienePalabraEntrega` (`SHG-CONTRACT-024`). Con `tienePalabraEntrega ===
 *   false` (`SHG-CONTRACT-025`) el campo no se muestra ni se manda; con el
 *   campo ausente se mantiene el comportamiento anterior (se ofrece). El
 *   formato (dos palabras, ej. `LUNA-PERRO`) no se valida ni se transforma acá:
 *   el backend ignora mayúsculas, tildes, guiones y espacios.
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
const EntregarModalBody = ({
  id,
  tienePalabraEntrega,
  onEntregado,
  onErrorInesperado,
  onVolver,
}) => {
  const size = useFieldSize();
  const isMobile = useIsMobile();
  const pideLaPalabra = tienePalabraEntrega !== false;
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: { dniReceptor: '', palabraEntregaIngresada: '' },
    validate: {
      dniReceptor: (value) => (value.trim() ? null : 'Ingresá el DNI de quien recibe.'),
    },
  });

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      const body = { dniReceptor: values.dniReceptor.trim() };
      if (pideLaPalabra && values.palabraEntregaIngresada.trim()) {
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
        fallbackMessage: 'No se pudo marcar el envío como entregado. Probá de nuevo.',
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
          ¿Confirmás que el envío <strong>#{id}</strong> fue entregado?
        </Text>
        <TextInput
          size={size}
          label="DNI de quien recibe"
          placeholder="Ej: 30111222"
          required
          {...form.getInputProps('dniReceptor')}
        />
        {pideLaPalabra && (
          <TextInput
          size={size}
            label="Palabra de entrega"
            description="Opcional. Si el destinatario la tiene, ingresala."
            placeholder="Ej: LUNA-PERRO"
            {...form.getInputProps('palabraEntregaIngresada')}
          />
        )}
        <Group justify="flex-end" grow={isMobile}>
          <Button variant="default" size={size} onClick={onVolver} disabled={submitting}>
            Volver
          </Button>
          <Button type="submit" color="green" size={size} loading={submitting}>
            Sí, entregar
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default EntregarModalBody;
