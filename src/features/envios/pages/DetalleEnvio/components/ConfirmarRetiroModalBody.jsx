import { useState } from 'react';

import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';

import { envioApi } from '@api';
import { applyApiError } from '@domain/apiError';

/** `DeliveryWordMismatchErrorResponse.code` (`SHG-BE-042`, mismo patrón aditivo que `captcha_invalid`). */
const DELIVERY_WORD_MISMATCH_CODE = 'delivery_word_mismatch';

/**
 * Contenido del modal de "Confirmar retiro" en sucursal (`SHG-FE-080`,
 * `SHG-CONTRACT-012`). Reusa el mismo endpoint que `EntregarModalBody`
 * (`PUT /api/envio/{id}/entregar`, `SHG-BE-042`/`SHG-BE-061`) — sin body
 * distinto, sin endpoint nuevo — pero a diferencia de la entrega a domicilio
 * (donde el chofer no siempre tiene la palabra a mano), acá **ambos** campos
 * son obligatorios: el empleado está parado en el mostrador con el
 * destinatario en frente, así que siempre puede pedirle DNI + la palabra de
 * entrega.
 *
 * Con `tienePalabraEntrega === false` (`SHG-CONTRACT-025`) el envío no tiene
 * palabra: el campo no se muestra, no es obligatorio y no se manda. Con el
 * campo ausente se mantiene el comportamiento anterior (obligatoria). El
 * formato (dos palabras, ej. `LUNA-PERRO`) no se valida ni se transforma acá:
 * el backend ignora mayúsculas, tildes, guiones y espacios.
 *
 * Errores posibles (`ENDPOINTS.md §4` sección "retiro en sucursal",
 * `coordination/backend.md` 2026-09-22):
 * - `dniReceptor` vacío → `ApiFieldError` estándar (`applyApiError`).
 * - Palabra que no coincide → `400 { code: "delivery_word_mismatch" }`,
 *   mismo tratamiento que `EntregarModalBody` (error de campo, modal abierto).
 * - `envio.tipoEntrega !== 'sucursal'` o `envio.sucursal !== envio.sucursalEntrega`
 *   (validación server-side de `SHG-BE-061`, `validarRetiroEnSucursal`) → `400`
 *   `{ statusCode, message }` simple, sin `code` — no debería pasar si el botón
 *   se oculta bien (`puedeConfirmarRetiro`), pero si el backend lo rechaza
 *   igual, el mensaje ya es humano y se muestra vía `onErrorInesperado` (toast),
 *   nunca un 400 crudo.
 *
 * La llamada a la API vive ACÁ (no en el hook), mismo criterio que
 * `EntregarModalBody`: si falla, el modal tiene que quedar abierto con lo ya
 * tipeado para que el operador pueda reintentar.
 */
const ConfirmarRetiroModalBody = ({
  id,
  tienePalabraEntrega,
  onRetirado,
  onErrorInesperado,
  onVolver,
}) => {
  const pideLaPalabra = tienePalabraEntrega !== false;
  const [submitting, setSubmitting] = useState(false);

  const form = useForm({
    initialValues: { dniReceptor: '', palabraEntregaIngresada: '' },
    validate: {
      dniReceptor: (value) => (value.trim() ? null : 'Ingresá el DNI de quien retira.'),
      palabraEntregaIngresada: (value) =>
        !pideLaPalabra || value.trim() ? null : 'Ingresá la palabra de entrega.',
    },
  });

  const handleSubmit = async (values) => {
    setSubmitting(true);
    try {
      await envioApi.entregar(id, {
        dniReceptor: values.dniReceptor.trim(),
        ...(pideLaPalabra
          ? { palabraEntregaIngresada: values.palabraEntregaIngresada.trim() }
          : {}),
      });
      onRetirado();
    } catch (error) {
      if (error?.response?.data?.code === DELIVERY_WORD_MISMATCH_CODE) {
        const message =
          error.response.data.message || 'La palabra de entrega ingresada no coincide.';
        form.setFieldError('palabraEntregaIngresada', message);
        return;
      }

      const message = applyApiError(form, error, {
        fallbackMessage: 'No se pudo confirmar el retiro del envío. Probá de nuevo.',
      });
      onErrorInesperado?.(message, error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <Stack gap="sm">
        <Text size="sm">
          Confirmá el retiro del envío <strong>#{id}</strong>.{' '}
          {pideLaPalabra
            ? 'Pedile al destinatario su DNI y la palabra de entrega.'
            : 'Pedile al destinatario su DNI.'}
        </Text>
        <TextInput
          label="DNI de quien retira"
          placeholder="Ej: 30111222"
          required
          {...form.getInputProps('dniReceptor')}
        />
        {pideLaPalabra && (
          <TextInput
            label="Palabra de entrega"
            description="Pedile al destinatario que te la diga."
            placeholder="Ej: LUNA-PERRO"
            required
            {...form.getInputProps('palabraEntregaIngresada')}
          />
        )}
        <Group justify="flex-end">
          <Button variant="default" onClick={onVolver} disabled={submitting}>
            Volver
          </Button>
          <Button type="submit" color="green" loading={submitting}>
            Sí, confirmar retiro
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default ConfirmarRetiroModalBody;
