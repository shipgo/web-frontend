import {
  Button,
  Group,
  Modal,
  Select,
  SimpleGrid,
  Stack,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm, schemaResolver } from "@mantine/form";
import { IconPlus } from "@tabler/icons-react";

import { PAQUETE_INITIAL_VALUES, PAQUETE_SCHEMA } from "../constants/schema";
import { CATEGORIAS, TAMANOS } from "../constants/mocks";

const toNumber = (val) => (val === "" || val == null ? undefined : Number(val));

const AgregarPaqueteModal = ({ onAdd }) => {
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    mode: "controlled",
    initialValues: PAQUETE_INITIAL_VALUES,
    validate: schemaResolver(PAQUETE_SCHEMA, { sync: true }),
  });

  const isPersonalizado = form.values.tamano === "personalizado";

  const handleClose = () => {
    close();
    form.reset();
  };

  const handleSubmit = form.onSubmit((values) => {
    onAdd({
      ...values,
      peso: toNumber(values.peso),
      largo: toNumber(values.largo),
      ancho: toNumber(values.ancho),
      alto: toNumber(values.alto),
    });
    handleClose();
  });

  return (
    <>
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={open}
      >
        Añadir paquete
      </Button>
      <Modal
        opened={opened}
        onClose={handleClose}
        title="Añadir paquete"
        centered
        size="md"
      >
        <form onSubmit={handleSubmit} noValidate>
          <Stack>
            <Select
              key={form.key("tamano")}
              {...form.getInputProps("tamano")}
              error={form.errors.tamano}
              required
              label="Tamaño del paquete"
              placeholder="Seleccioná un tamaño"
              data={TAMANOS}
            />
            <Select
              key={form.key("categoria")}
              {...form.getInputProps("categoria")}
              error={form.errors.categoria}
              required
              label="Categoría"
              placeholder="Seleccioná una categoría"
              data={CATEGORIAS}
            />
            <TextInput
              key={form.key("peso")}
              {...form.getInputProps("peso")}
              error={form.errors.peso}
              required
              type="number"
              label="Peso (kg)"
              placeholder="0"
            />
            {isPersonalizado && (
              <SimpleGrid cols={3}>
                <TextInput
                  key={form.key("largo")}
                  {...form.getInputProps("largo")}
                  error={form.errors.largo}
                  required
                  type="number"
                  label="Largo (cm)"
                  placeholder="0"
                />
                <TextInput
                  key={form.key("ancho")}
                  {...form.getInputProps("ancho")}
                  error={form.errors.ancho}
                  required
                  type="number"
                  label="Ancho (cm)"
                  placeholder="0"
                />
                <TextInput
                  key={form.key("alto")}
                  {...form.getInputProps("alto")}
                  error={form.errors.alto}
                  required
                  type="number"
                  label="Alto (cm)"
                  placeholder="0"
                />
              </SimpleGrid>
            )}
            <Group justify="flex-end" gap="xs" mt="xs">
              <Button variant="subtle" onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit">Agregar paquete</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};

export default AgregarPaqueteModal;
