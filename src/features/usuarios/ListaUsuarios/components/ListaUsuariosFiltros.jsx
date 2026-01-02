import { useCallback } from "react";

import { useForm } from "@mantine/form";
import { useFocusTrap } from "@mantine/hooks";
import { Button, Group, Select, SimpleGrid, TextInput } from "@mantine/core";

import { isNull } from "es-toolkit";
import { isEmpty } from "es-toolkit/compat";

const ROLES_FILTERS = ["ROLE_ADMIN", "ROLE_USER", "ROLE_CHOFER"];

const DEFAULT_VALUES = {
  nombre: "",
  apellido: "",
  email: "",
  username: "",
  authority: "",
  sucursal: "",
};

const LABELS = {
  nombre: "Nombre",
  apellido: "Apellido",
  email: "Email",
  username: "Usuario",
  authority: "Rol",
  sucursal: "Sucursal",
};

const ListaUsuariosFiltros = ({ onFiltersChange }) => {
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
          {...form.getInputProps("nombre")}
          label="Nombre"
          placeholder="Ej: Juan"
        />

        <TextInput
          {...form.getInputProps("apellido")}
          label="Apellido"
          placeholder="Ej: Pérez"
        />

        <TextInput
          {...form.getInputProps("email")}
          label="Email"
          placeholder="Ej: juan@example.com"
        />

        <TextInput
          {...form.getInputProps("username")}
          label="Usuario"
          placeholder="Ej: jperez"
        />

        <Select
          {...form.getInputProps("authority")}
          clearable
          label="Rol"
          placeholder="Seleccione el rol"
          data={ROLES_FILTERS}
        />

        <TextInput
          {...form.getInputProps("sucursal")}
          label="Sucursal"
          placeholder="Ej: Central"
        />
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

export default ListaUsuariosFiltros;
