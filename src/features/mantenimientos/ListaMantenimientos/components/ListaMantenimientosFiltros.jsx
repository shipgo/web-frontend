import { useForm } from "@mantine/form";
import { useDebouncedCallback } from "@mantine/hooks";
import { Card, Flex, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

/**
 * Filtros mapeados 1:1 a `MantenimientoFilter` (backend,
 * `dto/filters/MantenimientoFilter.java` + `MantenimientoSpecification.fromFilter`):
 * - `nombre`   → contains sobre `nombreMecanico` / `apellidoMecanico` / la concatenación.
 * - `patente`  → contains sobre la patente del vehículo (reemplaza el viejo
 *   "mantenimientos por vehículo", ver bitácora de `SHG-FE-020`).
 *
 * No hay filtro de estado ni de fecha: `Mantenimiento` no tiene ciclo de vida y
 * `MantenimientoFilter` no expone rango de fechas.
 */
const DEFAULT_VALUES = { nombre: "", patente: "" };

const formatValues = (values) =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => !!value.trim())
      .map(([key, value]) => [key, { label: key, values: value.trim() }]),
  );

/**
 * @param {Object} props
 * @param {boolean} props.disabled
 * @param {(filters: Object) => void} props.onFiltersChange
 * @param {string} [props.initialPatente] - Precarga el input "Patente" (ej:
 *   `?patente=` al llegar desde "Historial mantenimiento" en Vehículos,
 *   SHG-FE-098). La lectura de la URL vive en `ListaMantenimientos/index.jsx`
 *   —la misma pasa como filtro inicial a `useGetMantenimientos`— para que el
 *   primer fetch salga ya filtrado en vez de disparar un segundo pedido acá.
 */
const ListaMantenimientosFiltros = ({ disabled, onFiltersChange, initialPatente = "" }) => {
  const debounceChange = useDebouncedCallback((values) => {
    onFiltersChange(formatValues(values));
  }, 500);

  const form = useForm({
    mode: "controlled",
    initialValues: { ...DEFAULT_VALUES, patente: initialPatente },
    enhanceGetInputProps: () => ({ disabled }),
    onValuesChange: (values) => {
      debounceChange(values);
    },
  });

  return (
    <Card component="search">
      <Flex gap="md">
        <TextInput
          {...form.getInputProps("nombre")}
          flex={1}
          label="Mecánico"
          placeholder="Nombre o apellido del mecánico..."
          rightSection={<IconSearch size={18} />}
        />

        <TextInput
          {...form.getInputProps("patente")}
          flex={1}
          label="Patente"
          placeholder="Ej: AB123CD"
          rightSection={<IconSearch size={18} />}
        />
      </Flex>
    </Card>
  );
};

export default ListaMantenimientosFiltros;
