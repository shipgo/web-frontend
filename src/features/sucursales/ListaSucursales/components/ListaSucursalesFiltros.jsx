import { useRef } from "react";

import { useForm } from "@mantine/form";
import { useDebouncedCallback } from "@mantine/hooks";
import { Card, Flex, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import FilterSheet from "@components/FilterSheet";
import { useFieldSize } from "@components/useFieldSize";
import { useIsMobile } from "@hooks/useIsMobile";

const DEFAULT_VALUES = { nombre: "", email: "", telefono: "", direccion: "" };

const formatValues = (values) =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => !!value)
      .map(([key, value]) => [key, { label: key, values: value }])
  );

const ListaSucursalesFiltros = ({ onFiltersChange, resultsCount }) => {
  const size = useFieldSize();
  const isMobile = useIsMobile();
  const lastValuesRef = useRef(DEFAULT_VALUES);

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
      placeholder="Ej: Sucursal Centro"
      rightSection={<IconSearch size={18} />}
    />
  );

  const emailField = (
    <TextInput
      {...form.getInputProps("email")}
      flex={1}
      size={size}
      label="Email"
      placeholder="Ej: sucursal@shipgo.com"
    />
  );

  const telefonoField = (
    <TextInput
      {...form.getInputProps("telefono")}
      flex={1}
      size={size}
      label="Teléfono"
      placeholder="Ej: 3511234567"
    />
  );

  const direccionField = (
    <TextInput
      {...form.getInputProps("direccion")}
      flex={1}
      size={size}
      label="Dirección"
      placeholder="Ej: Av. Colón 1234"
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
        {emailField}
        {telefonoField}
        {direccionField}
      </FilterSheet>
    );
  }

  return (
    <Card component="search">
      <Flex gap="md">
        {nombreField}
        {emailField}
        {telefonoField}
        {direccionField}
      </Flex>
    </Card>
  );
};

export default ListaSucursalesFiltros;
