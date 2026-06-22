import { useState, useRef } from "react";

import { useForm } from "@mantine/form";
import { DatePickerInput } from "@mantine/dates";
import { useDebouncedCallback } from "@mantine/hooks";
import { Card, Chip, Flex, MultiSelect, TextInput } from "@mantine/core";

import dayjs from "dayjs";
import { IconSearch } from "@tabler/icons-react";

const QUICK_FILTERS = [
  {
    label: "Salen hoy",
    getDefaultFilters: () => ({
      status: ["Planificado", "Asignado"],
      date: [dayjs(), dayjs()],
      search: "",
    }),
  },
  {
    label: "Atrasados",
    getDefaultFilters: () => ({
      status: ["Planificado", "Asignado"],
      date: [null, null],
      search: "",
    }),
  },
  {
    label: "En curso",
    getDefaultFilters: () => ({
      status: ["En curso"],
      date: [null, null],
      search: "",
    }),
  },
  {
    label: "Últimos 7 días",
    getDefaultFilters: () => ({
      status: [],
      date: [dayjs().subtract(7, "day"), dayjs()],
      search: "",
    }),
  },
];
const DEFAULT_FILTER = QUICK_FILTERS[0];
const DEFAULT_VALUES = {
  search: "",
  status: [],
  date: [null, null],
};

const ListaViajesFiltros = ({ disabled, onFiltersChange }) => {
  const [selectedQuickFilter, setSelectedQuickFilter] = useState(
    DEFAULT_FILTER.label,
  );

  const lastSearchRef = useRef(DEFAULT_FILTER.search);
  const isQuickFilterChange = useRef(false);

  const debounceSearch = useDebouncedCallback((valores) => {
    onFiltersChange(valores);
  }, 500);

  const form = useForm({
    mode: "controlled",
    initialValues: DEFAULT_FILTER.getDefaultFilters(),
    enhanceGetInputProps: () => ({ disabled }),
    onValuesChange: (values) => {
      if (isQuickFilterChange.current) {
        isQuickFilterChange.current = false;
      } else {
        setSelectedQuickFilter(null);
      }

      if (values.date[0] && !values.date[1]) return;

      const searchChanged = values.search !== lastSearchRef.current;
      lastSearchRef.current = values.search;

      if (searchChanged) {
        debounceSearch(values);
        return;
      }

      debounceSearch.cancel();
      onFiltersChange(values);
    },
  });

  const handleQuickFilterChange = (clickedFilterLabel) => {
    const isDeselecting = selectedQuickFilter === clickedFilterLabel;
    const nextFilter = isDeselecting ? null : clickedFilterLabel;

    setSelectedQuickFilter(nextFilter);
    isQuickFilterChange.current = true;

    const newValues = nextFilter
      ? QUICK_FILTERS.find((filter) => filter.label === nextFilter)?.getDefaultFilters()
      : DEFAULT_VALUES;

    form.setValues(newValues);
  };

  return (
    <Card component="search">
      <Flex mb="md" gap="md">
        <TextInput
          {...form.getInputProps("search")}
          flex={1}
          label="Buscar viaje"
          placeholder="Ingresá el nombre del viaje, patente o chofer..."
          rightSection={<IconSearch size={18} />}
        />

        <DatePickerInput
          {...form.getInputProps("date")}
          flex={1}
          type="range"
          label="Rango de fechas"
          placeholder="Seleccioná un rango de fecha"
        />

        <MultiSelect
          {...form.getInputProps("status")}
          flex={1}
          label="Estados"
          placeholder="Seleccioná..."
          data={[
            "Planificado",
            "Asignado",
            "En curso",
            "Finalizado",
            "Interrumpido",
          ]}
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
