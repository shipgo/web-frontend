import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Group,
  LoadingOverlay,
  Select,
  SimpleGrid,
  Stack,
  Title,
  TextInput,
} from "@mantine/core";
import {
  IconBuilding,
  IconPhone,
  IconMapPin,
  IconMail,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import { provinciaApi, localidadApi } from "@api";

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
 */
const SucursalForm = ({
  form,
  onSubmit,
  loading,
  onCancel,
  isEdit = false,
}) => {
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [provincias, setProvincias] = useState([]);
  const [localidades, setLocalidades] = useState([]);

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
          title: "Error",
          message: "No se pudieron cargar las provincias",
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
          title: "Error",
          message: "No se pudieron cargar las localidades",
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

      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="lg">
          {/* Información de la Sucursal */}
          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconBuilding size={20} />
                <Title order={4}>Información de la sucursal</Title>
              </Group>

              <TextInput
                label="Nombre"
                placeholder="Ej: Sucursal Centro"
                leftSection={<IconBuilding size={18} />}
                required
                {...form.getInputProps("nombre")}
              />

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="Prefijo"
                  placeholder="Ej: +54"
                  leftSection={<IconPhone size={18} />}
                  required
                  {...form.getInputProps("prefijo")}
                />

                <TextInput
                  label="Teléfono"
                  placeholder="Ej: 351-1234567"
                  leftSection={<IconPhone size={18} />}
                  required
                  {...form.getInputProps("telefono")}
                />
              </SimpleGrid>

              <TextInput
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
                  label="Calle"
                  placeholder="Ej: Av. Colón"
                  leftSection={<IconMapPin size={18} />}
                  required
                  {...form.getInputProps("nombreCalle")}
                />

                <TextInput
                  label="Número"
                  placeholder="Ej: 1234"
                  leftSection={<IconMapPin size={18} />}
                  required
                  {...form.getInputProps("numeroCalle")}
                />
              </SimpleGrid>

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Select
                  label="Provincia"
                  placeholder="Selecciona una provincia"
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
                  label="Localidad"
                  placeholder="Selecciona una localidad"
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

          {/* Botones de acción — mismo patrón visual que el `Footer` compartido
              de `CrearEnvios`/`CrearViaje` (Cancelar `light` rojo + submit) */}
          <Group justify="flex-end" gap="xs">
            <Button
              variant="light"
              color="red"
              onClick={onCancel}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Guardar cambios" : "Crear sucursal"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
};

export default SucursalForm;

