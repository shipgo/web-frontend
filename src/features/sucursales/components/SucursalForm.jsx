import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Grid,
  Group,
  LoadingOverlay,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
  TextInput,
} from "@mantine/core";
import {
  IconBuilding,
  IconPhone,
  IconMapPin,
  IconMail,
  IconX,
} from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";

import PageFooter from "@components/PageFooter";
import { useFieldSize } from "@components/useFieldSize";
import { useIsMobile } from "@hooks/useIsMobile";
import { provinciaApi, localidadApi } from "@api";
import { SALIR_SIN_GUARDAR, REINTENTAR_MAS_TARDE, FORMULARIO_INVALIDO } from "@copy/common";

const normalizeText = (text) => {
  if (!text || typeof text !== "string") return "";
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
};

const filterIgnoreAccents = ({ options, search }) => {
  if (!search) return options;

  const normalizedSearch = normalizeText(search);
  const splittedSearch = normalizedSearch.trim().split(" ");

  return options.filter((option) => {
    const normalizedLabel = normalizeText(option.label || "");
    const words = normalizedLabel.trim().split(" ");
    return splittedSearch.every((searchWord) =>
      words.some((word) => word.includes(searchWord))
    );
  });
};

/**
 * Componente de formulario reutilizable para crear/editar sucursales
 * @param {Object} props
 * @param {Object} props.form - Instancia de useForm de Mantine
 * @param {Function} props.onSubmit - Función a ejecutar al enviar el formulario
 * @param {boolean} props.loading - Estado de carga del submit
 * @param {Function} props.onCancel - Función para cancelar
 * @param {boolean} props.isEdit - Si es modo edición o creación
 * @param {import('react').ReactNode} [props.beforeSections] - Cards extra antes de
 *   "Información de la sucursal" (onboarding de empresa, SHG-FE-116).
 * @param {string} [props.submitLabel] - Texto del botón de submit (por defecto
 *   "Crear sucursal" / "Guardar cambios").
 * @param {boolean} [props.hideCancel] - Oculta "Cancelar" (onboarding: no hay a
 *   dónde volver; el logout está en el header).
 */
const SucursalForm = ({
  form,
  onSubmit,
  loading,
  onCancel,
  isEdit = false,
  beforeSections = null,
  submitLabel,
  hideCancel = false,
}) => {
  const size = useFieldSize();
  const isMobile = useIsMobile();
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);

  // Toast cuando el submit falla la validación de Zod — el botón ahora vive en el
  // `<PageFooter>` (fuera del `<form>`), así que dispara `form.onSubmit` por
  // `onClick` como hace `CrearViaje/Footer.jsx`.
  const handleInvalid = (errors) => {
    const firstError = Object.values(errors).find(Boolean);
    notifications.show({
      color: "red",
      title: FORMULARIO_INVALIDO.titulo,
      message: firstError || FORMULARIO_INVALIDO.mensaje,
      icon: <IconX />,
    });
  };

  // Cancelar con confirmación si hay cambios sin guardar — mismo criterio que el
  // `Footer` de Vehículos/Usuarios (SHG-FE-034/033).
  const handleCancel = () => {
    if (!form.isDirty()) {
      onCancel();
      return;
    }

    modals.openConfirmModal({
      title: SALIR_SIN_GUARDAR.titulo,
      fullScreen: isMobile,
      children: (
        <Text size="sm">{SALIR_SIN_GUARDAR.mensaje}</Text>
      ),
      labels: { confirm: SALIR_SIN_GUARDAR.salir, cancel: SALIR_SIN_GUARDAR.seguir },
      confirmProps: { color: "red" },
      cancelProps: { variant: "subtle" },
      groupProps: { gap: "xs" },
      onConfirm: onCancel,
    });
  };

  // Cargar provincias al montar el componente
  useEffect(() => {
    const loadProvincias = async () => {
      try {
        setCatalogsLoading(true);
        const provinciasRes = await provinciaApi.getAll();

        setProvincias(
          provinciasRes.map((p) => ({
            value: p.id.toString(),
            label: p.nombre,
          }))
        );
      } catch (error) {
        console.error("Error cargando provincias:", error);
        notifications.show({
          title: "No se pudieron cargar las provincias",
          message: REINTENTAR_MAS_TARDE,
          color: "red",
        });
      } finally {
        setCatalogsLoading(false);
      }
    };

    loadProvincias();
  }, []);

  // Cargar localidades cuando cambia la provincia
  useEffect(() => {
    const loadLocalidades = async () => {
      const provinciaID = form.values.provinciaID;

      if (!provinciaID) {
        setLocalidades([]);
        return;
      }

      try {
        const localidadesRes = await localidadApi.getByProvincia(provinciaID);

        setLocalidades(
          localidadesRes.map((l) => ({
            value: l.id.toString(),
            label: l.nombre,
          }))
        );
      } catch (error) {
        console.error("Error cargando localidades:", error);
        notifications.show({
          title: "No se pudieron cargar las localidades",
          message: REINTENTAR_MAS_TARDE,
          color: "red",
        });
      }
    };

    loadLocalidades();
  }, [form.values.provinciaID]);

  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={catalogsLoading}
        overlayProps={{ blur: 2 }}
        loaderProps={{ type: "bars" }}
      />

      <form onSubmit={form.onSubmit(onSubmit, handleInvalid)} noValidate>
        <Stack gap="lg">
          {beforeSections}

          {/* Información de la Sucursal */}
          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconBuilding size={20} />
                <Title order={4}>Información de la sucursal</Title>
              </Group>

              <TextInput
                size={size}
                label="Nombre"
                placeholder="Ej: Sucursal Centro"
                leftSection={<IconBuilding size={18} />}
                required
                {...form.getInputProps("nombre")}
              />

              <Grid>
                <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  size={size}
                  label="Prefijo"
                  placeholder="Ej: 351"
                  leftSection={<IconPhone size={18} />}
                  required
                  {...form.getInputProps("prefijo")}
                />
                </Grid.Col>

                <Grid.Col span={{ base: 12, sm: 6 }}>
                <TextInput
                  size={size}
                  label="Teléfono"
                  placeholder="Ej: 3511234567"
                  leftSection={<IconPhone size={18} />}
                  required
                  {...form.getInputProps("telefono")}
                />
                </Grid.Col>
              </Grid>

              <TextInput
                size={size}
                label="Email"
                placeholder="Ej: sucursal@empresa.com"
                type="email"
                leftSection={<IconMail size={18} />}
                {...form.getInputProps("email")}
              />
            </Stack>
          </Card>

          {/* Dirección */}
          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconMapPin size={20} />
                <Title order={4}>Dirección</Title>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  size={size}
                  label="Calle"
                  placeholder="Ej: Av. Colón"
                  leftSection={<IconMapPin size={18} />}
                  required
                  {...form.getInputProps("nombreCalle")}
                />

                <TextInput
                  size={size}
                  label="Número"
                  placeholder="Ej: 1234"
                  leftSection={<IconMapPin size={18} />}
                  required
                  {...form.getInputProps("numeroCalle")}
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Select
                  size={size}
                  label="Provincia"
                  placeholder="Seleccioná una provincia"
                  data={provincias}
                  searchable
                  filter={filterIgnoreAccents}
                  leftSection={<IconMapPin size={18} />}
                  required
                  {...form.getInputProps("provinciaID")}
                  onChange={(value) => {
                    form.setFieldValue("provinciaID", value);
                    form.setFieldValue("localidadID", null);
                  }}
                />

                <Select
                  size={size}
                  label="Localidad"
                  placeholder="Seleccioná una localidad"
                  data={localidades}
                  searchable
                  filter={filterIgnoreAccents}
                  leftSection={<IconMapPin size={18} />}
                  disabled={!form.values.provinciaID}
                  required
                  {...form.getInputProps("localidadID")}
                />
              </SimpleGrid>
            </Stack>
          </Card>
        </Stack>
      </form>

      {/* Footer canónico (`SHG-FE-036`): el botón vive en `AppShell.footer`, fuera
          del `<form>`, así que el submit se recablea a `onClick`. Se preserva el
          confirm-al-cancelar-si-dirty. */}
      <PageFooter>
        {!hideCancel && (
          <Button
            variant="light"
            color="red"
            onClick={handleCancel}
            disabled={loading}
          >
            Cancelar
          </Button>
        )}
        <Button
          loading={loading}
          onClick={() => form.onSubmit(onSubmit, handleInvalid)()}
        >
          {submitLabel ?? (isEdit ? "Guardar cambios" : "Crear sucursal")}
        </Button>
      </PageFooter>
    </Box>
  );
};

export default SucursalForm;

