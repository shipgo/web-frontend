import { useState, useRef } from 'react';

import { useForm } from '@mantine/form';
import { useDebouncedCallback } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import { Card, Chip, Flex, MultiSelect, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import dayjs from 'dayjs';

const ESTADOS = ['pendiente', 'en camino', 'completado', 'cancelado'];

const QUICK_FILTERS = [
  { label: 'Pendientes', getFilters: () => ({ estado: ['pendiente'], search: '', date: [null, null] }) },
  { label: 'En camino', getFilters: () => ({ estado: ['en camino'], search: '', date: [null, null] }) },
  { label: 'Últimos 7 días', getFilters: () => ({ estado: [], search: '', date: [dayjs().subtract(7, 'day'), dayjs()] }) },
];

const DEFAULT_VALUES = { search: '', estado: [], date: [null, null] };

const ListaEnviosFiltros = ({ disabled, onFiltersChange }) => {
  const [selectedQuickFilter, setSelectedQuickFilter] = useState(null);
  const lastSearchRef = useRef('');
  const isQuickFilterChange = useRef(false);

  const debounceSearch = useDebouncedCallback((values) => {
    onFiltersChange(values);
  }, 500);

  const form = useForm({
    mode: 'controlled',
    initialValues: DEFAULT_VALUES,
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

  const handleQuickFilterChange = (label) => {
    const isDeselecting = selectedQuickFilter === label;
    const next = isDeselecting ? null : label;
    setSelectedQuickFilter(next);
    isQuickFilterChange.current = true;
    form.setValues(next ? QUICK_FILTERS.find((f) => f.label === label).getFilters() : DEFAULT_VALUES);
  };

  return (
    <Card component="search">
      <Flex mb="md" gap="md">
        <TextInput
          {...form.getInputProps('search')}
          flex={1}
          label="Buscar envío"
          placeholder="Código, dirección o localidad..."
          rightSection={<IconSearch size={18} />}
        />

        <DatePickerInput
          {...form.getInputProps('date')}
          flex={1}
          type="range"
          clearable
          label="Rango de fechas"
          placeholder="Seleccioná un rango"
        />

        <MultiSelect
          {...form.getInputProps('estado')}
          flex={1}
          label="Estado"
          placeholder="Seleccioná..."
          data={ESTADOS}
        />
      </Flex>

      <Flex gap="xs">
        {QUICK_FILTERS.map(({ label }) => (
          <Chip
            key={label}
            disabled={disabled}
            variant="light"
            checked={selectedQuickFilter === label}
            onChange={() => handleQuickFilterChange(label)}
          >
            {label}
          </Chip>
        ))}
      </Flex>
    </Card>
  );
};

export default ListaEnviosFiltros;
