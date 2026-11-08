import { useState, useRef } from 'react';

import { useForm } from '@mantine/form';
import { useDebouncedCallback } from '@mantine/hooks';
import { Card, Chip, Select, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import { FilterSheet, useFieldSize } from '@components';
import { useIsMobile } from '@hooks/useIsMobile';
import {
  rolOptions,
  ROLE_ADMIN,
  ROLE_CARGA,
  ROLE_CHOFER,
  ROLE_SUPERUSER,
} from '@domain/roles';

const ROLES = rolOptions([ROLE_SUPERUSER, ROLE_ADMIN, ROLE_CHOFER, ROLE_CARGA]);

const QUICK_FILTERS = [
  { label: 'Choferes', getFilters: () => ({ nombre: '', email: '', username: '', authority: ROLE_CHOFER, localidad: '' }) },
  { label: 'Administradores', getFilters: () => ({ nombre: '', email: '', username: '', authority: ROLE_ADMIN, localidad: '' }) },
];

const DEFAULT_VALUES = { nombre: '', email: '', username: '', authority: '', localidad: '' };

const formatValues = (values) =>
  Object.fromEntries(
    Object.entries(values)
      .filter(([, value]) => !!value)
      .map(([key, value]) => [key, { label: key, values: value }])
  );

const ListaUsuariosFiltros = ({ disabled, onFiltersChange }) => {
  const [selectedQuickFilter, setSelectedQuickFilter] = useState(null);
  const lastValuesRef = useRef(DEFAULT_VALUES);
  const isQuickFilterChange = useRef(false);

  const debounceChange = useDebouncedCallback((values) => {
    onFiltersChange(formatValues(values));
  }, 500);

  const form = useForm({
    mode: 'controlled',
    initialValues: DEFAULT_VALUES,
    onValuesChange: (values) => {
      if (isQuickFilterChange.current) {
        isQuickFilterChange.current = false;
      } else {
        setSelectedQuickFilter(null);
      }

      const textFieldChanged =
        values.nombre !== lastValuesRef.current.nombre ||
        values.email !== lastValuesRef.current.email ||
        values.username !== lastValuesRef.current.username;
      lastValuesRef.current = values;

      if (textFieldChanged) {
        debounceChange(values);
        return;
      }

      debounceChange.cancel();
      onFiltersChange(formatValues(values));
    },
  });

  const size = useFieldSize();
  const isMobile = useIsMobile();
  const activeCount = Object.values(form.values).filter(Boolean).length;

  const handleQuickFilter = (label) => {
    const isDeselecting = selectedQuickFilter === label;
    const next = isDeselecting ? null : label;
    setSelectedQuickFilter(next);
    isQuickFilterChange.current = true;
    form.setValues(next ? QUICK_FILTERS.find((f) => f.label === label).getFilters() : DEFAULT_VALUES);
  };

  const content = (
    <FilterSheet
      activeCount={activeCount}
      onClear={() => {
        setSelectedQuickFilter(null);
        form.setValues(DEFAULT_VALUES);
      }}
      search={
        <TextInput
          {...form.getInputProps('nombre')}
          size={size}
          flex={1}
          label="Nombre"
          placeholder="Ej: Juan"
        />
      }
      quickFilters={QUICK_FILTERS.map(({ label }) => (
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
    >
      <TextInput
        {...form.getInputProps('email')}
        size={size}
        flex={1}
        label="Email"
        placeholder="Ej: juan@example.com"
        rightSection={<IconSearch size={18} />}
      />

      <TextInput
        {...form.getInputProps('username')}
        size={size}
        flex={1}
        label="Usuario"
        placeholder="Ej: jperez"
      />

      <Select
        {...form.getInputProps('authority')}
        size={size}
        flex={1}
        clearable
        label="Rol"
        placeholder="Seleccioná un rol"
        data={ROLES}
      />

      <TextInput
        {...form.getInputProps('localidad')}
        size={size}
        flex={1}
        label="Localidad"
        placeholder="Ej: Rosario"
      />
    </FilterSheet>
  );

  return isMobile ? <div role="search">{content}</div> : <Card component="search">{content}</Card>;
};

export default ListaUsuariosFiltros;
