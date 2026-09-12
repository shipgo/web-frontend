import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Group,
  LoadingOverlay,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import { IconCalendar, IconCar, IconTag, IconX } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

import PageFooter from "@components/PageFooter";
import { marcaApi } from "../api/catalogoVehiculos.api";

const currentYear = new Date().getFullYear();

/**
 * Formulario reutilizable de crear/editar Modelo (`ModeloReqDTO { nombre,
 * marcaID, anio }`, `ENDPOINTS.md` §12). Igual patrón de `VehiculoForm`
 * (select de marca cargado on-mount + footer canónico `SHG-FE-036`).
 *
 * @param {Object} props
 * @param {Object} props.form - Instancia de useForm de Mantine
 * @param {Function} props.onSubmit
 * @param {boolean} props.loading
 * @param {Function} props.onCancel
 * @param {boolean} [props.isEdit]
 */
const ModeloForm = ({ form, onSubmit, loading, onCancel, isEdit = false }) => {
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    const loadMarcas = async () => {
      try {
        setCatalogsLoading(true);
        const marcasRes = await marcaApi.getAll();

        setMarcas(
          marcasRes.map((m) => ({
            value: m.id.toString(),
            label: m.nombre,
          }))
        );
      } catch (error) {
        console.error("Error cargando marcas:", error);
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar las marcas",
          color: "red",
        });
      } finally {
        setCatalogsLoading(false);
      }
    };

    loadMarcas();
  }, []);

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
      <LoadingOverlay
        visible={catalogsLoading}
        overlayProps={{ blur: 2 }}
        loaderProps={{ type: "bars" }}
      />

      <form onSubmit={form.onSubmit(onSubmit, handleInvalid)}>
        <Card>
          <Stack gap="md">
            <Group gap="0.75rem">
              <IconCar size={20} />
              <Title order={4}>Información del modelo</Title>
            </Group>

            <TextInput
              label="Nombre"
              placeholder="Ej: Sprinter"
              leftSection={<IconCar size={18} />}
              required
              {...form.getInputProps("nombre")}
            />

            <SimpleGrid cols={{ base: 1, sm: 2 }}>
              <Select
                label="Marca"
                placeholder="Seleccioná una marca"
                data={marcas}
                searchable
                leftSection={<IconTag size={18} />}
                required
                {...form.getInputProps("marcaID")}
              />

              <NumberInput
                label="Año"
                placeholder={`Ej: ${currentYear}`}
                leftSection={<IconCalendar size={18} />}
                min={1900}
                max={currentYear + 1}
                required
                {...form.getInputProps("anio")}
              />
            </SimpleGrid>
          </Stack>
        </Card>
      </form>

      <PageFooter>
        <Button variant="light" color="red" onClick={handleCancel} disabled={loading}>
          Cancelar
        </Button>
        <Button loading={loading} onClick={() => form.onSubmit(onSubmit, handleInvalid)()}>
          {isEdit ? "Guardar cambios" : "Crear modelo"}
        </Button>
      </PageFooter>
    </Box>
  );
};

export default ModeloForm;
