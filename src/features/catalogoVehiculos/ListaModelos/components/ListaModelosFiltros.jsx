import { useEffect, useRef, useState } from "react";

import { useForm } from "@mantine/form";
import { useDebouncedCallback } from "@mantine/hooks";
import { Card, Flex, NumberInput, Select, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import FilterSheet from "@components/FilterSheet";
import { useFieldSize } from "@components/useFieldSize";
import { useIsMobile } from "@hooks/useIsMobile";

import { marcaApi } from "../../api/catalogoVehiculos.api";

const DEFAULT_VALUES = { nombre: "", marcaId: null, anio: "" };

const formatValues = (values) =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== "" && value !== null && value !== undefined)
      .map(([key, value]) => [key, { label: key, values: value }])
  );

const ListaModelosFiltros = ({ onFiltersChange, resultsCount }) => {
  const size = useFieldSize();
  const isMobile = useIsMobile();
  const lastValuesRef = useRef(DEFAULT_VALUES);
  const [marcas, setMarcas] = useState([]);

  useEffect(() => {
    marcaApi
      .getAll()
      .then((marcasRes) =>
        setMarcas(marcasRes.map((m) => ({ value: m.id.toString(), label: m.nombre })))
      )
      .catch((error) => console.error("Error cargando marcas:", error));
  }, []);

  const debounceChange = useDebouncedCallback((values) => {
    onFiltersChange(formatValues(values));
  }, 500);

  const form = useForm({
    mode: "controlled",
    initialValues: DEFAULT_VALUES,
    onValuesChange: (values) => {
      lastValuesRef.current = values;
      debounceChange(values);
    },
  });

  const handleClear = () => {
    form.reset();
    onFiltersChange({});
  };

  const nombreField = (
    <TextInput
      {...form.getInputProps("nombre")}
      flex={1}
      size={size}
      label="Nombre"
      placeholder="Ej: Sprinter"
      rightSection={<IconSearch size={18} />}
    />
  );

  const marcaField = (
    <Select
      {...form.getInputProps("marcaId")}
      flex={1}
      size={size}
      label="Marca"
      placeholder="Todas las marcas"
      data={marcas}
      searchable
      clearable
    />
  );

  const anioField = (
    <NumberInput
      {...form.getInputProps("anio")}
      flex={1}
      size={size}
      label="Año"
      placeholder="Ej: 2020"
    />
  );

  if (isMobile) {
    return (
      <FilterSheet
        search={nombreField}
        activeCount={Object.keys(formatValues(form.values)).length}
        resultsCount={resultsCount}
        onClear={handleClear}
      >
        {marcaField}
        {anioField}
      </FilterSheet>
    );
  }

  return (
    <Card component="search">
      <Flex gap="md">
        {nombreField}
        {marcaField}
        {anioField}
      </Flex>
    </Card>
  );
};

export default ListaModelosFiltros;
