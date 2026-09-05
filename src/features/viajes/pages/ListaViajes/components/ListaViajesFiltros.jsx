import { useRef, useState } from "react";

import { useForm } from "@mantine/form";
import { DatePickerInput } from "@mantine/dates";
import { useDebouncedCallback } from "@mantine/hooks";
import { Card, Chip, Flex, MultiSelect, TextInput } from "@mantine/core";

import dayjs from "dayjs";
import { IconSearch } from "@tabler/icons-react";

import { estadoOptions } from "@domain/estados";

const ESTADO_OPTIONS = estadoOptions("viaje");

const DEFAULT_VALUES = { search: "", estado: [], date: [null, null] };

/**
 * `ViajeFilter.fechaDesde`/`fechaHasta` son `LocalDateTime` sin offset — Jackson
 * no acepta el sufijo `Z` de `.toISOString()` (ver bug documentado en SHG-FE-008).
 */
const toLocalDateTimeString = (date) => dayjs(date).format("YYYY-MM-DDTHH:mm:ss");

/**
 * Convierte los valores del form (`search`, `estado`, `date`) al shape crudo de
 * `ViajeFilter` (CONTRACTS.md §4, cerrado por SHG-BE-005): `search`, `estado[]`
 * (valores canónicos), `fechaDesde`/`fechaHasta` sobre `fechaHoraInicioPlanificada`.
 */
const buildFilterParams = ({ search, estado, date }) => {
  const [desde, hasta] = date;
  return {
    search: search?.trim() || undefined,
    estado: estado?.length ? estado : undefined,
    fechaDesde: desde ? toLocalDateTimeString(dayjs(desde).startOf("day")) : undefined,
    fechaHasta: hasta ? toLocalDateTimeString(dayjs(hasta).endOf("day")) : undefined,
  };
};

/** `useParams`/`useGetViajes` esperan cada filtro como `{ label, values }`. */
const formatValues = (params) =>
  Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, { label: key, values: value }]),
  );

const QUICK_FILTERS = [
  {
    label: "Salen hoy",
    formValues: () => ({
      search: "",
      estado: ["planificado"],
      date: [dayjs().toDate(), dayjs().toDate()],
    }),
  },
  {
    label: "Atrasados",
    // CONTRACTS.md §4: estado=planificado + fechaHasta=<ahora>. No es un rango de
    // día (necesita el instante exacto), así que se pisan los params que generaría
    // el campo `date` en lugar de derivarlos de él.
    formValues: () => ({ search: "", estado: ["planificado"], date: [null, null] }),
    buildParams: () => ({ estado: ["planificado"], fechaHasta: toLocalDateTimeString(dayjs()) }),
  },
  {
    label: "En curso",
    formValues: () => ({ search: "", estado: ["en_camino"], date: [null, null] }),
  },
  {
    label: "Últimos 7 días",
    formValues: () => ({
      search: "",
      estado: [],
      date: [dayjs().subtract(7, "day").toDate(), dayjs().toDate()],
    }),
  },
];

const ListaViajesFiltros = ({ disabled, onFiltersChange }) => {
  const [selectedQuickFilter, setSelectedQuickFilter] = useState(null);

  const lastSearchRef = useRef("");
  const isQuickFilterChange = useRef(false);
  const quickFilterOverrideRef = useRef(null);

  const emitFilters = (values) => {
    const override = quickFilterOverrideRef.current;
    const params = override
      ? { search: values.search?.trim() || undefined, ...override }
      : buildFilterParams(values);
    onFiltersChange(formatValues(params));
  };

  const debounceChange = useDebouncedCallback(emitFilters, 500);

  const form = useForm({
    mode: "controlled",
    initialValues: DEFAULT_VALUES,
    enhanceGetInputProps: () => ({ disabled }),
    onValuesChange: (values) => {
      const isQuick = isQuickFilterChange.current;
      isQuickFilterChange.current = false;

      if (!isQuick) {
        setSelectedQuickFilter(null);
        quickFilterOverrideRef.current = null;
      }

      if (values.date[0] && !values.date[1]) return;

      const searchChanged = values.search !== lastSearchRef.current;
      lastSearchRef.current = values.search;

      if (isQuick) {
        debounceChange.cancel();
        emitFilters(values);
        return;
      }

      if (searchChanged) {
        debounceChange(values);
        return;
      }

      debounceChange.cancel();
      emitFilters(values);
    },
  });

  const handleQuickFilterChange = (clickedFilterLabel) => {
    const isDeselecting = selectedQuickFilter === clickedFilterLabel;
    const nextFilter = isDeselecting ? null : clickedFilterLabel;
    const filter = QUICK_FILTERS.find((quickFilter) => quickFilter.label === nextFilter);

    setSelectedQuickFilter(nextFilter);
    isQuickFilterChange.current = true;
    quickFilterOverrideRef.current = filter?.buildParams?.() ?? null;

    form.setValues(filter ? filter.formValues() : DEFAULT_VALUES);
  };

  return (
    <Card component="search">
      <Flex mb="md" gap="md">
        <TextInput
          {...form.getInputProps("search")}
          flex={1}
          label="Buscar viaje"
          placeholder="Patente del vehículo o nombre del chofer..."
          rightSection={<IconSearch size={18} />}
        />

        <DatePickerInput
          {...form.getInputProps("date")}
          flex={1}
          type="range"
          clearable
          label="Rango de fechas"
          placeholder="Seleccioná un rango de fecha"
        />

        <MultiSelect
          {...form.getInputProps("estado")}
          flex={1}
          label="Estados"
          placeholder="Seleccioná..."
          data={ESTADO_OPTIONS}
          clearable
        />
      </Flex>

      <Flex gap="xs">
        {QUICK_FILTERS.map((filter) => (
          <Chip
            disabled={disabled}
            variant="light"
            key={filter.label}
            checked={selectedQuickFilter === filter.label}
            onChange={() => handleQuickFilterChange(filter.label)}
          >
            {filter.label}
          </Chip>
        ))}
      </Flex>
    </Card>
  );
};

export default ListaViajesFiltros;
