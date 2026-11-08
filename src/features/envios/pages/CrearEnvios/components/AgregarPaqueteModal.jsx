import {
  Button,
  Group,
  Select,
  Stack,
  TextInput,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { useForm, schemaResolver } from "@mantine/form";
import { IconPlus } from "@tabler/icons-react";

import ResponsiveModal from "@components/ResponsiveModal";
import { useFieldSize } from "@components/useFieldSize";
import { useIsMobile } from "@hooks/useIsMobile";

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
  const size = useFieldSize();
  const isMobile = useIsMobile();

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
      {/* `c="var(--shg-button-text-primary)"`: ver ese token en
          `cssVariablesResolver.js` (SHG-FE-069) — sin esto, el texto del
          color primario en `variant="light"` no llega a 4.5:1 en dark mode
          (axe-core `color-contrast`, SHG-FE-070). */}
      <Button
        variant="light"
        leftSection={<IconPlus size={16} />}
        onClick={open}
        c="var(--shg-button-text-primary)"
      >
        Agregar paquete
      </Button>
      <ResponsiveModal
        opened={opened}
        onClose={handleClose}
        title="Agregar paquete"
        size="md"
      >
        <form onSubmit={handleSubmit} noValidate>
          <Stack>
            <Select
              size={size}
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
              size={size}
              key={form.key("peso")}
              {...form.getInputProps("peso")}
              error={form.errors.peso}
              required
              type="number"
              label="Peso (kg)"
              placeholder="0"
            />
            <TextInput
              size={size}
              key={form.key("descripcion")}
              {...form.getInputProps("descripcion")}
              label="Descripción"
              placeholder="Ej: Caja con documentación"
            />
            <Group justify="flex-end" gap="xs" mt="xs" grow={isMobile}>
              <Button variant="subtle" size={size} onClick={handleClose}>
                Cancelar
              </Button>
              <Button type="submit" size={size}>Agregar paquete</Button>
            </Group>
          </Stack>
        </form>
      </ResponsiveModal>
    </>
  );
};

export default AgregarPaqueteModal;
