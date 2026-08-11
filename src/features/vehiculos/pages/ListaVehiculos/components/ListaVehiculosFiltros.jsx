import { useState, useRef } from 'react';

import { useForm } from '@mantine/form';
import { useDebouncedCallback } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import { Card, Chip, Flex, MultiSelect, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import dayjs from 'dayjs';

const TIPOS = ['moto', 'auto', 'camioneta', 'camion'];
const ESTADOS = ['disponible', 'en_ruta', 'en_mantenimiento'];

const QUICK_FILTERS = [
  { label: 'Disponibles', getFilters: () => ({ estado: ['disponible'], tipo: [], search: '', date: [null, null] }) },
  { label: 'En ruta', getFilters: () => ({ estado: ['en_ruta'], tipo: [], search: '', date: [null, null] }) },
  { label: 'En mantenimiento', getFilters: () => ({ estado: ['en_mantenimiento'], tipo: [], search: '', date: [null, null] }) },
];

const DEFAULT_VALUES = { search: '', tipo: [], estado: [], date: [null, null] };

const ListaVehiculosFiltros = ({ disabled, onFiltersChange }) => {
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

  const handleQuickFilter = (label) => {
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
          label="Buscar vehículo"
          placeholder="Patente, marca o modelo..."
          rightSection={<IconSearch size={18} />}
        />

        <DatePickerInput
          {...form.getInputProps('date')}
          flex={1}
          type="range"
          clearable
          label="Fecha de incorporación"
          placeholder="Seleccioná un rango"
        />

        <MultiSelect
          {...form.getInputProps('tipo')}
          flex={1}
          label="Tipo"
          placeholder="Seleccioná..."
          data={TIPOS}
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
            onChange={() => handleQuickFilter(label)}
          >
            {label}
          </Chip>
        ))}
      </Flex>
    </Card>
  );
};

export default ListaVehiculosFiltros;
