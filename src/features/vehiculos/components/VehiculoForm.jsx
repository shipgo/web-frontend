import { useEffect, useState } from "react";
import {
  Card,
  Group,
  LoadingOverlay,
  NumberInput,
  Select,
  SimpleGrid,
  Stack,
  Title,
  TextInput,
} from "@mantine/core";
import { IconCar, IconRuler, IconGauge } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";

import {
  combustibleApi,
  marcaApi,
  modeloApi,
  tipoRuedaApi,
  tipoVehiculoApi,
} from "../api/vehiculos.api";
import { useVehiculoFormContext } from "../context/VehiculoFormContext";

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
 * Cuerpo del formulario de vehículos (crear / editar). Toma el form del
 * `VehiculoFormProvider` (contexto compartido) — igual que `SeccionOrigen` /
 * `SeccionCarga` de `CrearEnvios`. Se mantiene como un único componente
 * (ver bitácora de `SHG-FE-034`): ya está organizado en tres `Card` por
 * sección y `SHG-FE-018` va a reescribir estos campos, así que partirlo ahora
 * en archivos `SeccionX` sería trabajo que se tira.
 */
const VehiculoForm = () => {
  const form = useVehiculoFormContext();

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
    <Stack>
      {/* Información del Vehículo */}
      <Card pos="relative">
        <LoadingOverlay
          visible={catalogsLoading}
          overlayProps={{ radius: "md", blur: 2 }}
        />

        <Stack gap="md">
          <Group gap="0.75rem">
            <IconCar size={20} />
            <Title order={4}>Información del vehículo</Title>
          </Group>

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
      <Card>
        <Stack gap="md">
          <Group gap="0.75rem">
            <IconGauge size={20} />
            <Title order={4}>Especificaciones técnicas</Title>
          </Group>

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
        </Stack>
      </Card>

      {/* Información de Ruedas */}
      <Card>
        <Stack gap="md">
          <Group gap="0.75rem">
            <IconRuler size={20} />
            <Title order={4}>Información de ruedas y capacidad</Title>
          </Group>

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
        </Stack>
      </Card>
    </Stack>
  );
};

export default VehiculoForm;
