import { useForm } from "@mantine/form";
import { useDebouncedCallback } from "@mantine/hooks";
import { Card, Flex, TextInput } from "@mantine/core";
import { IconSearch } from "@tabler/icons-react";

import FilterSheet from "@components/FilterSheet";
import { useFieldSize } from "@components/useFieldSize";
import { useIsMobile } from "@hooks/useIsMobile";

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
 * @param {(filters: Object) => void} props.onFiltersChange
 * @param {string} [props.initialPatente] - Precarga el input "Patente" (ej:
 *   `?patente=` al llegar desde "Historial mantenimiento" en Vehículos,
 *   SHG-FE-098). La lectura de la URL vive en `ListaMantenimientos/index.jsx`
 *   —la misma pasa como filtro inicial a `useGetMantenimientos`— para que el
 *   primer fetch salga ya filtrado en vez de disparar un segundo pedido acá.
 */
const ListaMantenimientosFiltros = ({ onFiltersChange, initialPatente = "", resultsCount }) => {
  const size = useFieldSize();
  const isMobile = useIsMobile();
  const debounceChange = useDebouncedCallback((values) => {
    onFiltersChange(formatValues(values));
  }, 500);

  const form = useForm({
    mode: "controlled",
    initialValues: { ...DEFAULT_VALUES, patente: initialPatente },
    onValuesChange: (values) => {
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
      label="Mecánico"
      placeholder="Nombre o apellido del mecánico..."
      rightSection={<IconSearch size={18} />}
    />
  );

  const patenteField = (
    <TextInput
      {...form.getInputProps("patente")}
      flex={1}
      size={size}
      label="Patente"
      placeholder="Ej: AB123CD"
      rightSection={<IconSearch size={18} />}
    />
  );

  if (isMobile) {
    return (
      <FilterSheet
        search={patenteField}
        activeCount={Object.keys(formatValues(form.values)).length}
        resultsCount={resultsCount}
        onClear={handleClear}
      >
        {nombreField}
      </FilterSheet>
    );
  }

  return (
    <Card component="search">
      <Flex gap="md">
        {nombreField}
        {patenteField}
      </Flex>
    </Card>
  );
};

export default ListaMantenimientosFiltros;
