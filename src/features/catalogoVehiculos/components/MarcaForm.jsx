import { Box, Button, Card, Group, Stack, Text, TextInput, Title } from "@mantine/core";
import { IconTag, IconX } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

import PageFooter from "@components/PageFooter";

/**
 * Formulario reutilizable de crear/editar Marca (`MarcaReqDTO { nombre }`,
 * `ENDPOINTS.md` §11). Entidad de un solo campo — mismo patrón de
 * `SucursalForm`/`VehiculoForm` (footer canónico `SHG-FE-036`, confirm al
 * cancelar con cambios sin guardar).
 *
 * @param {Object} props
 * @param {Object} props.form - Instancia de useForm de Mantine
 * @param {Function} props.onSubmit
 * @param {boolean} props.loading
 * @param {Function} props.onCancel
 * @param {boolean} [props.isEdit]
 */
const MarcaForm = ({ form, onSubmit, loading, onCancel, isEdit = false }) => {
  const handleInvalid = (errors) => {
    const firstError = Object.values(errors).find(Boolean);
    notifications.show({
      color: "red",
      title: "Revisá el formulario",
      message: firstError || "Completá los datos requeridos",
      icon: <IconX />,
    });
  };

  const handleCancel = () => {
    if (!form.isDirty()) {
      onCancel();
      return;
    }

    modals.openConfirmModal({
      title: "Cancelar",
      children: (
        <Text size="sm">
          Tenés cambios sin guardar. ¿Seguro que querés salir?
        </Text>
      ),
      labels: { confirm: "Sí, cancelar", cancel: "Seguir editando" },
      confirmProps: { color: "red" },
      cancelProps: { variant: "subtle" },
      groupProps: { gap: "xs" },
      onConfirm: onCancel,
    });
  };

  return (
    <Box pos="relative">
      <form onSubmit={form.onSubmit(onSubmit, handleInvalid)}>
        <Card>
          <Stack gap="md">
            <Group gap="0.75rem">
              <IconTag size={20} />
              <Title order={4}>Información de la marca</Title>
            </Group>

            <TextInput
              label="Nombre"
              placeholder="Ej: Mercedes-Benz"
              leftSection={<IconTag size={18} />}
              required
              {...form.getInputProps("nombre")}
            />
          </Stack>
        </Card>
      </form>

      <PageFooter>
        <Button variant="light" color="red" onClick={handleCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button loading={loading} onClick={() => form.onSubmit(onSubmit, handleInvalid)()}>
          {isEdit ? "Guardar cambios" : "Crear marca"}
        </Button>
      </PageFooter>
    </Box>
  );
};

export default MarcaForm;
