import { useCallback } from "react";

import { useForm } from "@mantine/form";
import { useFocusTrap } from "@mantine/hooks";
import { Button, Group, Select, SimpleGrid, TextInput } from "@mantine/core";

import { isNull } from "es-toolkit";
import { isEmpty } from "es-toolkit/compat";

const ENVIOS_FILTERS = ["Pendiente", "En camino", "Entregado", "Cancelado"];

const DEFAULT_VALUES = {
  localidad: "",
  provincia: "",
  estado: "",
};

const LABELS = {
  localidad: "Localidad",
  provincia: "Provincia",
  estado: "Estado del paquete",
};

const EnviosFilters = ({ onFiltersChange }) => {
  const focusTrapRef = useFocusTrap();

  const form = useForm({ initialValues: DEFAULT_VALUES });

  const formatValues = useCallback(
    ([key, value]) => [
      key,
      {
        label: LABELS[key],
        values: value,
      },
    ],
    []
  );

  const getFilledValues = useCallback(([key, value]) => {
    if (key.includes("fecha")) return !isNull(value);
    return !isEmpty(value);
  }, []);

  const handleSubmit = useCallback(
    (values) => {
      const formattedValues = Object.entries(values)
        .filter(getFilledValues)
        .map(formatValues);
      
      return onFiltersChange(Object.fromEntries(formattedValues));
    },
    [onFiltersChange, getFilledValues, formatValues]
  );

  return (
    <form ref={focusTrapRef} onSubmit={form.onSubmit(handleSubmit)}>
      <SimpleGrid cols={3}>
        <TextInput
          {...form.getInputProps("localidad")}
          label="Localidad"
          placeholder="Ej: CABA"
        />

        <TextInput
          {...form.getInputProps("provincia")}
          label="Provincia"
          placeholder="Ej: Buenos Aires"
        />

        <Select
          {...form.getInputProps("estado")}
          clearable
          label="Estado del paquete"
          placeholder="Seleccione el estado actual"
          data={ENVIOS_FILTERS}
        />

        {/* <DateInput
          {...form.getInputProps('fecha_registro')}
          clearable
          label="Fecha de registro"
          placeholder="Seleccione la fecha de envío"
        />

        <MultiSelect
          {...form.getInputProps('tipo_paquete')}
          multiple
          clearable
          label="Tipo de paquete"
          placeholder="Seleccione el tipo de contenido"
          data={['Documentos', 'Frágil', 'Electrónicos', 'Otros']}
        />

        <TextInput
          {...form.getInputProps('remitente')}
          label="Remitente"
          placeholder="Ej: Juan Pérez o Empresa XYZ"
        />

        <TextInput
          {...form.getInputProps('transportista')}
          label="Transportista designado"
          placeholder="Ej: Juan Pérez"
        /> */}
      </SimpleGrid>

      <Group gap="xs" mt="md">
        <Button type="submit" variant="light">
          Aplicar filtros
        </Button>

        <Button variant="subtle" onClick={form.reset}>
          Limpiar filtros
        </Button>
      </Group>
    </form>
  );
};

export default EnviosFilters;
