import {
  Button,
  Group,
  Modal,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { IconPlus } from "@tabler/icons-react";

const INITIAL_VALUES = {
  categoriaID: null,
  descripcion: "",
  peso: "",
};

/**
 * Modal para agregar o editar un paquete (DetalleEnvio) dentro del formulario
 * de edición de un envío.
 *
 * @param {Object} props
 * @param {Array<{value: string, label: string}>} props.categorias
 * @param {(paquete: {id?: number, categoriaID: string, descripcion: string, peso: number}) => void} props.onSave
 * @param {Object} [props.initialValues] - Si se pasa, el modal actúa en modo edición
 * @param {React.ReactNode} [props.trigger] - Elemento que abre el modal (por defecto, un botón "Añadir paquete")
 */
const DetalleEnvioModal = ({ categorias = [], onSave, initialValues, trigger }) => {
  const [opened, { open, close }] = useDisclosure(false);
  const isEdit = Boolean(initialValues);

  const form = useForm({
    mode: "controlled",
    initialValues: initialValues ?? INITIAL_VALUES,
    validate: {
      categoriaID: (value) => (!value ? "Seleccioná una categoría" : null),
      peso: (value) =>
        !value || isNaN(Number(value)) || Number(value) <= 0
          ? "El peso debe ser mayor a 0"
          : null,
    },
  });

  const handleOpen = () => {
    form.setValues(initialValues ?? INITIAL_VALUES);
    open();
  };

  const handleClose = () => {
    close();
    form.reset();
  };

  const handleSubmit = form.onSubmit((values) => {
    onSave({
      ...values,
      id: initialValues?.id,
      peso: Number(values.peso),
    });
    handleClose();
  });

  return (
    <>
      {trigger ? (
        <span onClick={handleOpen} style={{ cursor: "pointer" }}>
          {trigger}
        </span>
      ) : (
        <Button
          variant="light"
          leftSection={<IconPlus size={16} />}
          onClick={handleOpen}
        >
          Añadir paquete
        </Button>
      )}
      <Modal
        opened={opened}
        onClose={handleClose}
        title={isEdit ? "Editar paquete" : "Añadir paquete"}
        centered
        size="md"
      >
        <form onSubmit={handleSubmit} noValidate>
          <Stack>
            <Select
              key={form.key("categoriaID")}
              {...form.getInputProps("categoriaID")}
              required
              label="Categoría"
              placeholder="Seleccioná una categoría"
              data={categorias}
              searchable
            />
            <TextInput
              key={form.key("peso")}
              {...form.getInputProps("peso")}
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
              <Button type="submit">{isEdit ? "Guardar" : "Agregar paquete"}</Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </>
  );
};

export default DetalleEnvioModal;
