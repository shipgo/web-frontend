import { useEffect, useRef, useState } from "react";

import { useForm } from "@mantine/form";
import { useDebouncedCallback } from "@mantine/hooks";
import { Card, Flex, NumberInput, Select, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import { marcaApi } from "../../api/catalogoVehiculos.api";

const DEFAULT_VALUES = { nombre: "", marcaId: null, anio: "" };

const formatValues = (values) =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => value !== "" && value !== null && value !== undefined)
      .map(([key, value]) => [key, { label: key, values: value }])
  );

const ListaModelosFiltros = ({ disabled, onFiltersChange }) => {
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
          placeholder="Ej: Sprinter"
          rightSection={<IconSearch size={18} />}
        />

        <Select
          {...form.getInputProps("marcaId")}
          flex={1}
          label="Marca"
          placeholder="Todas las marcas"
          data={marcas}
          searchable
          clearable
        />

        <NumberInput
          {...form.getInputProps("anio")}
          flex={1}
          label="Año"
          placeholder="Ej: 2020"
        />
      </Flex>
    </Card>
  );
};

export default ListaModelosFiltros;
