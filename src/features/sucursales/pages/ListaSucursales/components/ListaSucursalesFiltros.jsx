import { useState, useRef } from 'react';

import { useForm } from '@mantine/form';
import { useDebouncedCallback } from '@mantine/hooks';
import { Card, Chip, Flex, MultiSelect, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

const ESTADOS = ['activa', 'inactiva'];

const QUICK_FILTERS = [
  { label: 'Activas', getFilters: () => ({ estado: ['activa'], search: '' }) },
  { label: 'Inactivas', getFilters: () => ({ estado: ['inactiva'], search: '' }) },
];

const DEFAULT_VALUES = { search: '', estado: [] };

const ListaSucursalesFiltros = ({ disabled, onFiltersChange }) => {
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
          label="Buscar sucursal"
          placeholder="Nombre, dirección o localidad..."
          rightSection={<IconSearch size={18} />}
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

export default ListaSucursalesFiltros;
