import { useRef, useState, useEffect } from "react";

import { useForm } from "@mantine/form";
import { useDebouncedCallback } from "@mantine/hooks";
import { Card, Chip, TextInput, Select, LoadingOverlay } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import { FilterSheet, useFieldSize } from "@components";
import { useIsMobile } from "@hooks/useIsMobile";
import { tipoVehiculoApi, combustibleApi } from "@api/vehiculo.api";

// Chips de acceso rápido por "familia" de tipo. `termino` es lo que se manda en
// `tipoVehiculo` (el backend filtra con `contains` insensible a mayúsculas sobre
// `tipoVehiculo.nombre`). Un chip sólo se muestra si algún tipo del catálogo real
// (`GET /api/tipoVehiculo/all`) contiene su término, así nunca da 0 resultados
// por apuntar a un tipo inexistente.
const QUICK_FILTER_CANDIDATES = [
  { label: "Camiones", termino: "Camión" },
  { label: "Trafic", termino: "Trafic" },
  { label: "Motos", termino: "Moto" },
];

const buildQuickFilters = (tipos) =>
  QUICK_FILTER_CANDIDATES.filter(({ termino }) =>
    tipos.some(({ value }) => value.toLowerCase().includes(termino.toLowerCase())),
  ).map(({ label, termino }) => ({
    label,
    getFilters: () => ({ patente: "", modelo: "", tipoVehiculo: termino, combustible: "" }),
  }));

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
  const quickFilters = buildQuickFilters(tiposVehiculo);
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
    form.setValues(next ? quickFilters.find((f) => f.label === label).getFilters() : DEFAULT_VALUES);
  };

  const size = useFieldSize();
  const isMobile = useIsMobile();
  const activeCount = Object.values(form.values).filter(Boolean).length;

  const content = (
    <>
      <LoadingOverlay visible={catalogsLoading} overlayProps={{ radius: "md", blur: 2 }} />
      <FilterSheet
        activeCount={activeCount}
        onClear={() => {
          setSelectedQuickFilter(null);
          form.setValues(DEFAULT_VALUES);
        }}
        search={
          <TextInput
            {...form.getInputProps("patente")}
            size={size}
            flex={1}
            label="Patente"
            placeholder="Ej: AB123CD"
            rightSection={<IconSearch size={18} />}
          />
        }
        quickFilters={
          quickFilters.length > 0
            ? quickFilters.map(({ label }) => (
                <Chip
                  key={label}
                  disabled={disabled}
                  variant="light"
                  checked={selectedQuickFilter === label}
                  onChange={() => handleQuickFilter(label)}
                >
                  {label}
                </Chip>
              ))
            : undefined
        }
      >
        <TextInput
          {...form.getInputProps("modelo")}
          size={size}
          flex={1}
          label="Modelo"
          placeholder="Ej: Hilux"
        />

        <Select
          {...form.getInputProps("tipoVehiculo")}
          size={size}
          flex={1}
          label="Tipo de vehículo"
          placeholder="Seleccioná un tipo"
          data={tiposVehiculo}
          searchable
          clearable
        />

        <Select
          {...form.getInputProps("combustible")}
          size={size}
          flex={1}
          label="Combustible"
          placeholder="Seleccioná un combustible"
          data={combustibles}
          searchable
          clearable
        />
      </FilterSheet>
    </>
  );

  return isMobile ? (
    <div role="search" style={{ position: "relative" }}>{content}</div>
  ) : (
    <Card component="search">{content}</Card>
  );
};

export default ListaVehiculosFiltros;
