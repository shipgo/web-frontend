import { useDisclosure } from '@mantine/hooks';
import { IconMailPlus } from '@tabler/icons-react';

import { useForm } from '@mantine/form';
import { zodResolver } from 'mantine-form-zod-resolver';
import { Button, Group, Modal, NumberInput, Select, Stack, Text, Textarea } from '@mantine/core';

import { z } from 'zod';
import { uniqueId } from 'es-toolkit/compat';

import { useEnvioFormContext } from "../contexts/CrearEnvioContext";

const COMMENT_ROWS = 4;
const COMMENT_MAX_LENGTH = 256;

const INITIAL_VALUES = {
  peso: '',
  categoria: '',
  comentario: '',
};

const PACKAGE_FORM_SCHEMA = z.object({
  peso: z.number().positive({ message: "El peso debe ser mayor a 0" }),
  categoria: z.string().nonempty({ message: "La categoría es requerida" }),
  comentario: z.string().trim().optional().or(z.literal("")),
});

const PaquetesForm = () => {
  const [isOpen, { close, open }] = useDisclosure(false, { onClose: () => form.reset() });

  const { setFieldValue } = useEnvioFormContext();

  const form = useForm({
    initialValues: INITIAL_VALUES,
    validate: zodResolver(PACKAGE_FORM_SCHEMA),
    validateInputOnBlur: true,
    transformValues: (values) => ({
      ...values,
      peso: Number(values.peso),
      comentario: values.comentario.trim(),
    }),
  });

  const addPackage = () => {
    setFieldValue('paquetes', prev => [...prev, { id: uniqueId(), ...form.getValues() }]);
    close();
  }

  return (
    <>
      <Button
        onClick={open}
        variant="light"
        leftSection={<IconMailPlus />}
      >
        Agregar paquete
      </Button>

      <Modal
        centered
        size="lg"
        padding="xl"
        closeOnEscape={false}
        closeOnClickOutside={false}
        withCloseButton={false}
        opened={isOpen}
        onClose={close}
        title={(
          <>
            <Text size="xl">Agregar paquete</Text>
            <Text c="gray">Completá los siguientes datos para generar un paquete</Text>
          </>
        )}
      >
        <Stack>

          <Group>
            <NumberInput
              flex="1"
              label="Peso"
              placeholder="En kg"
              hideControls
              thousandSeparator="."
              decimalSeparator=","
              allowNegative={false}
              {...form.getInputProps("peso")}
            />

            <Select
              flex="1"
              searchable
              label="Categoria"
              placeholder="Seleccioná una opción"
              data={['Categoría 1', 'Categoría 2', 'Categoría 3']}
              {...form.getInputProps("categoria")}
            />
          </Group>

          <Textarea
            autosize
            spellCheck="false"
            minRows={COMMENT_ROWS}
            maxLength={COMMENT_MAX_LENGTH}
            label="Comentario (Opcional)"
            placeholder="Ej: Frágil, no apilar, etc."
            {...form.getInputProps("comentario")}
          />

          <Group gap="sm">
            <Button variant="light" mr="auto">Limpiar campos</Button>
            <Button variant="subtle" onClick={close}>Cancelar</Button>
            <Button
              onClick={addPackage}
              disabled={!form.isValid()}
            >
              Añadir paquete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  )
}

export default PaquetesForm
