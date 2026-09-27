import { useRef, useState, useEffect } from "react";

import { useForm } from "@mantine/form";
import { useDebouncedCallback } from "@mantine/hooks";
import { Card, Chip, Flex, TextInput, Select, LoadingOverlay } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import { tipoVehiculoApi, combustibleApi } from "@api/vehiculo.api";

const QUICK_FILTERS = [
  {
    label: "Camiones",
    getFilters: () => ({ patente: "", modelo: "", tipoVehiculo: "Camión", combustible: "" }),
  },
  {
    label: "Camionetas",
    getFilters: () => ({ patente: "", modelo: "", tipoVehiculo: "Camioneta", combustible: "" }),
  },
];

const DEFAULT_VALUES = { patente: "", modelo: "", tipoVehiculo: "", combustible: "" };

const formatValues = (values) =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => !!value)
      .map(([key, value]) => [key, { label: key, values: value }])
  );

const ListaVehiculosFiltros = ({ disabled, onFiltersChange }) => {
  const [selectedQuickFilter, setSelectedQuickFilter] = useState(null);
  const [tiposVehiculo, setTiposVehiculo] = useState([]);
  const [combustibles, setCombustibles] = useState([]);
  const [catalogsLoading, setCatalogsLoading] = useState(true);
  const lastValuesRef = useRef(DEFAULT_VALUES);
  const isQuickFilterChange = useRef(false);

  // Cargar catálogos
  useEffect(() => {
    const loadCatalogs = async () => {
      try {
        setCatalogsLoading(true);
        const [tiposRes, combustiblesRes] = await Promise.all([
          tipoVehiculoApi.getAll(),
          combustibleApi.getAll(),
        ]);

        setTiposVehiculo(
          tiposRes.map((t) => ({
            value: t.nombre,
            label: t.nombre,
          }))
        );

        setCombustibles(
          combustiblesRes.map((c) => ({
            value: c.nombre,
            label: c.nombre,
          }))
        );
      } catch (error) {
        console.error("Error cargando catálogos:", error);
      } finally {
        setCatalogsLoading(false);
      }
    };

    loadCatalogs();
  }, []);

  const debounceChange = useDebouncedCallback((values) => {
    onFiltersChange(formatValues(values));
  }, 500);

  const form = useForm({
    mode: "controlled",
    initialValues: DEFAULT_VALUES,
    enhanceGetInputProps: () => ({ disabled }),
    onValuesChange: (values) => {
      if (isQuickFilterChange.current) {
        isQuickFilterChange.current = false;
      } else {
        setSelectedQuickFilter(null);
      }

      const textFieldChanged =
        values.patente !== lastValuesRef.current.patente ||
        values.modelo !== lastValuesRef.current.modelo;
      lastValuesRef.current = values;

      if (textFieldChanged) {
        debounceChange(values);
        return;
      }

      debounceChange.cancel();
      onFiltersChange(formatValues(values));
    },
  });

  const handleQuickFilter = (label) => {
    const isDeselecting = selectedQuickFilter === label;
    const next = isDeselecting ? null : label;
    setSelectedQuickFilter(next);
    isQuickFilterChange.current = true;
    form.setValues(next ? QUICK_FILTERS.find((f) => f.label === label).getFilters() : DEFAULT_VALUES);
  };

  return (
    <Card component="search">
      <LoadingOverlay visible={catalogsLoading} overlayProps={{ radius: "md", blur: 2 }} />
      <Flex mb="md" gap="md">
        <TextInput
          {...form.getInputProps("patente")}
          flex={1}
          label="Patente"
          placeholder="Ej: AB123CD"
          rightSection={<IconSearch size={18} />}
        />

        <TextInput
          {...form.getInputProps("modelo")}
          flex={1}
          label="Modelo"
          placeholder="Ej: Hilux"
        />

        <Select
          {...form.getInputProps("tipoVehiculo")}
          flex={1}
          label="Tipo de vehículo"
          placeholder="Seleccionar tipo"
          data={tiposVehiculo}
          searchable
          clearable
        />

        <Select
          {...form.getInputProps("combustible")}
          flex={1}
          label="Combustible"
          placeholder="Seleccionar combustible"
          data={combustibles}
          searchable
          clearable
        />
      </Flex>

      <Flex gap="xs">
        {QUICK_FILTERS.map(({ label }) => (
          <Chip
            key={label}
            disabled={disabled}
            variant="light"
            checked={selectedQuickFilter === label}
            onChange={() => handleQuickFilter(label)}
          >
            {label}
          </Chip>
        ))}
      </Flex>
    </Card>
  );
};

export default ListaVehiculosFiltros;
