import { useState, useRef } from 'react';

import { useForm } from '@mantine/form';
import { useDebouncedCallback } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import { Card, Chip, Flex, MultiSelect, TextInput } from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';

import dayjs from 'dayjs';

import { estadoOptions } from '@domain/estados';

const ESTADO_OPTIONS = estadoOptions('envio');

const DEFAULT_VALUES = { search: '', destino: '', estado: [], date: [null, null] };

/**
 * Quick-filters → combinaciones reales de `EnvioFilter` (CONTRACTS.md §4 / SHG-BE-004):
 * - "Pendientes" y "Salen hoy" comparten `estado=en_sucursal`; "Salen hoy" además
 *   acota `fechaDesde`/`fechaHasta` al día de hoy (fecha de alta).
 * - "En camino" usa el estado canónico `en_camino` directamente.
 */
const QUICK_FILTERS = [
  {
    label: 'Pendientes',
    getValues: () => ({ ...DEFAULT_VALUES, estado: ['en_sucursal'] }),
  },
  {
    label: 'Salen hoy',
    getValues: () => ({
      ...DEFAULT_VALUES,
      estado: ['en_sucursal'],
      date: [dayjs().startOf('day'), dayjs().endOf('day')],
    }),
  },
  {
    label: 'En camino',
    getValues: () => ({ ...DEFAULT_VALUES, estado: ['en_camino'] }),
  },
];

/** Arma el objeto de filtros que consume `useGetEnvios` (`{ [param]: { label, values } }`). */
const buildFilters = (values) => {
  const filters = {};

  if (values.search) filters.search = { label: 'search', values: values.search };
  if (values.destino) filters.destino = { label: 'destino', values: values.destino };
  if (values.estado?.length) filters.estado = { label: 'estado', values: values.estado };

  const [desde, hasta] = values.date ?? [null, null];
  if (desde) {
    filters.fechaDesde = { label: 'fechaDesde', values: dayjs(desde).format('YYYY-MM-DD') };
  }
  if (hasta) {
    filters.fechaHasta = { label: 'fechaHasta', values: dayjs(hasta).format('YYYY-MM-DD') };
  }

  return filters;
};

const ListaEnviosFiltros = ({ disabled, onFiltersChange }) => {
  const [selectedQuickFilter, setSelectedQuickFilter] = useState(null);
  const isQuickFilterChange = useRef(false);

  const debounceChange = useDebouncedCallback((values) => {
    onFiltersChange(buildFilters(values));
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

      // Evitar disparar el filtro con un rango de fechas incompleto (sólo el "desde" seleccionado).
      if (values.date[0] && !values.date[1]) return;

      debounceChange(values);
    },
  });

  const handleQuickFilterChange = (label) => {
    const isDeselecting = selectedQuickFilter === label;
    const next = isDeselecting ? null : label;
    setSelectedQuickFilter(next);
    isQuickFilterChange.current = true;
    debounceChange.cancel();

    const nextValues = next ? QUICK_FILTERS.find((f) => f.label === label).getValues() : DEFAULT_VALUES;
    form.setValues(nextValues);
    onFiltersChange(buildFilters(nextValues));
  };

  return (
    <Card component="search">
      <Flex mb="md" gap="md">
        <TextInput
          {...form.getInputProps('search')}
          flex={1}
          label="Buscar envío"
          placeholder="Nombre, apellido o código de seguimiento..."
          rightSection={<IconSearch size={18} />}
        />

        <TextInput
          {...form.getInputProps('destino')}
          flex={1}
          label="Destino"
          placeholder="Calle, localidad o provincia..."
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

        <MultiSelect
          {...form.getInputProps('estado')}
          flex={1}
          label="Estado"
          placeholder="Seleccioná..."
          data={ESTADO_OPTIONS}
          clearable
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
