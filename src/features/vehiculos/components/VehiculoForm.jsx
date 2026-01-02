import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Card,
  Divider,
  Group,
  LoadingOverlay,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Text,
  TextInput,
} from "@mantine/core";
import {
  IconCar,
  IconGasStation,
  IconCalendar,
  IconRuler,
  IconCheck,
  IconGauge,
  IconWeight,
} from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import {
  combustibleApi,
  marcaApi,
  modeloApi,
  tipoRuedaApi,
  tipoVehiculoApi,
} from "../api/vehiculos.api";

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
 * Componente de formulario reutilizable para crear/editar vehículos
 * @param {Object} props
 * @param {Object} props.form - Instancia de useForm de Mantine
 * @param {Function} props.onSubmit - Función a ejecutar al enviar el formulario
 * @param {boolean} props.loading - Estado de carga del submit
 * @param {Function} props.onCancel - Función para cancelar
 * @param {boolean} props.isEdit - Si es modo edición o creación
 */
const VehiculoForm = ({
  form,
  onSubmit,
  loading,
  onCancel,
  isEdit = false,
}) => {
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [modelos, setModelos] = useState([]);
  const [combustibles, setCombustibles] = useState([]);
  const [tiposRueda, setTiposRueda] = useState([]);

  // Cargar catálogos al montar el componente
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setCatalogsLoading(true);

        const [tiposVehiculoRes, marcasRes, combustiblesRes, tiposRuedaRes] =
          await Promise.all([
            tipoVehiculoApi.getAll(),
            marcaApi.getAll(),
            combustibleApi.getAll(),
            tipoRuedaApi.getAll(),
          ]);

        setTiposVehiculo(
          tiposVehiculoRes.map((t) => ({
            value: t.id.toString(),
            label: t.nombre,
          }))
        );

        setMarcas(
          marcasRes.map((m) => ({
            value: m.id.toString(),
            label: m.nombre,
          }))
        );

        setCombustibles(
          combustiblesRes.map((c) => ({
            value: c.id.toString(),
            label: c.nombre,
          }))
        );

        setTiposRueda(
          tiposRuedaRes.map((tr) => ({
            value: tr.id.toString(),
            label: tr.nombre,
          }))
        );
      } catch (error) {
        console.error("Error cargando catálogos:", error);
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar los catálogos necesarios",
          color: "red",
        });
      } finally {
        setCatalogsLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  // Cargar modelos cuando cambia la marca
  useEffect(() => {
    const loadModelos = async () => {
      const marcaID = form.values.marcaID;

      if (!marcaID) {
        setModelos([]);
        return;
      }

      try {
        const modelosRes = await modeloApi.getAll({ marcaId: marcaID });
        setModelos(
          modelosRes.map((m) => ({
            value: m.id.toString(),
            label: m.nombre,
          }))
        );
      } catch (error) {
        console.error("Error cargando modelos:", error);
        notifications.show({
          title: "Error",
          message: "No se pudieron cargar los modelos",
          color: "red",
        });
      }
    };

    loadModelos();
  }, [form.values.marcaID]);

  return (
    <form onSubmit={form.onSubmit(onSubmit)}>
      <Stack gap="lg">
        {/* Información del Vehículo */}
        <Card shadow="sm" p="xl" radius="md" withBorder pos="relative">
          <LoadingOverlay
            visible={catalogsLoading}
            overlayProps={{ radius: "md", blur: 2 }}
          />

          <Group gap="sm" mb="lg">
            <IconCar size={24} stroke={1.5} />
            <Box>
              <Text fw={600} size="lg">
                Información del Vehículo
              </Text>
              <Text size="sm" c="dimmed">
                Datos básicos del vehículo
              </Text>
            </Box>
          </Group>

          <Divider mb="lg" />

          <Stack gap="lg">
            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              <TextInput
                label="Patente"
                placeholder="Ej: ABC123"
                required
                {...form.getInputProps("patente")}
              />
              <Select
                label="Tipo de Vehículo"
                placeholder="Seleccione"
                required
                data={tiposVehiculo}
                searchable
                filter={filterIgnoreAccents}
                {...form.getInputProps("tipoVehiculoID")}
              />
              <Select
                label="Marca"
                placeholder="Seleccione"
                required
                data={marcas}
                searchable
                filter={filterIgnoreAccents}
                {...form.getInputProps("marcaID")}
                onChange={(value) => {
                  form.setFieldValue("marcaID", value);
                  form.setFieldValue("modeloID", null);
                }}
              />
            </SimpleGrid>

            <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
              <Select
                label="Modelo"
                placeholder="Seleccione primero una marca"
                required
                data={modelos}
                searchable
                filter={filterIgnoreAccents}
                disabled={!form.values.marcaID}
                {...form.getInputProps("modeloID")}
              />
              <NumberInput
                label="Año de Compra"
                placeholder="Ej: 2020"
                required
                min={1900}
                max={new Date().getFullYear()}
                {...form.getInputProps("anioCompra")}
              />
              <NumberInput
                label="Kilometraje"
                placeholder="Ej: 50000"
                required
                min={0}
                suffix=" km"
                thousandSeparator="."
                decimalSeparator=","
                {...form.getInputProps("kilometraje")}
              />
            </SimpleGrid>
          </Stack>
        </Card>

        {/* Especificaciones Técnicas */}
        <Card shadow="sm" p="xl" radius="md" withBorder>
          <Group gap="sm" mb="lg">
            <IconGauge size={24} stroke={1.5} />
            <Box>
              <Text fw={600} size="lg">
                Especificaciones Técnicas
              </Text>
              <Text size="sm" c="dimmed">
                Características técnicas del vehículo
              </Text>
            </Box>
          </Group>

          <Divider mb="lg" />

          <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="lg">
            <Select
              label="Combustible"
              placeholder="Seleccione"
              required
              data={combustibles}
              searchable
              filter={filterIgnoreAccents}
              {...form.getInputProps("combustibleID")}
            />
            <NumberInput
              label="Consumo Promedio"
              placeholder="Ej: 8.5"
              required
              min={1}
              step={0.1}
              decimalScale={2}
              suffix=" L/100km"
              decimalSeparator=","
              {...form.getInputProps("consumoPromedio")}
            />
          </SimpleGrid>
        </Card>

        {/* Información de Ruedas */}
        <Card shadow="sm" p="xl" radius="md" withBorder>
          <Group gap="sm" mb="lg">
            <IconRuler size={24} stroke={1.5} />
            <Box>
              <Text fw={600} size="lg">
                Información de Ruedas y Capacidad
              </Text>
              <Text size="sm" c="dimmed">
                Detalles sobre ruedas y capacidad de carga
              </Text>
            </Box>
          </Group>

          <Divider mb="lg" />

          <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="lg">
            <Select
              label="Tipo de Rueda"
              placeholder="Seleccione"
              required
              data={tiposRueda}
              searchable
              filter={filterIgnoreAccents}
              {...form.getInputProps("tipoRuedaID")}
            />
            <NumberInput
              label="Cantidad de Ruedas"
              placeholder="Ej: 4"
              required
              min={2}
              max={20}
              {...form.getInputProps("cantidadRuedas")}
            />
            <NumberInput
              label="Peso Máximo"
              placeholder="Ej: 1500"
              required
              min={0}
              step={0.1}
              decimalScale={2}
              suffix=" kg"
              thousandSeparator="."
              decimalSeparator=","
              {...form.getInputProps("pesoMaximo")}
            />
          </SimpleGrid>
        </Card>

        {/* Botones de acción */}
        <Card shadow="sm" p="lg" radius="md" withBorder>
          <Group justify="flex-end" gap="md">
            <Button variant="light" color="gray" onClick={onCancel} size="md">
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={loading}
              size="md"
              leftSection={<IconCheck size={18} />}
            >
              {isEdit ? "Guardar Cambios" : "Crear Vehículo"}
            </Button>
          </Group>
        </Card>
      </Stack>
    </form>
  );
};

export default VehiculoForm;
