import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Divider,
  Group,
  LoadingOverlay,
  Select,
  SimpleGrid,
  Stack,
  Text,
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
        const localidadesRes = await localidadApi.getAll({
          provinciaId: provinciaID,
        });

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
          <Card withBorder shadow="sm" p="xl">
            <Stack gap="md">
              <Group gap="xs">
                <IconBuilding size={24} />
                <Box>
                  <Text size="lg" fw={600}>
                    Información de la Sucursal
                  </Text>
                  <Text size="sm" c="dimmed">
                    Datos básicos de la sucursal
                  </Text>
                </Box>
              </Group>

              <Divider />

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="Nombre"
                  placeholder="Ej: Sucursal Centro"
                  leftSection={<IconBuilding size={18} />}
                  required
                  {...form.getInputProps("nombre")}
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
          <Card withBorder shadow="sm" p="xl">
            <Stack gap="md">
              <Group gap="xs">
                <IconMapPin size={24} />
                <Box>
                  <Text size="lg" fw={600}>
                    Dirección
                  </Text>
                  <Text size="sm" c="dimmed">
                    Ubicación de la sucursal
                  </Text>
                </Box>
              </Group>

              <Divider />

              <TextInput
                label="Dirección"
                placeholder="Ej: Av. Colón 1234"
                leftSection={<IconMapPin size={18} />}
                required
                {...form.getInputProps("direccion")}
              />

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

          {/* Botones de acción */}
          <Group justify="flex-end" gap="sm">
            <Button variant="default" onClick={onCancel} disabled={loading}>
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

