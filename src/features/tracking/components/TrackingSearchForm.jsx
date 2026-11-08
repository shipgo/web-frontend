import { useForm } from '@mantine/form';
import { Button, Group, Stack, Text, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import { codigoEsValido, CODIGO_INVALIDO_MSG, normalizarCodigo } from '../utils';

/**
 * Input del código de seguimiento con validación local (formato) antes de
 * consultar al backend. Reutilizable por el portal CUSTOMER (`SHG-FE-026`).
 *
 * @param {Object} props
 * @param {string} [props.initialValue='']
 * @param {(codigo: string) => void} props.onSubmit  Recibe el código YA normalizado.
 * @param {() => void} [props.onInvalid]  Se llama cuando el envío falla la validación local (el resultado anterior ya no corresponde).
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.autoFocus=true]
 * @param {boolean} [props.compact=false]  Una sola fila (input + botón con ícono), sin texto de ayuda: se usa cuando ya hay resultado.
 * @param {boolean} [props.disabled=false]  Bloquea el submit (p. ej. sin token de captcha aún, SHG-FE-043).
 */
const TrackingSearchForm = ({
  initialValue = '',
  onSubmit,
  onInvalid,
  loading = false,
  autoFocus = true,
  disabled = false,
  compact = false,
}) => {
  const form = useForm({
    mode: 'uncontrolled',
    initialValues: { codigo: initialValue },
    validate: {
      codigo: (value) => (codigoEsValido(value) ? null : CODIGO_INVALIDO_MSG),
    },
  });

  const handleSubmit = ({ codigo }) => {
    onSubmit(normalizarCodigo(codigo));
  };

  const inputProps = {
    placeholder: 'Ej. 7K2M9QX4TP',
    autoFocus,
    autoCapitalize: 'characters',
    autoCorrect: 'off',
    // La tecla de acción del teclado dice "Buscar" en vez de una flecha genérica.
    enterKeyHint: 'search',
    autoComplete: 'off',
    spellCheck: false,
    disabled,
    key: form.key('codigo'),
    // 16 px evita el zoom automático de iOS; 44 px = objetivo táctil mínimo.
    styles: { input: { fontSize: 16, minHeight: 44 } },
    ...form.getInputProps('codigo'),
  };

  // Misma estructura en ambos modos para que el input no se remonte (y no
  // pierda lo tipeado) al pasar de formulario completo a compacto.
  return (
    <form onSubmit={form.onSubmit(handleSubmit, () => onInvalid?.())} noValidate>
      <Stack gap="xs">
        <Group gap="xs" wrap="nowrap" align="flex-start">
          <TextInput
            {...(compact
              ? { 'aria-label': 'Código de seguimiento' }
              : { label: 'Código de seguimiento' })}
            style={{ flex: 1, minWidth: 0 }}
            {...inputProps}
          />
          {compact ? (
            <Button
              type="submit"
              aria-label="Consultar"
              loading={loading}
              disabled={disabled}
              h={44}
              w={44}
              px={0}
            >
              <IconSearch size={20} />
            </Button>
          ) : null}
        </Group>
        {compact ? null : (
          <Group justify="space-between" align="center" wrap="wrap-reverse">
            <Text size="xs" c="dimmed">
              Lo encontrás en el email de confirmación de tu envío.
            </Text>
            <Button
              type="submit"
              size="md"
              h={44}
              loading={loading}
              disabled={disabled}
              leftSection={<IconSearch size={18} />}
            >
              Consultar
            </Button>
          </Group>
        )}
      </Stack>
    </form>
  );
};

export default TrackingSearchForm;
