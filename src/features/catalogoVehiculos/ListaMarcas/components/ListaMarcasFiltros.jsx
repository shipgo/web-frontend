import { useRef } from "react";

import { useForm } from "@mantine/form";
import { useDebouncedCallback } from "@mantine/hooks";
import { Card, Flex, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

const DEFAULT_VALUES = { nombre: "" };

const formatValues = (values) =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => !!value)
      .map(([key, value]) => [key, { label: key, values: value }])
  );

const ListaMarcasFiltros = ({ disabled, onFiltersChange }) => {
  const lastValuesRef = useRef(DEFAULT_VALUES);

  const debounceChange = useDebouncedCallback((values) => {
    onFiltersChange(formatValues(values));
  }, 500);

  const form = useForm({
    mode: "controlled",
    initialValues: DEFAULT_VALUES,
    enhanceGetInputProps: () => ({ disabled }),
    onValuesChange: (values) => {
      lastValuesRef.current = values;
      debounceChange(values);
    },
  });

  return (
    <Card component="search">
      <Flex gap="md">
        <TextInput
          {...form.getInputProps("nombre")}
          flex={1}
          label="Nombre"
          placeholder="Ej: Mercedes-Benz"
          rightSection={<IconSearch size={18} />}
        />
      </Flex>
    </Card>
  );
};

export default ListaMarcasFiltros;
