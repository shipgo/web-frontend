import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm, schemaResolver } from "@mantine/form";
import { IconPlus } from "@tabler/icons-react";

import { PAQUETE_INITIAL_VALUES, PAQUETE_SCHEMA } from "../constants/schema";

const toNumber = (val) => (val === "" || val == null ? undefined : Number(val));

/**
 * Modal para agregar un paquete (`DetalleEnvioReqDTO`: `categoriaID`, `descripcion`, `peso`)
 * al envío en creación.
 *
 * @param {Object} props
 * @param {Array<{value: string, label: string}>} props.categorias
 * @param {(paquete: {categoriaID: string, descripcion: string, peso: number}) => void} props.onAdd
 */
const AgregarPaqueteModal = ({ categorias = [], onAdd }) => {
  const [opened, { open, close }] = useDisclosure(false);

  const form = useForm({
    mode: "controlled",
    initialValues: PAQUETE_INITIAL_VALUES,
    validate: schemaResolver(PAQUETE_SCHEMA, { sync: true }),
  });

  const handleClose = () => {
    close();
    form.reset();
  };

  const handleSubmit = form.onSubmit((values) => {
    onAdd({
      ...values,
      peso: toNumber(values.peso),
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
              key={form.key("categoriaID")}
              {...form.getInputProps("categoriaID")}
              error={form.errors.categoriaID}
              required
              label="Categoría"
              placeholder="Seleccioná una categoría"
              data={categorias}
              searchable
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
            <TextInput
              key={form.key("descripcion")}
              {...form.getInputProps("descripcion")}
              label="Descripción"
              placeholder="Ej: Caja con documentación"
            />
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
