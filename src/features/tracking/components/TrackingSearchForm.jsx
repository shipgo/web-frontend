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
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.autoFocus=true]
 */
const TrackingSearchForm = ({
  initialValue = '',
  onSubmit,
  loading = false,
  autoFocus = true,
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

  return (
    <form onSubmit={form.onSubmit(handleSubmit)} noValidate>
      <Stack gap="xs">
        <TextInput
          label="Código de seguimiento"
          placeholder="Ej. 7K2M9QX4TP"
          size="md"
          autoFocus={autoFocus}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          key={form.key('codigo')}
          {...form.getInputProps('codigo')}
        />
        <Group justify="space-between" align="center" wrap="wrap-reverse">
          <Text size="xs" c="dimmed">
            Lo encontrás en el email de confirmación de tu envío.
          </Text>
          <Button
            type="submit"
            size="md"
            loading={loading}
            leftSection={<IconSearch size={18} />}
          >
            Consultar
          </Button>
        </Group>
      </Stack>
    </form>
  );
};

export default TrackingSearchForm;
