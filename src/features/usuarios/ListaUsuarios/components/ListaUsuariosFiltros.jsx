import { useState, useRef } from 'react';

import { useForm } from '@mantine/form';
import { useDebouncedCallback } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import { Card, Chip, Flex, MultiSelect, Select, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import dayjs from 'dayjs';

const ROLES = ['admin', 'operador', 'chofer'];
const ESTADOS = ['activo', 'inactivo'];

const QUICK_FILTERS = [
  { label: 'Choferes', getFilters: () => ({ rol: 'chofer', estado: [], search: '', date: [null, null] }) },
  { label: 'Activos', getFilters: () => ({ rol: '', estado: ['activo'], search: '', date: [null, null] }) },
  { label: 'Últimos 30 días', getFilters: () => ({ rol: '', estado: [], search: '', date: [dayjs().subtract(30, 'day'), dayjs()] }) },
];

const DEFAULT_VALUES = { search: '', rol: '', estado: [], date: [null, null] };

const ListaUsuariosFiltros = ({ disabled, onFiltersChange }) => {
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
          label="Buscar usuario"
          placeholder="Nombre o email..."
          rightSection={<IconSearch size={18} />}
        />

        <DatePickerInput
          {...form.getInputProps('date')}
          flex={1}
          type="range"
          clearable
          label="Fecha de alta"
          placeholder="Seleccioná un rango"
        />

        <Select
          {...form.getInputProps('rol')}
          flex={1}
          clearable
          label="Rol"
          placeholder="Seleccioná un rol"
          data={ROLES}
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

export default ListaUsuariosFiltros;
