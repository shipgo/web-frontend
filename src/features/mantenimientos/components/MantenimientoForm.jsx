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
  Textarea,
} from "@mantine/core";
import {
  IconCalendar,
  IconCar,
  IconFileDescription,
  IconTools,
  IconUser,
} from "@tabler/icons-react";
import { DateTimePicker } from "@mantine/dates";
import { notifications } from "@mantine/notifications";

import { vehiculoApi } from "@api";
import { tipoMantenimientoApi } from "../api/mantenimientos.api";

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
 * Componente de formulario reutilizable para crear/editar mantenimientos
 * @param {Object} props
 * @param {Object} props.form - Instancia de useForm de Mantine
 * @param {Function} props.onSubmit - Función a ejecutar al enviar el formulario
 * @param {boolean} props.loading - Estado de carga del submit
 * @param {Function} props.onCancel - Función para cancelar
 * @param {boolean} props.isEdit - Si es modo edición o creación
 */
const MantenimientoForm = ({
  form,
  onSubmit,
  loading,
  onCancel,
  isEdit = false,
}) => {
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [tiposMantenimiento, setTiposMantenimiento] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  // Cargar catálogos al montar el componente
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setCatalogsLoading(true);

        const [tiposRes, vehiculosRes] = await Promise.all([
          tipoMantenimientoApi.getAll(),
          vehiculoApi.getAll(),
        ]);

        setTiposMantenimiento(
          tiposRes.map((t) => ({
            value: t.id.toString(),
            label: t.nombre,
          }))
        );

        setVehiculos(
          vehiculosRes.map((v) => ({
            value: v.id.toString(),
            label: `${v.patente} - ${v.marca?.nombre || v.marca || ""} ${
              v.modelo?.nombre || v.modelo || ""
            }`.trim(),
          }))
        );
      } catch (error) {
        console.error("Error cargando catálogos:", error);
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar los datos necesarios",
          color: "red",
        });
      } finally {
        setCatalogsLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  return (
    <Box pos="relative">
      <LoadingOverlay
        visible={catalogsLoading}
        overlayProps={{ blur: 2 }}
        loaderProps={{ type: "bars" }}
      />

      <form onSubmit={form.onSubmit(onSubmit)}>
        <Stack gap="lg">
          {/* Información del Mecánico */}
          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconUser size={20} />
                <Title order={4}>Información del mecánico</Title>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <TextInput
                  label="Nombre del Mecánico"
                  placeholder="Ingresa el nombre"
                  leftSection={<IconUser size={18} />}
                  required
                  {...form.getInputProps("nombreMecanico")}
                />

                <TextInput
                  label="Apellido del Mecánico"
                  placeholder="Ingresa el apellido"
                  leftSection={<IconUser size={18} />}
                  required
                  {...form.getInputProps("apellidoMecanico")}
                />
              </SimpleGrid>
            </Stack>
          </Card>

          {/* Información del Mantenimiento */}
          <Card>
            <Stack gap="md">
              <Group gap="0.75rem">
                <IconTools size={20} />
                <Title order={4}>Información del mantenimiento</Title>
              </Group>

              <SimpleGrid cols={{ base: 1, sm: 2 }}>
                <Select
                  label="Vehículo"
                  placeholder="Selecciona un vehículo"
                  data={vehiculos}
                  searchable
                  filter={filterIgnoreAccents}
                  leftSection={<IconCar size={18} />}
                  required
                  disabled={isEdit}
                  {...form.getInputProps("vehiculoID")}
                />

                <Select
                  label="Tipo de Mantenimiento"
                  placeholder="Selecciona el tipo"
                  data={tiposMantenimiento}
                  searchable
                  filter={filterIgnoreAccents}
                  leftSection={<IconTools size={18} />}
                  required
                  {...form.getInputProps("tipoMantenimientoID")}
                />
              </SimpleGrid>

              <DateTimePicker
                label="Fecha y Hora del Mantenimiento"
                placeholder="Selecciona la fecha"
                leftSection={<IconCalendar size={18} />}
                valueFormat="DD/MM/YYYY HH:mm"
                minDate={new Date()}
                required
                {...form.getInputProps("fechaHoraMantenimiento")}
              />

              <Textarea
                label="Descripción"
                placeholder="Describe los detalles del mantenimiento..."
                leftSection={<IconFileDescription size={18} />}
                minRows={4}
                maxRows={6}
                {...form.getInputProps("descripcion")}
              />
            </Stack>
          </Card>

          {/* Botones de acción */}
          <Group justify="flex-end" gap="xs">
            <Button variant="subtle" color="red" onClick={onCancel} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Guardar cambios" : "Crear mantenimiento"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Box>
  );
};

export default MantenimientoForm;

